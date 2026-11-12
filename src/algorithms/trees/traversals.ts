import { TreeTracer, binaryShape } from "../../core/trace";
import type { TreeAlgorithm } from "../../core/types";

type Node = { id: number; value: number; left: Node | null; right: Node | null };
type Order = "pre" | "in" | "post";

const ORDER_NAMES: Record<Order, string> = { pre: "Preorder", in: "Inorder", post: "Postorder" };

export const treeTraversals: TreeAlgorithm = {
  id: "tree-traversals",
  name: "Tree Traversals",
  kind: "tree",
  topic: "tree",
  about: {
    summary: "Visits every node of a binary tree once. The three depth-first orders differ only in when a node is visited relative to its subtrees; level order uses a queue to go row by row.",
    invariants: [
      "Preorder visits a node before its subtrees, inorder between them, and postorder after them.",
      "On a binary search tree, inorder visits the keys in sorted order.",
      "Level order visits every node at depth d before any node at depth d + 1.",
    ],
    useCases: [
      "Copying or serializing a tree (preorder), and deleting or evaluating one from the bottom up (postorder).",
      "Reading a binary search tree in sorted order (inorder).",
      "Printing a tree row by row, or finding the shallowest node with some property (level order).",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)" },
  code: {
    pseudo: `
procedure DFS(node, order, out)
  if node = nil then return
  if order = pre then append node.key to out                @@visit-pre
  DFS(node.left, order, out)                                @@go-left
  if order = in then append node.key to out                 @@visit-in
  DFS(node.right, order, out)                               @@go-right
  if order = post then append node.key to out               @@visit-post

procedure LevelOrder(root)
  out ← empty list; Q ← queue containing root              @@level-start
  while Q is not empty do
    node ← Q.dequeue(); append node.key to out              @@level-visit
    enqueue node.left and node.right if they exist          @@level-push
  return out                                                @@level-done
`,
    python: `
from collections import deque

def dfs(node, order, out):
    if node is None:
        return
    if order == "pre": out.append(node.key)                 @@visit-pre
    dfs(node.left, order, out)                              @@go-left
    if order == "in": out.append(node.key)                  @@visit-in
    dfs(node.right, order, out)                             @@go-right
    if order == "post": out.append(node.key)                @@visit-post

def level_order(root):
    out, queue = [], deque([root] if root else [])          @@level-start
    while queue:
        node = queue.popleft()                              @@level-visit
        out.append(node.key)                                @@level-visit
        for child in (node.left, node.right):               @@level-push
            if child: queue.append(child)                   @@level-push
    return out                                              @@level-done
`,
    cpp: `
struct Node { int key; Node* left = nullptr; Node* right = nullptr; };
enum Order { PRE, IN, POST };

void dfs(Node* n, Order order, std::vector<int>& out) {
    if (!n) return;
    if (order == PRE) out.push_back(n->key);                @@visit-pre
    dfs(n->left, order, out);                               @@go-left
    if (order == IN) out.push_back(n->key);                 @@visit-in
    dfs(n->right, order, out);                              @@go-right
    if (order == POST) out.push_back(n->key);               @@visit-post
}

std::vector<int> levelOrder(Node* root) {
    std::vector<int> out;
    std::queue<Node*> q;                                    @@level-start
    if (root) q.push(root);                                 @@level-start
    while (!q.empty()) {
        Node* n = q.front(); q.pop();                       @@level-visit
        out.push_back(n->key);                              @@level-visit
        if (n->left) q.push(n->left);                       @@level-push
        if (n->right) q.push(n->right);                     @@level-push
    }
    return out;                                             @@level-done
}
`,
    java: `
static class Node { int key; Node left, right; }
enum Order { PRE, IN, POST }

static void dfs(Node n, Order order, List<Integer> out) {
    if (n == null) return;
    if (order == Order.PRE) out.add(n.key);                 @@visit-pre
    dfs(n.left, order, out);                                @@go-left
    if (order == Order.IN) out.add(n.key);                  @@visit-in
    dfs(n.right, order, out);                               @@go-right
    if (order == Order.POST) out.add(n.key);                @@visit-post
}

static List<Integer> levelOrder(Node root) {
    List<Integer> out = new ArrayList<>();
    Deque<Node> q = new ArrayDeque<>();                     @@level-start
    if (root != null) q.add(root);                          @@level-start
    while (!q.isEmpty()) {
        Node n = q.poll();                                  @@level-visit
        out.add(n.key);                                     @@level-visit
        if (n.left != null) q.add(n.left);                  @@level-push
        if (n.right != null) q.add(n.right);                @@level-push
    }
    return out;                                             @@level-done
}
`,
    javascript: `
function dfs(node, order, out) {
  if (node === null) return;
  if (order === "pre") out.push(node.key);                  @@visit-pre
  dfs(node.left, order, out);                               @@go-left
  if (order === "in") out.push(node.key);                   @@visit-in
  dfs(node.right, order, out);                              @@go-right
  if (order === "post") out.push(node.key);                 @@visit-post
}

function levelOrder(root) {
  const out = [];
  const queue = root === null ? [] : [root];                @@level-start
  while (queue.length > 0) {
    const node = queue.shift();                             @@level-visit
    out.push(node.key);                                     @@level-visit
    if (node.left !== null) queue.push(node.left);          @@level-push
    if (node.right !== null) queue.push(node.right);        @@level-push
  }
  return out;                                               @@level-done
}
`,
  },
  run(keys) {
    const nodes: Node[] = keys.map((value, id) => ({ id, value, left: null, right: null }));
    const [root] = nodes;
    for (const n of nodes.slice(1)) {
      for (let p = root; ; ) {
        const side = n.value < p.value ? "left" : "right";
        const next = p[side];
        if (!next) {
          p[side] = n;
          break;
        }
        p = next;
      }
    }
    const t = new TreeTracer("", () => ({ roots: [binaryShape(root)] }));
    const restart = (title: string) => {
      t.aux = { title, items: [] };
      for (const n of nodes) delete t.marks[n.id];
    };
    const visit = (n: Node) => {
      t.aux.items.push(String(n.value));
      t.marks[n.id] = "done";
    };

    const dfs = (n: Node, order: Order, stack: Node[]) => {
      const here = [...stack, n];
      const vars = { order: ORDER_NAMES[order], stack: here.map((m) => m.value).join(" → ") };
      if (order === "pre") {
        visit(n);
        t.step("visit-pre", `Preorder visits ${n.value} first, before either subtree.`, { vars });
      }
      if (n.left) {
        t.step("go-left", `Go left from ${n.value} to ${n.left.value}.`, { marks: { [n.id]: "target" }, vars });
        dfs(n.left, order, here);
      }
      if (order === "in") {
        visit(n);
        const why = n.left ? `the left subtree of ${n.value} is finished` : `${n.value} has no left child`;
        t.step("visit-in", `Inorder visits ${n.value} now, because ${why}.`, { vars });
      }
      if (n.right) {
        t.step("go-right", `Go right from ${n.value} to ${n.right.value}.`, { marks: { [n.id]: "target" }, vars });
        dfs(n.right, order, here);
      }
      if (order === "post") {
        visit(n);
        const why = n.left || n.right ? `both subtrees of ${n.value} are finished` : `${n.value} is a leaf`;
        t.step("visit-post", `Postorder visits ${n.value} now, because ${why}.`, { vars });
      }
    };

    const results: Record<Order, string[]> = { pre: [], in: [], post: [] };
    for (const order of ["pre", "in", "post"] as const) {
      restart(`${ORDER_NAMES[order]} output`);
      dfs(root, order, []);
      results[order] = t.aux.items.slice();
    }

    restart("Level-order output");
    const queue = [root];
    const queued = () => ({ order: "Level order", queue: queue.map((n) => n.value).join(" ") || "empty" });
    t.step("level-start", `Level order uses a queue instead of recursion. Start with the root ${root.value} in it.`, { marks: { [root.id]: "target" }, vars: queued() });
    while (queue.length > 0) {
      const n = queue.shift()!;
      visit(n);
      t.step("level-visit", `Dequeue ${n.value} and visit it.`, { vars: queued() });
      const kids = [n.left, n.right].filter((c): c is Node => c !== null);
      if (kids.length === 0) continue;
      queue.push(...kids);
      t.step("level-push", `Enqueue the children of ${n.value}: ${kids.map((c) => c.value).join(" and ")}.`, { marks: { [n.id]: "target" }, vars: queued() });
    }
    t.answer = `Inorder ${results.in.join(" ")} is sorted, as it must be in a BST`;
    t.step("level-done", `The queue is empty, so level order has visited all ${nodes.length} nodes. Preorder was ${results.pre.join(" ")}; postorder was ${results.post.join(" ")}.`, { vars: queued() });
    return t.frames;
  },
};
