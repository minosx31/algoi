import { ArrayTracer } from "../../core/trace";
import type { SortingAlgorithm } from "../../core/types";

export const heapSort: SortingAlgorithm = {
  id: "heap-sort",
  name: "Heap Sort",
  kind: "sorting",
  topic: "sorting",
  about: {
    summary: "Arranges the array as a max-heap, then repeatedly swaps the root, the largest value, to the end of the heap and sifts the new root down to restore the heap.",
    invariants: [
      "In a max-heap, every parent is at least as large as its children, so the root holds the maximum.",
      "The children of index i sit at 2i + 1 and 2i + 2.",
      "After each extraction, A[end..n−1] holds the largest values in their final order.",
    ],
    useCases: [
      "In-place sorting with a guaranteed O(n log n) worst case and no extra memory.",
      "The heap operations behind priority queues, schedulers, and timers.",
      "The fallback inside introsort when quicksort recursion gets too deep.",
    ],
  },
  complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
  code: {
    pseudo: `
procedure siftDown(A, i, size)
  loop
    big ← i
    for each child c in 2i + 1, 2i + 2 do
      if c < size and A[c] > A[big] then   @@compare
        big ← c
    if big = i then return                 @@settled
    swap A[i], A[big]                      @@swap
    i ← big

procedure heapSort(A)
  n ← length(A)
  for i ← ⌊n / 2⌋ − 1 down to 0 do
    siftDown(A, i, n)                      @@build
  for end ← n − 1 down to 1 do
    swap A[0], A[end]                      @@extract
    siftDown(A, 0, end)
  A[0] is the last value, in place         @@done
`,
    python: `
def sift_down(a, i, size):
    while True:
        big = i
        for c in (2 * i + 1, 2 * i + 2):
            if c < size and a[c] > a[big]:      @@compare
                big = c
        if big == i:                            @@settled
            return
        a[i], a[big] = a[big], a[i]             @@swap
        i = big

def heap_sort(a):
    n = len(a)
    for i in range(n // 2 - 1, -1, -1):
        sift_down(a, i, n)                      @@build
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]             @@extract
        sift_down(a, 0, end)
    # a[0] is the last value, in place          @@done
`,
    cpp: `
void siftDown(std::vector<int>& a, int i, int size) {
    while (true) {
        int big = i;
        for (int c : {2 * i + 1, 2 * i + 2})
            if (c < size && a[c] > a[big]) big = c;     @@compare
        if (big == i) return;                   @@settled
        std::swap(a[i], a[big]);                @@swap
        i = big;
    }
}

void heapSort(std::vector<int>& a) {
    int n = a.size();
    for (int i = n / 2 - 1; i >= 0; i--)
        siftDown(a, i, n);                      @@build
    for (int end = n - 1; end > 0; end--) {
        std::swap(a[0], a[end]);                @@extract
        siftDown(a, 0, end);
    }
    // a[0] is the last value, in place         @@done
}
`,
    java: `
static void siftDown(int[] a, int i, int size) {
    while (true) {
        int big = i;
        for (int c : new int[] {2 * i + 1, 2 * i + 2})
            if (c < size && a[c] > a[big]) big = c;     @@compare
        if (big == i) return;                   @@settled
        int t = a[i]; a[i] = a[big]; a[big] = t;    @@swap
        i = big;
    }
}

static void heapSort(int[] a) {
    int n = a.length;
    for (int i = n / 2 - 1; i >= 0; i--)
        siftDown(a, i, n);                      @@build
    for (int end = n - 1; end > 0; end--) {
        int t = a[0]; a[0] = a[end]; a[end] = t;    @@extract
        siftDown(a, 0, end);
    }
    // a[0] is the last value, in place         @@done
}
`,
    javascript: `
function siftDown(a, i, size) {
  while (true) {
    let big = i;
    for (const c of [2 * i + 1, 2 * i + 2])
      if (c < size && a[c] > a[big]) big = c;   @@compare
    if (big === i) return;                      @@settled
    [a[i], a[big]] = [a[big], a[i]];            @@swap
    i = big;
  }
}

function heapSort(a) {
  const n = a.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--)
    siftDown(a, i, n);                          @@build
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];            @@extract
    siftDown(a, 0, end);
  }
  // a[0] is the last value, in place           @@done
}
`,
  },
  run(values) {
    const t = new ArrayTracer(values);
    const n = t.length;

    const siftDown = (start: number, size: number) => {
      let i = start;
      for (;;) {
        let big = i;
        for (const c of [2 * i + 1, 2 * i + 2]) {
          if (c >= size) continue;
          const wins = t.at(c) > t.at(big);
          const verdict = wins ? `${t.at(c)} is larger, so it becomes the largest.` : `${t.at(big)} stays the largest.`;
          t.step("compare", `Compare child A[${c}]=${t.at(c)} with A[${big}]=${t.at(big)}. ${verdict}`, { [i]: "active", [big]: "compare", [c]: "compare" }, { i, big, child: c, size });
          if (wins) big = c;
        }
        if (big === i) {
          const why = 2 * i + 1 >= size ? "has no child inside the heap" : "is at least as large as its children";
          t.step("settled", `A[${i}]=${t.at(i)} ${why}, so it stays.`, { [i]: "active" }, { i, size });
          return;
        }
        t.swap(i, big);
        t.step("swap", `Swap: ${t.at(i)} moves up to index ${i} and ${t.at(big)} moves down to index ${big}.`, { [i]: "swap", [big]: "swap" }, { i, big, size });
        i = big;
      }
    };

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      t.step("build", `Build the max-heap: sift A[${i}]=${t.at(i)} down.`, { [i]: "active" }, { i, size: n });
      siftDown(i, n);
    }
    for (let end = n - 1; end > 0; end--) {
      t.swap(0, end);
      t.markSorted(end);
      t.step("extract", `Swap the maximum ${t.at(end)} into index ${end}, its final place, and shrink the heap to ${end} values.`, { [0]: "swap" }, { end, size: end });
      siftDown(0, end);
    }
    if (n > 0) t.markSorted(0);
    t.step("done", n > 0 ? "Only A[0] is left, and it is in place. The array is sorted." : "Nothing to sort.");
    return t.frames;
  },
};
