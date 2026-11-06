import { ArrayTracer } from "../../core/trace";
import type { SortingAlgorithm } from "../../core/types";

export const bubbleSort: SortingAlgorithm = {
  id: "bubble-sort",
  name: "Bubble Sort",
  kind: "sorting",
  topic: "sorting",
  about: {
    summary: "Sweeps the array repeatedly, swapping adjacent out-of-order pairs, so the largest remaining value bubbles to the end on each pass.",
    invariants: [
      "After pass i, the last i positions hold the i largest values in their final order.",
      "A pass only ever moves the current maximum of the unsorted prefix to its end.",
    ],
    useCases: [
      "Teaching: the simplest sort to reason about and trace by hand.",
      "Tiny or nearly sorted arrays, when written with an early exit on a pass that makes no swaps (this version has none, so its best case is still O(n²)).",
    ],
  },
  complexity: { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  code: {
    pseudo: `
procedure bubbleSort(A)
  n ← length(A)
  for i ← 0 to n − 2 do                 @@outer
    for j ← 0 to n − i − 2 do           @@inner
      if A[j] > A[j + 1] then           @@compare
        swap A[j], A[j + 1]             @@swap
    mark A[n − i − 1] as sorted         @@sorted
`,
    python: `
def bubble_sort(a):
    n = len(a)
    for i in range(n - 1):                  @@outer
        for j in range(n - i - 1):          @@inner
            if a[j] > a[j + 1]:             @@compare
                a[j], a[j + 1] = a[j + 1], a[j]  @@swap
        # a[n - i - 1] is now in place      @@sorted
`,
    cpp: `
void bubbleSort(std::vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {           @@outer
        for (int j = 0; j < n - i - 1; j++) {   @@inner
            if (a[j] > a[j + 1]) {              @@compare
                std::swap(a[j], a[j + 1]);      @@swap
            }
        }
        // a[n - i - 1] is now in place         @@sorted
    }
}
`,
    java: `
static void bubbleSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n - 1; i++) {           @@outer
        for (int j = 0; j < n - i - 1; j++) {   @@inner
            if (a[j] > a[j + 1]) {              @@compare
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;  @@swap
            }
        }
        // a[n - i - 1] is now in place         @@sorted
    }
}
`,
    javascript: `
function bubbleSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {             @@outer
    for (let j = 0; j < n - i - 1; j++) {       @@inner
      if (a[j] > a[j + 1]) {                    @@compare
        [a[j], a[j + 1]] = [a[j + 1], a[j]];    @@swap
      }
    }
    // a[n - i - 1] is now in place             @@sorted
  }
}
`,
  },
  run(values) {
    const t = new ArrayTracer(values);
    const n = t.length;
    for (let i = 0; i < n - 1; i++) {
      t.step("outer", `Pass ${i + 1}: bubble the largest remaining value to index ${n - i - 1}.`, {}, { i });
      for (let j = 0; j < n - i - 1; j++) {
        t.step("compare", `Compare A[${j}]=${t.at(j)} with A[${j + 1}]=${t.at(j + 1)}.`, { [j]: "compare", [j + 1]: "compare" }, { i, j });
        if (t.at(j) > t.at(j + 1)) {
          t.swap(j, j + 1);
          t.step("swap", `${t.at(j + 1)} > ${t.at(j)}, so swap them.`, { [j]: "swap", [j + 1]: "swap" }, { i, j });
        }
      }
      t.markSorted(n - i - 1);
      t.step("sorted", `Index ${n - i - 1} now holds its final value ${t.at(n - i - 1)}.`, {}, { i });
    }
    t.markSorted(0);
    t.step("sorted", "Array is sorted.");
    return t.frames;
  },
};
