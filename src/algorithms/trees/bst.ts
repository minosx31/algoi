import { TreeTracer, binaryShape } from "../../core/trace";
import type { TreeAlgorithm, TreeMark } from "../../core/types";

type Node = { id: number; value: number; left: Node | null; right: Node | null };
type Op = ["insert" | "search" | "delete", number];

export const bst: TreeAlgorithm = {
  id: "bst",
  name: "Binary Search Tree",
  kind: "tree",
  topic: "tree",
  about: {
    summary: "Keeps keys in a binary tree where smaller keys go left and larger keys go right, so insert, search, and delete each walk one path down from the root.",
    invariants: [
      "Every key in a node's left subtree is smaller than the node's key, and every key in its right subtree is larger.",
      "An inorder walk reads the keys in sorted order.",
      "Deleting a node with two children copies in its successor, the smallest key in its right subtree, then deletes that successor, which has no left child.",
    ],
    useCases: [
      "Ordered maps and sets such as C++ std::map and Java TreeMap, which add balancing on top.",
      "Range queries and finding the next larger or smaller key.",
      "The base that AVL and red-black trees keep balanced.",
    ],
  },
  complexity: { best: "O(1)", average: "O(log n)", worst: "O(n)", space: "O(n)" },
  code: {
    pseudo: `
procedure Insert(node, key)
  if node = nil then return a new node holding key                @@ins-attach
  if key < node.key then node.left ← Insert(node.left, key)      @@ins-left
  else node.right ← Insert(node.right, key)                       @@ins-right
  return node

procedure Search(node, key)
  while node ≠ nil and node.key ≠ key do                         @@find-compare
    node ← node.left if key < node.key else node.right           @@find-compare
  return node                                                     @@find-done

procedure Delete(node, key)
  if node = nil then return nil                                   @@del-missing
  if key < node.key then node.left ← Delete(node.left, key)      @@del-left
  else if key > node.key then node.right ← Delete(node.right, key)   @@del-right
  else if node has at most one child then return that child or nil   @@del-splice
  else
    succ ← the leftmost node of node.right                        @@del-successor
    node.key ← succ.key                                           @@del-replace
    node.right ← Delete(node.right, succ.key)                     @@del-replace
  return node                                                     @@del-return
`,
    python: `
class Node:
    def __init__(self, key): self.key, self.left, self.right = key, None, None

def insert(node, key):
    if node is None: return Node(key)                           @@ins-attach
    if key < node.key: node.left = insert(node.left, key)       @@ins-left
    else: node.right = insert(node.right, key)                  @@ins-right
    return node

def search(node, key):
    while node is not None and node.key != key:                 @@find-compare
        node = node.left if key < node.key else node.right      @@find-compare
    return node                                                 @@find-done

def delete(node, key):
    if node is None: return None                                @@del-missing
    if key < node.key: node.left = delete(node.left, key)       @@del-left
    elif key > node.key: node.right = delete(node.right, key)   @@del-right
    elif node.left is None or node.right is None:               @@del-splice
        return node.left or node.right                          @@del-splice
    else:
        succ = node.right                                       @@del-successor
        while succ.left: succ = succ.left                       @@del-successor
        node.key = succ.key                                     @@del-replace
        node.right = delete(node.right, succ.key)               @@del-replace
    return node                                                 @@del-return
`,
    cpp: `
struct Node { int key; Node* left = nullptr; Node* right = nullptr; };

Node* insert(Node* n, int key) {
    if (!n) return new Node{key};                               @@ins-attach
    if (key < n->key) n->left = insert(n->left, key);           @@ins-left
    else n->right = insert(n->right, key);                      @@ins-right
    return n;
}

Node* search(Node* n, int key) {
    while (n && n->key != key)                                  @@find-compare
        n = key < n->key ? n->left : n->right;                  @@find-compare
    return n;                                                   @@find-done
}

Node* remove(Node* n, int key) {
    if (!n) return nullptr;                                     @@del-missing
    if (key < n->key) { n->left = remove(n->left, key); return n; }     @@del-left
    if (key > n->key) { n->right = remove(n->right, key); return n; }   @@del-right
    if (!n->left || !n->right) return n->left ? n->left : n->right;     @@del-splice
    Node* succ = n->right;                                      @@del-successor
    while (succ->left) succ = succ->left;                       @@del-successor
    n->key = succ->key;                                         @@del-replace
    n->right = remove(n->right, succ->key);                     @@del-replace
    return n;                                                   @@del-return
}
`,
    java: `
static class Node { int key; Node left, right; Node(int key) { this.key = key; } }

static Node insert(Node n, int key) {
    if (n == null) return new Node(key);                        @@ins-attach
    if (key < n.key) n.left = insert(n.left, key);              @@ins-left
    else n.right = insert(n.right, key);                        @@ins-right
    return n;
}

static Node search(Node n, int key) {
    while (n != null && n.key != key)                           @@find-compare
        n = key < n.key ? n.left : n.right;                     @@find-compare
    return n;                                                   @@find-done
}

static Node delete(Node n, int key) {
    if (n == null) return null;                                 @@del-missing
    if (key < n.key) { n.left = delete(n.left, key); return n; }        @@del-left
    if (key > n.key) { n.right = delete(n.right, key); return n; }      @@del-right
    if (n.left == null || n.right == null) return n.left != null ? n.left : n.right;   @@del-splice
    Node succ = n.right;                                        @@del-successor
    while (succ.left != null) succ = succ.left;                 @@del-successor
    n.key = succ.key;                                           @@del-replace
    n.right = delete(n.right, succ.key);                        @@del-replace
    return n;                                                   @@del-return
}
`,
    javascript: `
class Node { constructor(key) { this.key = key; this.left = this.right = null; } }

function insert(node, key) {
  if (node === null) return new Node(key);                      @@ins-attach
  if (key < node.key) node.left = insert(node.left, key);       @@ins-left
  else node.right = insert(node.right, key);                    @@ins-right
  return node;
}

function search(node, key) {
  while (node !== null && node.key !== key)                     @@find-compare
    node = key < node.key ? node.left : node.right;             @@find-compare
  return node;                                                  @@find-done
}

function remove(node, key) {
  if (node === null) return null;                               @@del-missing
  if (key < node.key) { node.left = remove(node.left, key); return node; }    @@del-left
  if (key > node.key) { node.right = remove(node.right, key); return node; }  @@del-right
  if (node.left === null || node.right === null) return node.left ?? node.right;   @@del-splice
  let succ = node.right;                                        @@del-successor
  while (succ.left !== null) succ = succ.left;                  @@del-successor
  node.key = succ.key;                                          @@del-replace
  node.right = remove(node.right, succ.key);                    @@del-replace
  return node;                                                  @@del-return
}
`,
  },
  run(keys) {
    let root: Node | null = null;
    let nextId = 0;
    const t = new TreeTracer("Next operations", () => ({ roots: [binaryShape(root)] }));
    const along = (trail: Node[], marks: Partial<Record<number, TreeMark>> = {}) => {
      const all: Partial<Record<number, TreeMark>> = {};
      for (const n of trail) all[n.id] = "path";
      return Object.assign(all, marks);
    };
    const dir = (key: number, n: Node) => (key < n.value ? `${key} < ${n.value}, go left` : `${key} > ${n.value}, go right`);

    const insert = (key: number) => {
      const fresh: Node = { id: nextId++, value: key, left: null, right: null };
      if (!root) {
        root = fresh;
        t.step("ins-attach", `Insert ${key}: the tree is empty, so ${key} becomes the root.`, { marks: { [fresh.id]: "target" }, vars: { key } });
        return;
      }
      const trail: Node[] = [];
      for (let n: Node = root; ; ) {
        const side = key < n.value ? "left" : "right";
        t.step(side === "left" ? "ins-left" : "ins-right", `Insert ${key}: ${dir(key, n)}.`, { marks: along(trail, { [n.id]: "compare" }), vars: { key, node: n.value } });
        trail.push(n);
        const next = n[side];
        if (!next) {
          n[side] = fresh;
          t.step("ins-attach", `${n.value} has no ${side} child, so ${key} becomes its ${side} child.`, { marks: along(trail, { [fresh.id]: "target" }), vars: { key } });
          return;
        }
        n = next;
      }
    };

    const search = (key: number) => {
      const trail: Node[] = [];
      let n = root;
      while (n && n.value !== key) {
        t.step("find-compare", `Search ${key}: ${dir(key, n)}.`, { marks: along(trail, { [n.id]: "compare" }), vars: { key, node: n.value } });
        trail.push(n);
        n = key < n.value ? n.left : n.right;
      }
      const note = n ? `Search ${key}: ${n.value} = ${key}, found it after ${trail.length + 1} comparisons.` : `Search ${key}: reached an empty link, so ${key} is not in the tree.`;
      t.step("find-done", note, { marks: along(trail, n ? { [n.id]: "target" } : {}), vars: { key } });
    };

    const remove = (n: Node | null, key: number, trail: Node[]): Node | null => {
      if (!n) return null;
      if (key !== n.value) {
        const side = key < n.value ? "left" : "right";
        t.step(side === "left" ? "del-left" : "del-right", `Delete ${key}: ${dir(key, n)}.`, { marks: along(trail, { [n.id]: "compare" }), vars: { key, node: n.value } });
        n[side] = remove(n[side], key, [...trail, n]);
        return n;
      }
      if (!n.left || !n.right) {
        const child = n.left ?? n.right;
        const note = child ? `${key} has one child, ${child.value}, which takes its place.` : `${key} has no children, so it is simply unlinked.`;
        t.step("del-splice", note, { marks: along(trail, { [n.id]: "swap", ...(child && { [child.id]: "target" }) }), vars: { key } });
        return child;
      }
      let succ = n.right;
      t.step("del-successor", `${key} has two children. Its successor is the smallest key in its right subtree, so start at ${succ.value}.`, { marks: along(trail, { [n.id]: "swap", [succ.id]: "compare" }), vars: { key } });
      while (succ.left) {
        succ = succ.left;
        t.step("del-successor", `Step left to ${succ.value}.`, { marks: along(trail, { [n.id]: "swap", [succ.id]: "compare" }), vars: { key, succ: succ.value } });
      }
      t.step("del-successor", `${succ.value} has no left child, so it is the successor of ${key}.`, { marks: along(trail, { [n.id]: "swap", [succ.id]: "target" }), vars: { key, succ: succ.value } });
      n.value = succ.value;
      t.step("del-replace", `Copy ${succ.value} over ${key}. ${succ.value} now appears twice, so delete the old ${succ.value} from the right subtree.`, { marks: along(trail, { [n.id]: "swap", [succ.id]: "target" }), vars: { key, succ: succ.value } });
      n.right = remove(n.right, succ.value, [...trail, n]);
      return n;
    };

    const last = keys[keys.length - 1];
    const present = new Set(keys);
    const miss = [...keys].sort((a, b) => a - b).find((k, i) => i >= keys.length / 2 && !present.has(k + 1))! + 1;
    const ops: Op[] = [...keys.map((k): Op => ["insert", k]), ["search", last], ["search", miss], ["delete", keys[0]], ["delete", last]];
    t.aux.items = ops.map(([op, key]) => `${op} ${key}`);
    const kept: Node[] = [];
    const inorder = (n: Node | null) => {
      if (!n) return;
      inorder(n.left);
      kept.push(n);
      inorder(n.right);
    };

    for (const [op, key] of ops) {
      t.aux.items.shift();
      if (op === "insert") insert(key);
      else if (op === "search") search(key);
      else {
        root = remove(root, key, []);
        t.step("del-return", `Delete ${key} is done. Every left subtree still holds smaller keys and every right subtree larger ones.`, { vars: { key } });
      }
    }
    inorder(root);
    for (const n of kept) t.marks[n.id] = "done";
    const sorted = kept.map((n) => n.value);
    t.answer = `Inorder: ${sorted.join(" ")}, still sorted`;
    t.step("del-return", `All ${ops.length} operations are done. An inorder walk reads ${sorted.join(", ")}, in sorted order.`);
    return t.frames;
  },
};
