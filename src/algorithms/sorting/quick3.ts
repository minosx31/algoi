import { ArrayTracer } from "../../core/trace";
import type { BarMark, SortingAlgorithm } from "../../core/types";

export const quickSort3: SortingAlgorithm = {
  id: "quick-sort-3way",
  name: "3-Way Quick Sort",
  kind: "sorting",
  topic: "sorting",
  about: {
    summary: "Partitions the range into values below the pivot, equal to it, and above it in one pass (the Dutch national flag), then recurses only on the two outer parts.",
    invariants: [
      "During partition: A[lo..lt−1] < pivot, A[lt..i−1] = pivot, and A[gt+1..hi] > pivot. A[i..gt] is unexamined.",
      "After partition, every value equal to the pivot is in its final place.",
    ],
    useCases: [
      "Arrays with many duplicate keys, where plain quicksort keeps re-sorting equal values.",
      "The Dutch national flag interview problem: sort values drawn from three groups in one pass.",
      "Standard-library sorts that guard against inputs with few distinct values.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n) avg, O(n) worst" },
  code: {
    pseudo: `
procedure quickSort3(A, lo, hi)
  if lo ≥ hi then return                        @@base
  pivot ← A[lo]                                 @@pivot
  lt ← lo; i ← lo + 1; gt ← hi
  while i ≤ gt do
    if A[i] < pivot then                        @@compare
      swap A[lt], A[i]                          @@less
      lt ← lt + 1; i ← i + 1
    else if A[i] > pivot then                   @@compare
      swap A[i], A[gt]                          @@greater
      gt ← gt − 1
    else
      i ← i + 1                                 @@equal
  A[lt..gt] all equal pivot, in final place     @@fixed
  quickSort3(A, lo, lt − 1)
  quickSort3(A, gt + 1, hi)
`,
    python: `
def quick_sort_3way(a, lo=0, hi=None):
    if hi is None:
        hi = len(a) - 1
    if lo >= hi:                                @@base
        return
    pivot = a[lo]                               @@pivot
    lt, i, gt = lo, lo + 1, hi
    while i <= gt:
        if a[i] < pivot:                        @@compare
            a[lt], a[i] = a[i], a[lt]           @@less
            lt += 1
            i += 1
        elif a[i] > pivot:                      @@compare
            a[i], a[gt] = a[gt], a[i]           @@greater
            gt -= 1
        else:
            i += 1                              @@equal
    # a[lt..gt] all equal pivot, in final place     @@fixed
    quick_sort_3way(a, lo, lt - 1)
    quick_sort_3way(a, gt + 1, hi)
`,
    cpp: `
void quickSort3(std::vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;                       @@base
    int pivot = a[lo];                          @@pivot
    int lt = lo, i = lo + 1, gt = hi;
    while (i <= gt) {
        if (a[i] < pivot) {                     @@compare
            std::swap(a[lt], a[i]);             @@less
            lt++;
            i++;
        } else if (a[i] > pivot) {              @@compare
            std::swap(a[i], a[gt]);             @@greater
            gt--;
        } else {
            i++;                                @@equal
        }
    }
    // a[lt..gt] all equal pivot, in final place    @@fixed
    quickSort3(a, lo, lt - 1);
    quickSort3(a, gt + 1, hi);
}
`,
    java: `
static void quickSort3(int[] a, int lo, int hi) {
    if (lo >= hi) return;                       @@base
    int pivot = a[lo];                          @@pivot
    int lt = lo, i = lo + 1, gt = hi;
    while (i <= gt) {
        if (a[i] < pivot) {                     @@compare
            int t = a[lt]; a[lt] = a[i]; a[i] = t;      @@less
            lt++;
            i++;
        } else if (a[i] > pivot) {              @@compare
            int t = a[i]; a[i] = a[gt]; a[gt] = t;      @@greater
            gt--;
        } else {
            i++;                                @@equal
        }
    }
    // a[lt..gt] all equal pivot, in final place    @@fixed
    quickSort3(a, lo, lt - 1);
    quickSort3(a, gt + 1, hi);
}
`,
    javascript: `
function quickSort3(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;                         @@base
  const pivot = a[lo];                          @@pivot
  let lt = lo, i = lo + 1, gt = hi;
  while (i <= gt) {
    if (a[i] < pivot) {                         @@compare
      [a[lt], a[i]] = [a[i], a[lt]];            @@less
      lt++;
      i++;
    } else if (a[i] > pivot) {                  @@compare
      [a[i], a[gt]] = [a[gt], a[i]];            @@greater
      gt--;
    } else {
      i++;                                      @@equal
    }
  }
  // a[lt..gt] all equal pivot, in final place  @@fixed
  quickSort3(a, lo, lt - 1);
  quickSort3(a, gt + 1, hi);
}
`,
  },
  run(values) {
    const t = new ArrayTracer(values);
    const n = t.length;

    const sort = (lo: number, hi: number) => {
      if (lo > hi) return;
      const scope = (marks: Partial<Record<number, BarMark>> = {}) => {
        const all: Partial<Record<number, BarMark>> = {};
        for (let k = 0; k < n; k++) if ((k < lo || k > hi) && !t.sorted.has(k)) all[k] = "muted";
        return Object.assign(all, marks);
      };
      if (lo === hi) {
        t.markSorted(lo);
        t.step("base", `A[${lo}]=${t.at(lo)} is alone in its range, so it is already in place.`, scope(), { lo, hi });
        return;
      }

      const pivot = t.at(lo);
      let lt = lo;
      let i = lo + 1;
      let gt = hi;
      const regions = (extra: Partial<Record<number, BarMark>> = {}) => {
        const marks: Partial<Record<number, BarMark>> = {};
        for (let k = lo; k < lt; k++) marks[k] = "active";
        for (let k = lt; k < i; k++) marks[k] = "pivot";
        return scope({ ...marks, ...extra });
      };
      const vars = () => ({ lo, hi, lt, i, gt });

      t.step("pivot", `Pick A[${lo}]=${pivot} as pivot for A[${lo}..${hi}].`, scope({ [lo]: "pivot" }), vars());
      while (i <= gt) {
        const x = t.at(i);
        t.step("compare", `Compare A[${i}]=${x} with pivot ${pivot}.`, regions({ [i]: "compare" }), vars());
        if (x < pivot) {
          t.swap(lt, i);
          lt++;
          i++;
          t.step("less", `${x} < ${pivot}, so swap it to index ${lt - 1} and move both boundaries right.`, regions({ [lt - 1]: "swap", [i - 1]: "swap" }), vars());
        } else if (x > pivot) {
          t.swap(i, gt);
          gt--;
          t.step("greater", `${x} > ${pivot}, so swap it to index ${gt + 1} and shrink the unexamined range.`, regions({ [i]: "swap", [gt + 1]: "swap" }), vars());
        } else {
          i++;
          t.step("equal", `${x} equals the pivot ${pivot}, so the run of equal values grows.`, regions(), vars());
        }
      }

      for (let k = lt; k <= gt; k++) t.markSorted(k);
      const run: Partial<Record<number, BarMark>> = {};
      for (let k = lt; k <= gt; k++) run[k] = "pivot";
      const count = gt - lt + 1;
      t.step("fixed", `A[${lt}..${gt}] ${count === 1 ? "is the only value" : `holds all ${count} values`} equal to ${pivot}, now in final place.`, scope(run), vars());
      sort(lo, lt - 1);
      sort(gt + 1, hi);
    };

    if (n === 0) t.step("base", "Nothing to sort.");
    else {
      sort(0, n - 1);
      t.step("base", "Every remaining range is empty, so the array is sorted.");
    }
    return t.frames;
  },
};
