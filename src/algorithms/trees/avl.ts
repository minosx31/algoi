import { TreeTracer, binaryShape } from "../../core/trace";
import type { TreeAlgorithm, TreeMark } from "../../core/types";

type Node = { id: number; value: number; left: Node | null; right: Node | null; h: number };
type Marks = Partial<Record<number, TreeMark>>;

const height = (n: Node | null) => (n ? n.h : 0);
const fix = (n: Node) => void (n.h = 1 + Math.max(height(n.left), height(n.right)));
const balance = (n: Node) => height(n.left) - height(n.right);
const signed = (b: number) => (b > 0 ? `+${b}` : String(b));

/**
 * The first three keys are reordered so the first insertion that needs a rotation is a double one, left-right or
 * right-left by the parity of the first key. Random keys never reach a double rotation at size 3 and miss it in
 * about one run in four at size 9.
 */
export function insertionOrder(keys: number[]) {
  if (keys.length < 3) return keys;
  const [lo, mid, hi] = keys.slice(0, 3).sort((a, b) => a - b);
  return [...(keys[0] % 2 === 0 ? [hi, lo, mid] : [lo, hi, mid]), ...keys.slice(3)];
}

export const avl: TreeAlgorithm = {
  id: "avl",
  name: "AVL Tree",
  kind: "tree",
  topic: "tree",
  about: {
    summary: "A binary search tree that rebalances after every insert. Any node whose two subtrees differ in height by more than one is fixed by one or two rotations, so the height stays logarithmic.",
    invariants: [
      "Every node's balance factor, left height minus right height, is −1, 0, or +1.",
      "A rotation keeps the inorder order of the keys, so the tree is still a binary search tree.",
      "After an insert, the lowest unbalanced node is fixed by one rotation (left-left, right-right) or two (left-right, right-left), and nothing above it needs a fix.",
      "A tree with n keys has height at most 1.44 log₂(n + 2).",
    ],
    useCases: [
      "Ordered maps and sets that must never degrade to a linked list, as in database indexes held in memory.",
      "Lookup-heavy workloads, because AVL trees are more tightly balanced than red-black trees.",
      "Teaching rotations, which red-black trees, treaps, and splay trees reuse.",
    ],
  },
  complexity: { best: "O(log n)", average: "O(log n)", worst: "O(log n)", space: "O(n)" },
  code: {
    pseudo: `
procedure Insert(node, key)
  if node = nil then return a new node holding key               @@attach
  if key < node.key then node.left ← Insert(node.left, key)     @@descend
  else node.right ← Insert(node.right, key)                      @@descend
  node.height ← 1 + max(height(node.left), height(node.right))   @@update
  b ← height(node.left) − height(node.right)                     @@update
  if b > 1 and key < node.left.key then                          @@case-ll
    return RotateRight(node)
  if b < −1 and key > node.right.key then                        @@case-rr
    return RotateLeft(node)
  if b > 1 then                                                  @@case-lr
    node.left ← RotateLeft(node.left)
    return RotateRight(node)
  if b < −1 then                                                 @@case-rl
    node.right ← RotateRight(node.right)
    return RotateLeft(node)
  return node

procedure RotateRight(y)
  x ← y.left; y.left ← x.right; x.right ← y                      @@rotate
  update the heights of y, then x; return x                      @@rotate
`,
    python: `
class Node:
    def __init__(self, key): self.key, self.left, self.right, self.h = key, None, None, 1

h = lambda n: n.h if n else 0
def fix(n): n.h = 1 + max(h(n.left), h(n.right))

def rotate_right(y):
    x = y.left; y.left, x.right = x.right, y                @@rotate
    fix(y); fix(x); return x                                @@rotate
def rotate_left(x):
    y = x.right; x.right, y.left = y.left, x                @@rotate
    fix(x); fix(y); return y                                @@rotate

def insert(n, key):
    if n is None: return Node(key)                          @@attach
    if key < n.key: n.left = insert(n.left, key)            @@descend
    else: n.right = insert(n.right, key)                    @@descend
    fix(n); b = h(n.left) - h(n.right)                      @@update
    if b > 1 and key < n.left.key: return rotate_right(n)   @@case-ll
    if b < -1 and key > n.right.key: return rotate_left(n)  @@case-rr
    if b > 1:                                               @@case-lr
        n.left = rotate_left(n.left); return rotate_right(n)
    if b < -1:                                              @@case-rl
        n.right = rotate_right(n.right); return rotate_left(n)
    return n
`,
    cpp: `
struct Node { int key, h = 1; Node *left = nullptr, *right = nullptr; };

int h(Node* n) { return n ? n->h : 0; }
void fix(Node* n) { n->h = 1 + std::max(h(n->left), h(n->right)); }

Node* rotateRight(Node* y) {
    Node* x = y->left; y->left = x->right; x->right = y;    @@rotate
    fix(y); fix(x); return x;                               @@rotate
}
Node* rotateLeft(Node* x) {
    Node* y = x->right; x->right = y->left; y->left = x;    @@rotate
    fix(x); fix(y); return y;                               @@rotate
}

Node* insert(Node* n, int key) {
    if (!n) return new Node{key};                           @@attach
    if (key < n->key) n->left = insert(n->left, key);       @@descend
    else n->right = insert(n->right, key);                  @@descend
    fix(n); int b = h(n->left) - h(n->right);               @@update
    if (b > 1 && key < n->left->key) return rotateRight(n); @@case-ll
    if (b < -1 && key > n->right->key) return rotateLeft(n);@@case-rr
    if (b > 1) {                                            @@case-lr
        n->left = rotateLeft(n->left); return rotateRight(n);
    }
    if (b < -1) {                                           @@case-rl
        n->right = rotateRight(n->right); return rotateLeft(n);
    }
    return n;
}
`,
    java: `
static class Node { int key, h = 1; Node left, right; Node(int k) { key = k; } }

static int h(Node n) { return n == null ? 0 : n.h; }
static void fix(Node n) { n.h = 1 + Math.max(h(n.left), h(n.right)); }

static Node rotateRight(Node y) {
    Node x = y.left; y.left = x.right; x.right = y;         @@rotate
    fix(y); fix(x); return x;                               @@rotate
}
static Node rotateLeft(Node x) {
    Node y = x.right; x.right = y.left; y.left = x;         @@rotate
    fix(x); fix(y); return y;                               @@rotate
}

static Node insert(Node n, int key) {
    if (n == null) return new Node(key);                    @@attach
    if (key < n.key) n.left = insert(n.left, key);          @@descend
    else n.right = insert(n.right, key);                    @@descend
    fix(n); int b = h(n.left) - h(n.right);                 @@update
    if (b > 1 && key < n.left.key) return rotateRight(n);   @@case-ll
    if (b < -1 && key > n.right.key) return rotateLeft(n);  @@case-rr
    if (b > 1) {                                            @@case-lr
        n.left = rotateLeft(n.left); return rotateRight(n);
    }
    if (b < -1) {                                           @@case-rl
        n.right = rotateRight(n.right); return rotateLeft(n);
    }
    return n;
}
`,
    javascript: `
const h = (n) => (n ? n.h : 0);
const fix = (n) => { n.h = 1 + Math.max(h(n.left), h(n.right)); };

function rotateRight(y) {
  const x = y.left; y.left = x.right; x.right = y;          @@rotate
  fix(y); fix(x); return x;                                 @@rotate
}
function rotateLeft(x) {
  const y = x.right; x.right = y.left; y.left = x;          @@rotate
  fix(x); fix(y); return y;                                 @@rotate
}

function insert(n, key) {
  if (!n) return { key, left: null, right: null, h: 1 };    @@attach
  if (key < n.key) n.left = insert(n.left, key);            @@descend
  else n.right = insert(n.right, key);                      @@descend
  fix(n); const b = h(n.left) - h(n.right);                 @@update
  if (b > 1 && key < n.left.key) return rotateRight(n);     @@case-ll
  if (b < -1 && key > n.right.key) return rotateLeft(n);    @@case-rr
  if (b > 1) {                                              @@case-lr
    n.left = rotateLeft(n.left); return rotateRight(n);
  }
  if (b < -1) {                                             @@case-rl
    n.right = rotateRight(n.right); return rotateLeft(n);
  }
  return n;
}
`,
  },
  run(keys) {
    let root: Node | null = null;
    let nextId = 0;
    const t = new TreeTracer("Balance factors", () => ({ roots: [binaryShape(root)] }));
    const counts = { LL: 0, RR: 0, LR: 0, RL: 0 };
    const total = () => Object.values(counts).reduce((a, b) => a + b, 0);

    const factors = () => {
      const all: string[] = [];
      const walk = (n: Node | null): number => {
        if (!n) return 0;
        const left = walk(n.left);
        const at = all.push("") - 1;
        const right = walk(n.right);
        all[at] = `${n.value}:${signed(left - right)}`;
        return 1 + Math.max(left, right);
      };
      walk(root);
      return all;
    };
    const step = (line: string, note: string, marks: Marks, vars?: Record<string, number | string>) => {
      t.aux.items = factors();
      t.step(line, note, { marks, vars });
    };
    const along = (trail: Node[], marks: Marks = {}) => Object.assign(Object.fromEntries(trail.map((n) => [n.id, "path" as const])), marks);

    const link = (parent: Node | undefined, old: Node, next: Node) => {
      if (!parent) root = next;
      else if (parent.left === old) parent.left = next;
      else parent.right = next;
    };
    const rotate = (dir: "left" | "right", n: Node, parent: Node | undefined, trail: Node[]) => {
      const up = (dir === "right" ? n.left : n.right)!;
      if (dir === "right") {
        n.left = up.right;
        up.right = n;
      } else {
        n.right = up.left;
        up.left = n;
      }
      fix(n);
      fix(up);
      link(parent, n, up);
      step("rotate", `Rotate ${dir} at ${n.value}: ${up.value} rises into its place and ${n.value} becomes its ${dir === "right" ? "right" : "left"} child.`, along(trail, { [up.id]: "swap", [n.id]: "swap" }), { node: n.value, rises: up.value });
      return up;
    };

    const insert = (key: number) => {
      const fresh: Node = { id: nextId++, value: key, left: null, right: null, h: 1 };
      const trail: Node[] = [];
      for (let n = root; n; ) {
        const side = key < n.value ? "left" : "right";
        step("descend", `Insert ${key}: ${key} ${key < n.value ? "<" : ">"} ${n.value}, go ${side}.`, along(trail, { [n.id]: "compare" }), { key, node: n.value });
        trail.push(n);
        n = n[side];
      }
      const parent = trail[trail.length - 1];
      if (!parent) root = fresh;
      else if (key < parent.value) parent.left = fresh;
      else parent.right = fresh;
      step("attach", parent ? `${parent.value} has no ${key < parent.value ? "left" : "right"} child, so ${key} becomes its ${key < parent.value ? "left" : "right"} child.` : `Insert ${key}: the tree is empty, so ${key} becomes the root.`, along(trail, { [fresh.id]: "target" }), { key });

      while (trail.length > 0) {
        const n = trail.pop()!;
        const parentOf = trail[trail.length - 1];
        fix(n);
        const b = balance(n);
        if (Math.abs(b) <= 1) {
          step("update", `At ${n.value}: left height ${height(n.left)}, right height ${height(n.right)}, balance ${signed(b)}, so it stays.`, along(trail, { [n.id]: "compare" }), { node: n.value, balance: signed(b) });
          continue;
        }
        const heavy = (b > 1 ? n.left : n.right)!;
        const inner = balance(heavy) * b < 0;
        const name = b > 1 ? (inner ? "LR" : "LL") : inner ? "RL" : "RR";
        counts[name]++;
        const lean = b > 1 ? "left" : "right";
        const how = inner
          ? `${heavy.value} leans ${lean === "left" ? "right" : "left"}, so this is the ${lean}-${lean === "left" ? "right" : "left"} case (${name}): rotate ${heavy.value} ${lean === "left" ? "left" : "right"}, then ${n.value} ${lean === "left" ? "right" : "left"}.`
          : `${heavy.value} leans ${lean} too, so this is the ${lean}-${lean} case (${name}): rotate ${n.value} ${lean === "left" ? "right" : "left"}.`;
        step(`case-${name.toLowerCase()}`, `${n.value} has balance ${signed(b)}: its ${lean} side is two taller. ${how}`, along(trail, { [n.id]: "target", [heavy.id]: "compare" }), { node: n.value, balance: signed(b), case: name });
        if (inner) rotate(lean, heavy, n, [...trail, n]);
        rotate(lean === "left" ? "right" : "left", n, parentOf, trail);
        break;
      }
    };

    const order = insertionOrder(keys);
    step("attach", `Insert the keys in this order: ${order.join(", ")}. Each balance factor is the left height minus the right height.`, {});
    order.forEach(insert);

    const markDone = (n: Node | null) => {
      if (!n) return;
      t.marks[n.id] = "done";
      markDone(n.left);
      markDone(n.right);
    };
    markDone(root);
    t.answer = `Height ${height(root)} with ${keys.length} keys after ${total()} rotations (LL ${counts.LL}, RR ${counts.RR}, LR ${counts.LR}, RL ${counts.RL})`;
    step("update", `All ${keys.length} keys are in. The tree has height ${height(root)} and every balance factor is −1, 0, or +1.`, {});
    return t.frames;
  },
};
