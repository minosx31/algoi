import { TreeTracer, type TreeShape } from "../../core/trace";
import type { TreeAlgorithm } from "../../core/types";

type Item = { id: number; value: number };

export const binaryHeap: TreeAlgorithm = {
  id: "binary-heap",
  name: "Binary Heap",
  kind: "tree",
  topic: "tree",
  about: {
    summary: "Stores a complete binary tree in an array with every parent no larger than its children, so the minimum is always at index 0. Push sifts a new key up; pop-min moves the last key to the root and sifts it down.",
    invariants: [
      "Every parent is no larger than its children, so the root holds the minimum.",
      "The tree is complete and lives in an array: index i has children 2i + 1 and 2i + 2 and parent ⌊(i − 1) / 2⌋.",
      "During a sift, only the key being moved can break the heap property.",
    ],
    useCases: [
      "Priority queues such as Python heapq and Java PriorityQueue.",
      "Schedulers and timers that always run the earliest deadline next.",
      "Dijkstra's algorithm, top-k queries, and heap sort.",
    ],
  },
  complexity: { best: "O(1)", average: "O(log n)", worst: "O(log n)", space: "O(n)" },
  code: {
    pseudo: `
procedure Push(H, x)
  append x to H                                             @@push
  i ← the last index of H
  while i > 0 and H[parent(i)] > H[i] do                    @@up-compare
    swap H[i] and H[parent(i)]; i ← parent(i)               @@up-swap

procedure PopMin(H)
  top ← H[0]                                                @@pop
  H[0] ← the last key of H; remove the last slot            @@move-last
  i ← 0
  loop
    small ← the index of the smallest of H[i], H[2i + 1], H[2i + 2]   @@down-compare
    if small = i then return top                            @@down-stop
    swap H[i] and H[small]; i ← small                       @@down-swap
`,
    python: `
def push(heap, x):
    heap.append(x)                                          @@push
    i = len(heap) - 1
    while i > 0 and heap[(i - 1) // 2] > heap[i]:           @@up-compare
        p = (i - 1) // 2
        heap[i], heap[p] = heap[p], heap[i]                 @@up-swap
        i = p

def pop_min(heap):
    top = heap[0]                                           @@pop
    heap[0] = heap[-1]                                      @@move-last
    heap.pop()                                              @@move-last
    i = 0
    while True:
        small = i                                           @@down-compare
        for c in (2 * i + 1, 2 * i + 2):                    @@down-compare
            if c < len(heap) and heap[c] < heap[small]:     @@down-compare
                small = c                                   @@down-compare
        if small == i:                                      @@down-stop
            return top                                      @@down-stop
        heap[i], heap[small] = heap[small], heap[i]         @@down-swap
        i = small
`,
    cpp: `
void push(std::vector<int>& h, int x) {
    h.push_back(x);                                         @@push
    size_t i = h.size() - 1;
    while (i > 0 && h[(i - 1) / 2] > h[i]) {                @@up-compare
        std::swap(h[i], h[(i - 1) / 2]);                    @@up-swap
        i = (i - 1) / 2;
    }
}

int popMin(std::vector<int>& h) {
    int top = h[0];                                         @@pop
    h[0] = h.back();                                        @@move-last
    h.pop_back();                                           @@move-last
    for (size_t i = 0;;) {
        size_t small = i;                                   @@down-compare
        for (size_t c = 2 * i + 1; c <= 2 * i + 2; c++)     @@down-compare
            if (c < h.size() && h[c] < h[small]) small = c; @@down-compare
        if (small == i) return top;                         @@down-stop
        std::swap(h[i], h[small]);                          @@down-swap
        i = small;
    }
}
`,
    java: `
static void push(List<Integer> h, int x) {
    h.add(x);                                               @@push
    int i = h.size() - 1;
    while (i > 0 && h.get((i - 1) / 2) > h.get(i)) {        @@up-compare
        Collections.swap(h, i, (i - 1) / 2);                @@up-swap
        i = (i - 1) / 2;
    }
}

static int popMin(List<Integer> h) {
    int top = h.get(0);                                     @@pop
    h.set(0, h.get(h.size() - 1));                          @@move-last
    h.remove(h.size() - 1);                                 @@move-last
    for (int i = 0;;) {
        int small = i;                                      @@down-compare
        for (int c = 2 * i + 1; c <= 2 * i + 2; c++)        @@down-compare
            if (c < h.size() && h.get(c) < h.get(small)) small = c;   @@down-compare
        if (small == i) return top;                         @@down-stop
        Collections.swap(h, i, small);                      @@down-swap
        i = small;
    }
}
`,
    javascript: `
function push(heap, x) {
  heap.push(x);                                             @@push
  let i = heap.length - 1;
  while (i > 0 && heap[(i - 1) >> 1] > heap[i]) {           @@up-compare
    const p = (i - 1) >> 1;
    [heap[i], heap[p]] = [heap[p], heap[i]];                @@up-swap
    i = p;
  }
}

function popMin(heap) {
  const top = heap[0];                                      @@pop
  heap[0] = heap[heap.length - 1];                          @@move-last
  heap.pop();                                               @@move-last
  for (let i = 0; ; ) {
    let small = i;                                          @@down-compare
    for (const c of [2 * i + 1, 2 * i + 2])                 @@down-compare
      if (c < heap.length && heap[c] < heap[small]) small = c;   @@down-compare
    if (small === i) return top;                            @@down-stop
    [heap[i], heap[small]] = [heap[small], heap[i]];        @@down-swap
    i = small;
  }
}
`,
  },
  run(keys) {
    const heap: Item[] = [];
    const at = (i: number): TreeShape | null => (i < heap.length ? { ...heap[i], children: [at(2 * i + 1), at(2 * i + 2)] } : null);
    const t = new TreeTracer("Next operations", () => ({ roots: [at(0)], array: heap.map((item) => item.id) }));
    const pops = Math.max(1, Math.floor(keys.length / 3));
    t.aux.items = [...keys.map((k) => `push ${k}`), ...Array<string>(pops).fill("pop-min")];
    const swap = (i: number, j: number) => ([heap[i], heap[j]] = [heap[j], heap[i]]);
    const pair = (i: number, j: number, mark: "compare" | "swap") => ({ [heap[i].id]: mark, [heap[j].id]: mark });

    const push = (item: Item) => {
      heap.push(item);
      let i = heap.length - 1;
      t.step("push", `Push ${item.value}: append it at index ${i}, the next free slot in the bottom row.`, { marks: { [item.id]: "target" }, vars: { key: item.value, i } });
      while (i > 0) {
        const p = (i - 1) >> 1;
        const parent = heap[p].value;
        const up = parent > item.value;
        const verdict = up ? `${parent} > ${item.value}, so they swap` : `${parent} ≤ ${item.value}, so ${item.value} stays at index ${i}`;
        t.step("up-compare", `Compare ${item.value} with its parent at index ${p}: ${verdict}.`, { marks: pair(i, p, "compare"), vars: { key: item.value, i, parent: p } });
        if (!up) return;
        swap(i, p);
        t.step("up-swap", `${item.value} moves up to index ${p} and ${parent} moves down to index ${i}.`, { marks: pair(i, p, "swap"), vars: { key: item.value, i: p } });
        i = p;
      }
    };

    const popped: number[] = [];
    const popMin = () => {
      const top = heap[0];
      t.step("pop", `Pop-min: the root ${top.value} is the smallest key in the heap.`, { marks: { [top.id]: "target" }, vars: { top: top.value } });
      heap[0] = heap[heap.length - 1];
      heap.pop();
      popped.push(top.value);
      if (heap.length === 0) {
        t.step("move-last", `Remove ${top.value}. The heap is now empty.`, { vars: { top: top.value } });
        return;
      }
      t.step("move-last", `Remove ${top.value} and move the last key, ${heap[0].value}, into the root slot.`, { marks: { [heap[0].id]: "swap" }, vars: { top: top.value } });
      for (let i = 0; ; ) {
        const kids = [2 * i + 1, 2 * i + 2].filter((c) => c < heap.length);
        const child = kids.length === 0 ? i : kids.reduce((s, c) => (heap[c].value < heap[s].value ? c : s));
        const small = heap[child].value < heap[i].value ? child : i;
        const value = heap[i].value;
        if (small === i) {
          const why = kids.length === 0 ? `${value} has no children` : `${value} ≤ ${kids.map((c) => heap[c].value).join(" and ")}`;
          t.step("down-stop", `${why}, so the heap property holds again.`, { marks: pair(i, child, "compare"), vars: { top: top.value, i } });
          return;
        }
        t.step("down-compare", `${value} at index ${i} has children ${kids.map((c) => heap[c].value).join(" and ")}. The smallest is ${heap[small].value} at index ${small}, smaller than ${value}.`, { marks: pair(i, small, "compare"), vars: { top: top.value, i, small } });
        swap(i, small);
        t.step("down-swap", `Swap them: ${heap[i].value} moves up to index ${i} and ${value} moves down to index ${small}.`, { marks: pair(i, small, "swap"), vars: { top: top.value, i: small } });
        i = small;
      }
    };

    keys.forEach((value, id) => {
      t.aux.items.shift();
      push({ id, value });
    });
    for (let k = 0; k < pops; k++) {
      t.aux.items.shift();
      popMin();
    }
    for (const item of heap) t.marks[item.id] = "done";
    t.answer = `Popped ${popped.join(", ")}, the ${pops} smallest keys in order`;
    t.step("down-stop", `All operations are done. Pop-min returned ${popped.join(", ")}, the smallest keys in ascending order.`);
    return t.frames;
  },
};
