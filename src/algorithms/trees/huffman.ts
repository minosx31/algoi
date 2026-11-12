import { TreeTracer, type TreeShape } from "../../core/trace";
import type { TreeAlgorithm, TreeMark } from "../../core/types";

type Node = { id: number; weight: number; letter?: string; code?: string; left: Node | null; right: Node | null };
type Marks = Partial<Record<number, TreeMark>>;

/** Eight letters at most, so the finished tree fits the canvas without overlaps. */
const MAX_LETTERS = 8;

/** One letter per key, A onward, each seen 1 to 20 times. */
export function huffmanCounts(keys: number[]) {
  return keys.slice(0, MAX_LETTERS).map((key, i) => ({ letter: String.fromCharCode(65 + i), count: (key % 20) + 1 }));
}

/** Lighter first; between equal weights, the older tree first, so every run breaks ties the same way. */
const before = (a: Node, b: Node) => a.weight - b.weight || a.id - b.id;

export const huffman: TreeAlgorithm = {
  id: "huffman",
  name: "Huffman Coding",
  kind: "tree",
  topic: "tree",
  about: {
    summary:
      "Builds the shortest prefix-free binary code for a set of letters with known counts. It keeps a min-heap of trees, always merges the two lightest into one, and reads each letter's code off the path from the root: 0 for left, 1 for right.",
    invariants: [
      "Every tree in the heap weighs the total count of the letters at its leaves.",
      "Letters live only at leaves, so no code is the prefix of another and a bit stream decodes without separators.",
      "Merging the two lightest trees is always safe: some optimal code puts the two rarest letters as siblings at the deepest level.",
    ],
    useCases: [
      "The entropy-coding stage of DEFLATE, which zip, gzip, and PNG use, and of JPEG.",
      "Compressing text or symbol streams whose letter frequencies are skewed.",
      "A classic example of a greedy algorithm that can be proved optimal.",
    ],
  },
  complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  code: {
    pseudo: `
procedure Huffman(counts)
  heap ← a min-heap with one leaf per letter, keyed by count    @@init
  while heap holds more than one tree do
    a ← pop the lightest tree; b ← pop the next lightest         @@pop
    push a new node with children a and b, weight a + b          @@merge
  root ← the one tree left
  for each leaf, code ← the path from root, 0 left and 1 right   @@code
  return the codes                                               @@done
`,
    python: `
import heapq
from itertools import count

def huffman(counts):
    order = count()
    heap = [(w, next(order), ch) for ch, w in counts.items()]   @@init
    heapq.heapify(heap)                                         @@init
    while len(heap) > 1:
        wa, _, a = heapq.heappop(heap)                          @@pop
        wb, _, b = heapq.heappop(heap)                          @@pop
        heapq.heappush(heap, (wa + wb, next(order), (a, b)))    @@merge
    codes = {}
    def walk(node, code):
        if isinstance(node, str):
            codes[node] = code                                  @@code
        else:
            walk(node[0], code + "0")
            walk(node[1], code + "1")
    walk(heap[0][2], "")
    return codes                                                @@done
`,
    cpp: `
struct Node { int weight, order; char ch; Node* left; Node* right; };
struct Heavier {
    bool operator()(Node* a, Node* b) const {
        return a->weight != b->weight ? a->weight > b->weight : a->order > b->order;
    }
};

void walk(Node* n, const std::string& code, std::map<char, std::string>& codes) {
    if (!n->left) { codes[n->ch] = code; return; }              @@code
    walk(n->left, code + "0", codes);
    walk(n->right, code + "1", codes);
}

std::map<char, std::string> huffman(const std::vector<std::pair<char, int>>& counts) {
    std::priority_queue<Node*, std::vector<Node*>, Heavier> heap;
    int order = 0;
    for (auto [ch, w] : counts)
        heap.push(new Node{w, order++, ch, nullptr, nullptr});  @@init
    while (heap.size() > 1) {
        Node* a = heap.top(); heap.pop();                       @@pop
        Node* b = heap.top(); heap.pop();                       @@pop
        heap.push(new Node{a->weight + b->weight, order++, 0, a, b});  @@merge
    }
    std::map<char, std::string> codes;
    walk(heap.top(), "", codes);
    return codes;                                               @@done
}
`,
    java: `
record Node(int weight, int order, char ch, Node left, Node right) {}

static void walk(Node n, String code, Map<Character, String> codes) {
    if (n.left() == null) { codes.put(n.ch(), code); return; } @@code
    walk(n.left(), code + "0", codes);
    walk(n.right(), code + "1", codes);
}

static Map<Character, String> huffman(Map<Character, Integer> counts) {
    PriorityQueue<Node> heap = new PriorityQueue<>(
        Comparator.comparingInt(Node::weight).thenComparingInt(Node::order));
    int order = 0;
    for (var e : counts.entrySet())
        heap.add(new Node(e.getValue(), order++, e.getKey(), null, null));  @@init
    while (heap.size() > 1) {
        Node a = heap.poll();                                   @@pop
        Node b = heap.poll();                                   @@pop
        heap.add(new Node(a.weight() + b.weight(), order++, '\\0', a, b));   @@merge
    }
    Map<Character, String> codes = new TreeMap<>();
    walk(heap.peek(), "", codes);
    return codes;                                               @@done
}
`,
    javascript: `
function huffman(counts) {
  // A sorted array stands in for the min-heap; a binary heap makes each pop O(log n).
  let order = 0;
  const heap = Object.entries(counts).map(([ch, w]) => ({ w, order: order++, ch }));  @@init
  const lighter = (a, b) => a.w - b.w || a.order - b.order;
  while (heap.length > 1) {
    heap.sort(lighter);
    const a = heap.shift(), b = heap.shift();                   @@pop
    heap.push({ w: a.w + b.w, order: order++, left: a, right: b });  @@merge
  }
  const codes = {};
  const walk = (node, code) => {
    if (!node.left) { codes[node.ch] = code; return; }          @@code
    walk(node.left, code + "0");
    walk(node.right, code + "1");
  };
  walk(heap[0], "");
  return codes;                                                 @@done
}
`,
  },
  run(keys) {
    const counts = huffmanCounts(keys);
    let nextId = 0;
    const heap: Node[] = counts.map(({ letter, count }) => ({ id: nextId++, weight: count, letter, left: null, right: null }));
    const shape = (n: Node): TreeShape =>
      n.letter
        ? { id: n.id, value: n.letter, caption: n.code ?? `×${n.weight}`, children: [] }
        : { id: n.id, value: n.weight, children: [shape(n.left!), shape(n.right!)] };
    const t = new TreeTracer("Min-heap, lightest first", () => ({ roots: heap.map(shape) }));
    const show = () => (t.aux.items = heap.map((n) => `${n.letter ?? "tree"} ${n.weight}`));
    const label = (n: Node) => (n.letter ? `${n.letter} (${n.weight})` : `the tree of weight ${n.weight}`);

    heap.sort(before);
    show();
    t.step("init", `Count each letter: ${counts.map((c) => `${c.letter} ×${c.count}`).join(", ")}. Each letter starts as a one-leaf tree in a min-heap keyed by count.`);

    while (heap.length > 1) {
      const [a, b] = heap;
      t.step("pop", `Pop the two lightest trees, ${label(a)} and ${label(b)}.`, { marks: { [a.id]: "compare", [b.id]: "compare" }, vars: { a: a.weight, b: b.weight } });
      heap.splice(0, 2);
      const merged: Node = { id: nextId++, weight: a.weight + b.weight, left: a, right: b };
      heap.push(merged);
      heap.sort(before);
      show();
      t.step("merge", `Join them under a new node of weight ${a.weight} + ${b.weight} = ${merged.weight}, lighter on the left, and push it back.`, {
        marks: { [merged.id]: "target", [a.id]: "path", [b.id]: "path" },
        vars: { weight: merged.weight },
      });
    }

    const root = heap[0];
    const leaves: Node[] = [];
    const assign = (n: Node, code: string, trail: number[]) => {
      if (n.letter) {
        n.code = code;
        leaves.push(n);
        const marks: Marks = Object.fromEntries(trail.map((id) => [id, "path"]));
        t.step("code", `${n.letter} is reached by ${code.split("").map((bit) => (bit === "0" ? "left" : "right")).join(", ")}, so its code is ${code}.`, {
          marks: { ...marks, [n.id]: "target" },
          vars: { letter: n.letter, code },
        });
        return;
      }
      assign(n.left!, `${code}0`, [...trail, n.id]);
      assign(n.right!, `${code}1`, [...trail, n.id]);
    };
    assign(root, "", []);

    const total = counts.reduce((s, c) => s + c.count, 0);
    const bits = leaves.reduce((s, n) => s + n.weight * n.code!.length, 0);
    const fixed = Math.ceil(Math.log2(counts.length));
    const walk = (n: Node | null) => {
      if (!n) return;
      t.marks[n.id] = "done";
      walk(n.left);
      walk(n.right);
    };
    walk(root);
    t.answer = `${bits} bits for ${total} letters, against ${total * fixed} with ${fixed}-bit fixed codes`;
    t.step("done", `Every letter has a code, and none is the prefix of another. Encoding all ${total} letters takes ${bits} bits, the sum of count × code length.`);
    return t.frames;
  },
};
