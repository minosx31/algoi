import { ArrayTracer } from "../../core/trace";
import type { SortingAlgorithm } from "../../core/types";

export const insertionSort: SortingAlgorithm = {
  id: "insertion-sort",
  name: "Insertion Sort",
  kind: "sorting",
  about: {
    summary: "Grows a sorted prefix one element at a time, sliding each new value left past every larger value until it fits.",
    invariants: [
      "Before step i, A[0..i−1] is sorted (though not necessarily final).",
      "Equal values never pass each other, so the sort is stable.",
    ],
    useCases: [
      "Small arrays: production sorts (Timsort, introsort) switch to it below ~16–32 elements.",
      "Nearly sorted data, where it runs in close to linear time.",
      "Online sorting, where values arrive one at a time.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  code: {
    pseudo: `
procedure insertionSort(A)
  n ← length(A)
  for i ← 1 to n − 1 do                     @@outer
    j ← i
    while j > 0 and A[j − 1] > A[j] do      @@compare
      swap A[j − 1], A[j]                   @@swap
      j ← j − 1
    A[j] is placed in the sorted prefix     @@insert
  mark all of A as sorted                   @@sorted
`,
    python: `
def insertion_sort(a):
    for i in range(1, len(a)):                  @@outer
        j = i
        while j > 0 and a[j - 1] > a[j]:        @@compare
            a[j - 1], a[j] = a[j], a[j - 1]     @@swap
            j -= 1
        # a[j] is placed in the sorted prefix   @@insert
    # the whole array is sorted                 @@sorted
`,
    cpp: `
void insertionSort(std::vector<int>& a) {
    int n = a.size();
    for (int i = 1; i < n; i++) {               @@outer
        int j = i;
        while (j > 0 && a[j - 1] > a[j]) {      @@compare
            std::swap(a[j - 1], a[j]);          @@swap
            j--;
        }
        // a[j] is placed in the sorted prefix  @@insert
    }
    // the whole array is sorted                @@sorted
}
`,
    java: `
static void insertionSort(int[] a) {
    int n = a.length;
    for (int i = 1; i < n; i++) {               @@outer
        int j = i;
        while (j > 0 && a[j - 1] > a[j]) {      @@compare
            int t = a[j - 1]; a[j - 1] = a[j]; a[j] = t;  @@swap
            j--;
        }
        // a[j] is placed in the sorted prefix  @@insert
    }
    // the whole array is sorted                @@sorted
}
`,
    javascript: `
function insertionSort(a) {
  const n = a.length;
  for (let i = 1; i < n; i++) {                 @@outer
    let j = i;
    while (j > 0 && a[j - 1] > a[j]) {          @@compare
      [a[j - 1], a[j]] = [a[j], a[j - 1]];      @@swap
      j--;
    }
    // a[j] is placed in the sorted prefix      @@insert
  }
  // the whole array is sorted                  @@sorted
}
`,
  },
  run(values) {
    const t = new ArrayTracer(values);
    const n = t.length;
    for (let i = 1; i < n; i++) {
      t.step("outer", `Insert A[${i}]=${t.at(i)} into the sorted prefix A[0..${i - 1}].`, { [i]: "active" }, { i });
      let j = i;
      while (j > 0) {
        t.step("compare", `Compare A[${j - 1}]=${t.at(j - 1)} with A[${j}]=${t.at(j)}.`, { [j - 1]: "compare", [j]: "compare" }, { i, j });
        if (t.at(j - 1) <= t.at(j)) break;
        t.swap(j - 1, j);
        t.step("swap", `${t.at(j)} > ${t.at(j - 1)}, so swap them.`, { [j - 1]: "swap", [j]: "swap" }, { i, j });
        j--;
      }
      t.step("insert", `${t.at(j)} settles at index ${j} of the sorted prefix.`, { [j]: "active" }, { i, j });
    }
    for (let i = 0; i < n; i++) t.markSorted(i);
    t.step("sorted", "Array is sorted.");
    return t.frames;
  },
};
