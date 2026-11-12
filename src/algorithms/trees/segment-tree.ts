import { TreeTracer, binaryShape } from "../../core/trace";
import type { TreeAlgorithm, TreeMark } from "../../core/types";

type Seg = { id: number; value: number | string; lo: number; hi: number; left: Seg | null; right: Seg | null };
type Marks = Partial<Record<number, TreeMark>>;

/** The leaves of a segment tree need two slots each, so the page uses at most ten of the keys. */
const MAX_LEAVES = 10;

/**
 * Values 1 to 9 from the keys, a query range inside them, and one point update inside that range, so the
 * second query always differs from the first.
 */
export function segmentPlan(keys: number[]) {
  const values = keys.slice(0, MAX_LEAVES).map((k) => (k % 9) + 1);
  const n = values.length;
  let l = keys[0] % (n - 2);
  let r = l + 1 + (keys[1] % (n - 1 - l));
  if (l === 0 && r === n - 1) r--;
  const index = l + (keys[2] % (r - l + 1));
  const value = (values[index] + 4) % 9 + 1;
  return { values, l, r, index, value };
}

export const segmentTree: TreeAlgorithm = {
  id: "segment-tree",
  name: "Segment Tree",
  kind: "tree",
  topic: "tree",
  about: {
    summary: "A binary tree over an array where each node stores the sum of one range, the leaves hold single values, and each parent covers its two children. A range sum reads a few nodes instead of every element, and a point update fixes one root-to-leaf path.",
    invariants: [
      "Each node covers a range [lo, hi], its left child covers the first half, its right child the second half, and its sum is the sum of its children.",
      "A range query takes a node whole when its range lies inside the query, skips it when the ranges do not meet, and splits it otherwise.",
      "A query splits at most two nodes per level, so it touches O(log n) nodes.",
      "A point update changes the leaf and the sums of its ancestors only.",
    ],
    useCases: [
      "Range sum, minimum, or maximum queries over data that changes, as in analytics counters and leaderboards.",
      "Interval problems in competitive programming, such as counting inversions.",
      "Any query where the combine step is associative, such as gcd or bitwise or.",
    ],
  },
  complexity: { best: "O(log n)", average: "O(log n)", worst: "O(log n)", space: "O(n)" },
  code: {
    pseudo: `
procedure Build(node, lo, hi)
  if lo = hi then node.sum ← a[lo]; return
  mid ← (lo + hi) / 2
  Build(left, lo, mid); Build(right, mid + 1, hi)
  node.sum ← left.sum + right.sum                                @@build

procedure Query(node, lo, hi, l, r)
  if hi < l or lo > r then return 0                              @@skip
  if l ≤ lo and hi ≤ r then return node.sum                      @@take
  mid ← (lo + hi) / 2
  return Query(left, lo, mid, l, r) + Query(right, mid + 1, hi, l, r)   @@split

procedure Update(node, lo, hi, i, v)
  if lo = hi then node.sum ← v; return                           @@set
  mid ← (lo + hi) / 2
  Update the child whose range holds i
  node.sum ← left.sum + right.sum                                @@recompute
`,
    python: `
def build(t, a, node, lo, hi):
    if lo == hi: t[node] = a[lo]; return
    mid = (lo + hi) // 2
    build(t, a, 2 * node, lo, mid); build(t, a, 2 * node + 1, mid + 1, hi)
    t[node] = t[2 * node] + t[2 * node + 1]                 @@build

def query(t, node, lo, hi, l, r):
    if hi < l or lo > r: return 0                           @@skip
    if l <= lo and hi <= r: return t[node]                  @@take
    mid = (lo + hi) // 2
    return (query(t, 2 * node, lo, mid, l, r)               @@split
            + query(t, 2 * node + 1, mid + 1, hi, l, r))    @@split

def update(t, node, lo, hi, i, v):
    if lo == hi: t[node] = v; return                        @@set
    mid = (lo + hi) // 2
    if i <= mid: update(t, 2 * node, lo, mid, i, v)
    else: update(t, 2 * node + 1, mid + 1, hi, i, v)
    t[node] = t[2 * node] + t[2 * node + 1]                 @@recompute
`,
    cpp: `
void build(std::vector<int>& t, const std::vector<int>& a, int node, int lo, int hi) {
    if (lo == hi) { t[node] = a[lo]; return; }
    int mid = (lo + hi) / 2;
    build(t, a, 2 * node, lo, mid); build(t, a, 2 * node + 1, mid + 1, hi);
    t[node] = t[2 * node] + t[2 * node + 1];                @@build
}

int query(const std::vector<int>& t, int node, int lo, int hi, int l, int r) {
    if (hi < l || lo > r) return 0;                         @@skip
    if (l <= lo && hi <= r) return t[node];                 @@take
    int mid = (lo + hi) / 2;
    return query(t, 2 * node, lo, mid, l, r)                @@split
         + query(t, 2 * node + 1, mid + 1, hi, l, r);       @@split
}

void update(std::vector<int>& t, int node, int lo, int hi, int i, int v) {
    if (lo == hi) { t[node] = v; return; }                  @@set
    int mid = (lo + hi) / 2;
    if (i <= mid) update(t, 2 * node, lo, mid, i, v);
    else update(t, 2 * node + 1, mid + 1, hi, i, v);
    t[node] = t[2 * node] + t[2 * node + 1];                @@recompute
}
`,
    java: `
static void build(int[] t, int[] a, int node, int lo, int hi) {
    if (lo == hi) { t[node] = a[lo]; return; }
    int mid = (lo + hi) / 2;
    build(t, a, 2 * node, lo, mid); build(t, a, 2 * node + 1, mid + 1, hi);
    t[node] = t[2 * node] + t[2 * node + 1];                @@build
}

static int query(int[] t, int node, int lo, int hi, int l, int r) {
    if (hi < l || lo > r) return 0;                         @@skip
    if (l <= lo && hi <= r) return t[node];                 @@take
    int mid = (lo + hi) / 2;
    return query(t, 2 * node, lo, mid, l, r)                @@split
         + query(t, 2 * node + 1, mid + 1, hi, l, r);       @@split
}

static void update(int[] t, int node, int lo, int hi, int i, int v) {
    if (lo == hi) { t[node] = v; return; }                  @@set
    int mid = (lo + hi) / 2;
    if (i <= mid) update(t, 2 * node, lo, mid, i, v);
    else update(t, 2 * node + 1, mid + 1, hi, i, v);
    t[node] = t[2 * node] + t[2 * node + 1];                @@recompute
}
`,
    javascript: `
function build(t, a, node, lo, hi) {
  if (lo === hi) { t[node] = a[lo]; return; }
  const mid = (lo + hi) >> 1;
  build(t, a, 2 * node, lo, mid); build(t, a, 2 * node + 1, mid + 1, hi);
  t[node] = t[2 * node] + t[2 * node + 1];                  @@build
}

function query(t, node, lo, hi, l, r) {
  if (hi < l || lo > r) return 0;                           @@skip
  if (l <= lo && hi <= r) return t[node];                   @@take
  const mid = (lo + hi) >> 1;
  return query(t, 2 * node, lo, mid, l, r)                  @@split
       + query(t, 2 * node + 1, mid + 1, hi, l, r);         @@split
}

function update(t, node, lo, hi, i, v) {
  if (lo === hi) { t[node] = v; return; }                   @@set
  const mid = (lo + hi) >> 1;
  if (i <= mid) update(t, 2 * node, lo, mid, i, v);
  else update(t, 2 * node + 1, mid + 1, hi, i, v);
  t[node] = t[2 * node] + t[2 * node + 1];                  @@recompute
}
`,
  },
  run(keys) {
    const { values, l, r, index, value } = segmentPlan(keys);
    let nextId = 0;
    const leaves: Seg[] = [];
    const make = (lo: number, hi: number): Seg => {
      const mid = (lo + hi) >> 1;
      const node: Seg = { id: nextId++, value: lo === hi ? values[lo] : "?", lo, hi, left: null, right: null };
      if (lo === hi) leaves.push(node);
      else {
        node.left = make(lo, mid);
        node.right = make(mid + 1, hi);
      }
      return node;
    };
    const root = make(0, values.length - 1);
    const t = new TreeTracer("Next operations", () => ({ roots: [binaryShape(root)], array: leaves.map((leaf) => leaf.id) }));
    t.aux.items = ["build", `sum ${l}..${r}`, `set a[${index}] = ${value}`, `sum ${l}..${r}`];
    const range = (n: Seg) => `[${n.lo}..${n.hi}]`;
    const range2 = () => `[${l}..${r}]`;
    const sumOf = (n: Seg) => (n.left!.value as number) + (n.right!.value as number);

    const build = (n: Seg) => {
      if (!n.left || !n.right) return;
      build(n.left);
      build(n.right);
      n.value = sumOf(n);
      t.step("build", `Node ${range(n)} = ${n.left.value} + ${n.right.value} = ${n.value}.`, { marks: { [n.id]: "target", [n.left.id]: "compare", [n.right.id]: "compare" }, vars: { lo: n.lo, hi: n.hi, sum: n.value } });
    };

    const query = () => {
      t.aux.items.shift();
      const marks: Marks = {};
      let total = 0;
      const walk = (n: Seg) => {
        const vars = { lo: n.lo, hi: n.hi, l, r, total };
        if (n.hi < l || n.lo > r) {
          t.step("skip", `Node ${range(n)} does not meet ${range2()}, so it adds 0.`, { marks: { ...marks, [n.id]: "compare" }, vars });
          return;
        }
        if (l <= n.lo && n.hi <= r) {
          total += n.value as number;
          marks[n.id] = "target";
          t.step("take", `Node ${range(n)} lies inside ${range2()}, so take its sum ${n.value}. The total is ${total}.`, { marks: { ...marks }, vars: { ...vars, total } });
          return;
        }
        marks[n.id] = "path";
        t.step("split", `Node ${range(n)} overlaps ${range2()} only partly, so look at both halves.`, { marks: { ...marks, [n.id]: "compare" }, vars });
        walk(n.left!);
        walk(n.right!);
      };
      walk(root);
      t.step("take", `The taken nodes cover ${range2()} exactly, and their sums add up to ${total}.`, { marks: { ...marks }, vars: { l, r, total } });
      return total;
    };
    const update = () => {
      t.aux.items.shift();
      const path: Seg[] = [];
      for (let n = root; ; n = index <= (n.lo + n.hi) >> 1 ? n.left! : n.right!) {
        path.push(n);
        if (!n.left) break;
      }
      const leaf = path[path.length - 1];
      const old = leaf.value;
      leaf.value = value;
      t.step("set", `Set a[${index}] from ${old} to ${value}. Only this leaf and its ancestors change.`, { marks: { [leaf.id]: "swap" }, vars: { index, value } });
      const fixed: Marks = { [leaf.id]: "swap" };
      for (const n of path.slice(0, -1).reverse()) {
        const was = n.value;
        n.value = sumOf(n);
        fixed[n.id] = "swap";
        t.step("recompute", `Node ${range(n)} = ${n.left!.value} + ${n.right!.value} = ${n.value}, was ${was}.`, { marks: { ...fixed }, vars: { lo: n.lo, hi: n.hi, sum: n.value } });
      }
    };

    t.step("build", `The leaves hold the array ${values.join(", ")}. Every other node starts empty and will hold the sum of its range.`);
    t.aux.items.shift();
    build(root);
    const before = query();
    update();
    const after = query();
    const markDone = (n: Seg) => {
      t.marks[n.id] = "done";
      if (n.left) markDone(n.left);
      if (n.right) markDone(n.right);
    };
    markDone(root);
    t.answer = `Sum of ${range2()} is ${before}, then ${after} after a[${index}] became ${value}`;
    t.step("take", `Done. The sum of ${range2()} was ${before} and became ${after} once a[${index}] changed.`);
    return t.frames;
  },
};
