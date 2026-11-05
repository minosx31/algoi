import { ArrayTracer } from "../../core/trace";
import type { SortingAlgorithm } from "../../core/types";

export const selectionSort: SortingAlgorithm = {
  id: "selection-sort",
  name: "Selection Sort",
  kind: "sorting",
  about: {
    summary: "Repeatedly finds the smallest value in the unsorted part and swaps it into the next slot.",
    invariants: [
      "After step i, A[0..i] holds the i+1 smallest values in their final order.",
      "Every value in the sorted prefix is ≤ every value in the unsorted suffix.",
    ],
    useCases: [
      "When writes are expensive (e.g. flash memory): it does at most n − 1 swaps.",
      "Teaching the idea of a growing sorted region built from minimums.",
    ],
  },
  complexity: { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  code: {
    pseudo: `
procedure selectionSort(A)
  n ← length(A)
  for i ← 0 to n − 2 do                 @@outer
    min ← i
    for j ← i + 1 to n − 1 do           @@inner
      if A[j] < A[min] then             @@compare
        min ← j                         @@min
    if min ≠ i then
      swap A[i], A[min]                 @@swap
    mark A[i] as sorted                 @@sorted
`,
    python: `
def selection_sort(a):
    n = len(a)
    for i in range(n - 1):                      @@outer
        m = i
        for j in range(i + 1, n):               @@inner
            if a[j] < a[m]:                     @@compare
                m = j                           @@min
        if m != i:
            a[i], a[m] = a[m], a[i]             @@swap
        # a[i] is now in place                  @@sorted
`,
    cpp: `
void selectionSort(std::vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {           @@outer
        int m = i;
        for (int j = i + 1; j < n; j++) {       @@inner
            if (a[j] < a[m]) {                  @@compare
                m = j;                          @@min
            }
        }
        if (m != i) {
            std::swap(a[i], a[m]);              @@swap
        }
        // a[i] is now in place                 @@sorted
    }
}
`,
    java: `
static void selectionSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n - 1; i++) {           @@outer
        int m = i;
        for (int j = i + 1; j < n; j++) {       @@inner
            if (a[j] < a[m]) {                  @@compare
                m = j;                          @@min
            }
        }
        if (m != i) {
            int t = a[i]; a[i] = a[m]; a[m] = t;  @@swap
        }
        // a[i] is now in place                 @@sorted
    }
}
`,
    javascript: `
function selectionSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {             @@outer
    let m = i;
    for (let j = i + 1; j < n; j++) {           @@inner
      if (a[j] < a[m]) {                        @@compare
        m = j;                                  @@min
      }
    }
    if (m !== i) {
      [a[i], a[m]] = [a[m], a[i]];              @@swap
    }
    // a[i] is now in place                     @@sorted
  }
}
`,
  },
  run(values) {
    const t = new ArrayTracer(values);
    const n = t.length;
    for (let i = 0; i < n - 1; i++) {
      let m = i;
      t.step("outer", `Pass ${i + 1}: find the smallest value in A[${i}..${n - 1}].`, { [i]: "active" }, { i, min: m });
      for (let j = i + 1; j < n; j++) {
        t.step("compare", `Compare A[${j}]=${t.at(j)} with the current minimum A[${m}]=${t.at(m)}.`, { [m]: "active", [j]: "compare" }, { i, j, min: m });
        if (t.at(j) < t.at(m)) {
          m = j;
          t.step("min", `New minimum: A[${m}]=${t.at(m)}.`, { [m]: "active" }, { i, j, min: m });
        }
      }
      if (m !== i) {
        t.swap(i, m);
        t.step("swap", `Swap the minimum ${t.at(i)} into index ${i}.`, { [i]: "swap", [m]: "swap" }, { i, min: m });
      }
      t.markSorted(i);
      t.step("sorted", `Index ${i} now holds its final value ${t.at(i)}.`, {}, { i });
    }
    if (n > 0) t.markSorted(n - 1);
    t.step("sorted", "Array is sorted.");
    return t.frames;
  },
};
