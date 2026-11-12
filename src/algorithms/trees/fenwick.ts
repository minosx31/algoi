import { TreeTracer, type TreeShape } from "../../core/trace";
import type { TreeAlgorithm, TreeMark } from "../../core/types";

type Marks = Partial<Record<number, TreeMark>>;

const low = (i: number) => i & -i;
const ones = (i: number) => i.toString(2).replace(/0/g, "").length;

/** Values 1 to 9 from the keys (1-indexed), a prefix with at least two hops, and an update that lies inside that prefix. */
export function fenwickPlan(keys: number[]) {
  const n = keys.length;
  const values = [0, ...keys.map((k) => (k % 9) + 1)];
  const prefixes = Array.from({ length: n }, (_, i) => i + 1).filter((i) => ones(i) >= 2);
  const prefix = prefixes[keys[0] % prefixes.length];
  const index = 1 + (keys[1] % prefix);
  const delta = (keys[2] % 9) + 1;
  return { n, values, prefix, index, delta };
}

export const fenwick: TreeAlgorithm = {
  id: "fenwick",
  name: "Fenwick Tree",
  kind: "tree",
  topic: "tree",
  about: {
    summary: "Stores partial sums of an array in one array of the same size. Slot i holds the sum of the lowest-bit-sized block of values that ends at i, so a prefix sum adds a few slots and a point update touches a few slots, both found by adding or removing the lowest set bit of the index.",
    invariants: [
      "Slot i holds the sum of a(i − lowbit(i)) + 1 through a(i), where lowbit(i) = i & −i.",
      "Drawn with the parent of i being i − lowbit(i), the slots a prefix query adds are the ancestors of i, and the root is the empty prefix.",
      "A prefix query takes at most log₂ n + 1 hops, one per set bit of the index. An update walks i += lowbit(i), also at most log₂ n + 1 slots.",
    ],
    useCases: [
      "Running totals that change, such as live score tables and cumulative histograms.",
      "Counting inversions and rank queries in competitive programming.",
      "A smaller and faster stand-in for a segment tree when the query is an invertible prefix sum.",
    ],
  },
  complexity: { best: "O(1)", average: "O(log n)", worst: "O(log n)", space: "O(n)" },
  code: {
    pseudo: `
procedure Build(a, n)                     // a is 1-indexed
  T ← array of n + 1 zeros
  for i ← 1 to n do
    T[i] ← T[i] + a[i]                                           @@build
    j ← i + lowbit(i)                                            @@build
    if j ≤ n then T[j] ← T[j] + T[i]                             @@build

procedure Prefix(T, i)                    // sum of a[1..i]
  s ← 0
  while i > 0 do
    s ← s + T[i]; i ← i − lowbit(i)                              @@hop
  return s                                                       @@done

procedure Update(T, n, i, d)              // a[i] ← a[i] + d
  while i ≤ n do
    T[i] ← T[i] + d; i ← i + lowbit(i)                           @@update
`,
    python: `
def build(a, n):
    t = [0] * (n + 1)
    for i in range(1, n + 1):
        t[i] += a[i]                                        @@build
        j = i + (i & -i)                                    @@build
        if j <= n: t[j] += t[i]                             @@build
    return t

def prefix(t, i):
    s = 0
    while i > 0:
        s += t[i]                                           @@hop
        i -= i & -i                                         @@hop
    return s                                                @@done

def update(t, n, i, d):
    while i <= n:
        t[i] += d                                           @@update
        i += i & -i                                         @@update
`,
    cpp: `
std::vector<int> build(const std::vector<int>& a, int n) {
    std::vector<int> t(n + 1, 0);
    for (int i = 1; i <= n; i++) {
        t[i] += a[i];                                       @@build
        int j = i + (i & -i);                               @@build
        if (j <= n) t[j] += t[i];                           @@build
    }
    return t;
}

int prefix(const std::vector<int>& t, int i) {
    int s = 0;
    for (; i > 0; i -= i & -i)
        s += t[i];                                          @@hop
    return s;                                               @@done
}

void update(std::vector<int>& t, int n, int i, int d) {
    for (; i <= n; i += i & -i)
        t[i] += d;                                          @@update
}
`,
    java: `
static int[] build(int[] a, int n) {
    int[] t = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        t[i] += a[i];                                       @@build
        int j = i + (i & -i);                               @@build
        if (j <= n) t[j] += t[i];                           @@build
    }
    return t;
}

static int prefix(int[] t, int i) {
    int s = 0;
    for (; i > 0; i -= i & -i)
        s += t[i];                                          @@hop
    return s;                                               @@done
}

static void update(int[] t, int n, int i, int d) {
    for (; i <= n; i += i & -i)
        t[i] += d;                                          @@update
}
`,
    javascript: `
function build(a, n) {
  const t = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    t[i] += a[i];                                           @@build
    const j = i + (i & -i);                                 @@build
    if (j <= n) t[j] += t[i];                               @@build
  }
  return t;
}

function prefix(t, i) {
  let s = 0;
  for (; i > 0; i -= i & -i)
    s += t[i];                                              @@hop
  return s;                                                 @@done
}

function update(t, n, i, d) {
  for (; i <= n; i += i & -i)
    t[i] += d;                                              @@update
}
`,
  },
  run(keys) {
    const { n, values, prefix, index, delta } = fenwickPlan(keys);
    const T = Array<number>(n + 1).fill(0);
    const kids = (i: number) => Array.from({ length: n }, (_, k) => k + 1).filter((j) => j - low(j) === i);
    const shape = (i: number): TreeShape => ({ id: i, value: T[i], children: kids(i).map(shape) });
    const t = new TreeTracer("Next operations", () => ({ roots: [shape(0)], array: Array.from({ length: n + 1 }, (_, i) => i) }));
    t.aux.items = [`prefix ${prefix}`, `add ${delta} at ${index}`, `prefix ${prefix}`];
    const bits = (i: number) => i.toString(2);
    const along = (visited: number[], marks: Marks = {}) => Object.assign(Object.fromEntries(visited.map((i) => [i, "path" as const])), marks);

    const build = () => {
      for (let i = 1; i <= n; i++) {
        const had = T[i];
        T[i] += values[i];
        const j = i + low(i);
        const marks: Marks = { [i]: "target" };
        const carried = had > 0 ? `${had} carried in + ` : "";
        let tail = `${i} + ${low(i)} = ${j} is past n = ${n}, so nothing is carried on.`;
        if (j <= n) {
          T[j] += T[i];
          marks[j] = "compare";
          tail = `Carry ${T[i]} on into T[${j}] (${i} + ${low(i)}), which becomes ${T[j]}.`;
        }
        const covers = low(i) === 1 ? `a[${i}]` : `a[${i - low(i) + 1}..${i}]`;
        t.step("build", `T[${i}] = ${carried}a[${i}] = ${values[i]} gives ${T[i]}, the sum of ${covers}. ${tail}`, { marks, vars: { i, "T[i]": T[i] } });
      }
    };

    const query = () => {
      t.aux.items.shift();
      const visited: number[] = [];
      let sum = 0;
      for (let i = prefix; i > 0; i -= low(i)) {
        sum += T[i];
        visited.push(i);
        const next = i - low(i);
        t.step("hop", `i = ${i} (${bits(i)} in binary): add T[${i}] = ${T[i]}, so the sum is ${sum}. Next i = ${i} − ${low(i)} = ${next}.`, { marks: along(visited.slice(0, -1), { [i]: "target" }), vars: { i, sum } });
      }
      t.step("done", `i reached 0, the root. prefix(${prefix}) = ${sum}, the sum of a[1..${prefix}].`, { marks: along(visited, { 0: "target" }), vars: { i: 0, sum } });
      return sum;
    };

    const update = () => {
      t.aux.items.shift();
      const touched: Marks = {};
      for (let i = index; i <= n; i += low(i)) {
        const was = T[i];
        T[i] += delta;
        touched[i] = "swap";
        const next = i + low(i);
        t.step("update", `i = ${i}: T[${i}] goes from ${was} to ${T[i]}. ${next <= n ? `Next i = ${i} + ${low(i)} = ${next}.` : `Next i = ${i} + ${low(i)} = ${next} is past n = ${n}, so stop.`}`, { marks: { ...touched }, vars: { i, "T[i]": T[i] } });
      }
    };

    t.step("build", `a = ${values.slice(1).join(", ")} (1-indexed). T[i] will hold the sum of the lowbit(i) values that end at i. The tree makes i − lowbit(i) the parent of i, and the root is the empty prefix.`);
    build();
    const before = query();
    update();
    const after = query();
    for (let i = 0; i <= n; i++) t.marks[i] = "done";
    t.answer = `prefix(${prefix}) is ${before}, then ${after} after adding ${delta} at index ${index}`;
    t.step("done", `Done. prefix(${prefix}) was ${before} and became ${after} once ${delta} was added to a[${index}].`);
    return t.frames;
  },
};
