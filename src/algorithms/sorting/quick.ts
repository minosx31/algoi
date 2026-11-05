import { ArrayTracer } from "../../core/trace";
import type { BarMark, SortingAlgorithm } from "../../core/types";

export const quickSort: SortingAlgorithm = {
  id: "quick-sort",
  name: "Quick Sort",
  kind: "sorting",
  about: {
    summary: "Picks a pivot, partitions the range so smaller values sit left of it and the rest sit right, then sorts each side the same way.",
    invariants: [
      "During partition: A[lo..i] < pivot ≤ A[i+1..j−1].",
      "After partition, the pivot is in its final position.",
    ],
    useCases: [
      "General-purpose in-memory sorting: fast in practice thanks to good cache behavior.",
      "The basis of most standard-library sorts (introsort adds a fallback for the O(n²) case).",
      "Quickselect: the same partition finds the k-th smallest value in O(n) average.",
    ],
  },
  complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n) avg, O(n) worst" },
  code: {
    pseudo: `
procedure quickSort(A, lo, hi)
  if lo ≥ hi then return                       @@base
  pivot ← A[hi]                                @@pivot
  i ← lo − 1
  for j ← lo to hi − 1 do
    if A[j] < pivot then                       @@compare
      i ← i + 1
      swap A[i], A[j]                          @@swap
  swap A[i + 1], A[hi]                         @@place
  quickSort(A, lo, i)
  quickSort(A, i + 2, hi)
`,
    python: `
def quick_sort(a, lo=0, hi=None):
    if hi is None:
        hi = len(a) - 1
    if lo >= hi:                                @@base
        return
    pivot = a[hi]                               @@pivot
    i = lo - 1
    for j in range(lo, hi):
        if a[j] < pivot:                        @@compare
            i += 1
            a[i], a[j] = a[j], a[i]             @@swap
    a[i + 1], a[hi] = a[hi], a[i + 1]           @@place
    quick_sort(a, lo, i)
    quick_sort(a, i + 2, hi)
`,
    cpp: `
void quickSort(std::vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;                       @@base
    int pivot = a[hi];                          @@pivot
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {                     @@compare
            i++;
            std::swap(a[i], a[j]);              @@swap
        }
    }
    std::swap(a[i + 1], a[hi]);                 @@place
    quickSort(a, lo, i);
    quickSort(a, i + 2, hi);
}
`,
    java: `
static void quickSort(int[] a, int lo, int hi) {
    if (lo >= hi) return;                       @@base
    int pivot = a[hi];                          @@pivot
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {                     @@compare
            i++;
            int t = a[i]; a[i] = a[j]; a[j] = t;    @@swap
        }
    }
    int t = a[i + 1]; a[i + 1] = a[hi]; a[hi] = t;  @@place
    quickSort(a, lo, i);
    quickSort(a, i + 2, hi);
}
`,
    javascript: `
function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;                         @@base
  const pivot = a[hi];                          @@pivot
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) {                         @@compare
      i++;
      [a[i], a[j]] = [a[j], a[i]];              @@swap
    }
  }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];        @@place
  quickSort(a, lo, i);
  quickSort(a, i + 2, hi);
}
`,
  },
  run(values) {
    const t = new ArrayTracer(values);
    const n = t.length;

    const scope = (lo: number, hi: number, marks: Partial<Record<number, BarMark>> = {}) => {
      const all: Partial<Record<number, BarMark>> = {};
      for (let k = 0; k < n; k++) if ((k < lo || k > hi) && !t.sorted.has(k)) all[k] = "muted";
      return Object.assign(all, marks);
    };
    const smaller = (lo: number, i: number) => {
      const marks: Partial<Record<number, BarMark>> = {};
      for (let k = lo; k <= i; k++) marks[k] = "active";
      return marks;
    };

    const sort = (lo: number, hi: number) => {
      if (lo > hi) return;
      if (lo === hi) {
        t.markSorted(lo);
        t.step("base", `A[${lo}]=${t.at(lo)} is alone in its range, so it is already in place.`, scope(lo, hi), { lo, hi });
        return;
      }
      const pivot = t.at(hi);
      t.step("pivot", `Pick the last element A[${hi}]=${pivot} as pivot for A[${lo}..${hi}].`, scope(lo, hi, { [hi]: "pivot" }), { lo, hi });
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        t.step("compare", `Compare A[${j}]=${t.at(j)} with pivot ${pivot}.`, scope(lo, hi, { ...smaller(lo, i), [hi]: "pivot", [j]: "compare" }), { lo, hi, i, j });
        if (t.at(j) < pivot) {
          i++;
          t.swap(i, j);
          const note =
            i === j
              ? `${t.at(i)} < ${pivot} and is already at index ${i}, so the smaller region grows.`
              : `${t.at(i)} < ${pivot}, so swap it into index ${i}.`;
          t.step("swap", note, scope(lo, hi, { ...smaller(lo, i), [hi]: "pivot", [i]: "swap", [j]: "swap" }), { lo, hi, i, j });
        }
      }
      const p = i + 1;
      t.swap(p, hi);
      t.markSorted(p);
      t.step("place", `Swap the pivot ${pivot} into index ${p}. Smaller values are left of it, the rest are right of it.`, scope(lo, hi), { lo, hi, p });
      sort(lo, p - 1);
      sort(p + 1, hi);
    };

    if (n === 0) t.step("base", "Nothing to sort.");
    else sort(0, n - 1);
    return t.frames;
  },
};
