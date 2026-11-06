import { ArrayTracer } from "../../core/trace";
import type { ArrayItem, BarMark, SortingAlgorithm } from "../../core/types";

export const mergeSort: SortingAlgorithm = {
  id: "merge-sort",
  name: "Merge Sort",
  kind: "sorting",
  topic: "sorting",
  about: {
    summary: "Splits the array in half, sorts each half recursively, then merges the two sorted halves by repeatedly taking the smaller front value.",
    invariants: [
      "Each recursive call returns its range fully sorted.",
      "During a merge, the output holds the smallest values of both halves seen so far, in order.",
      "Ties take from the left half first, so the sort is stable.",
    ],
    useCases: [
      "Guaranteed O(n log n) regardless of input order.",
      "Stable sorting, e.g. sorting records by a second key.",
      "Linked lists and external sorting of data too large for memory.",
    ],
  },
  complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  code: {
    pseudo: `
procedure mergeSort(A, lo, hi)
  if lo ≥ hi then return                             @@base
  mid ← lo + ⌊(hi − lo) / 2⌋                         @@split
  mergeSort(A, lo, mid)
  mergeSort(A, mid + 1, hi)
  out ← empty list                                   @@merge
  i ← lo; j ← mid + 1
  while i ≤ mid and j ≤ hi do
    if A[i] ≤ A[j] then                              @@compare
      append A[i] to out; i ← i + 1
    else
      append A[j] to out; j ← j + 1
  append the rest of A[i..mid] and A[j..hi] to out
  copy out into A[lo..hi]                            @@write
`,
    python: `
def merge_sort(a, lo=0, hi=None):
    if hi is None:
        hi = len(a) - 1
    if lo >= hi:                                @@base
        return
    mid = lo + (hi - lo) // 2                   @@split
    merge_sort(a, lo, mid)
    merge_sort(a, mid + 1, hi)
    out = []                                    @@merge
    i, j = lo, mid + 1
    while i <= mid and j <= hi:
        if a[i] <= a[j]:                        @@compare
            out.append(a[i])
            i += 1
        else:
            out.append(a[j])
            j += 1
    out.extend(a[i:mid + 1])
    out.extend(a[j:hi + 1])
    a[lo:hi + 1] = out                          @@write
`,
    cpp: `
void mergeSort(std::vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;                       @@base
    int mid = lo + (hi - lo) / 2;               @@split
    mergeSort(a, lo, mid);
    mergeSort(a, mid + 1, hi);
    std::vector<int> out;                       @@merge
    int i = lo, j = mid + 1;
    while (i <= mid && j <= hi) {
        if (a[i] <= a[j]) out.push_back(a[i++]);    @@compare
        else out.push_back(a[j++]);
    }
    while (i <= mid) out.push_back(a[i++]);
    while (j <= hi) out.push_back(a[j++]);
    std::copy(out.begin(), out.end(), a.begin() + lo);  @@write
}
`,
    java: `
static void mergeSort(int[] a, int lo, int hi) {
    if (lo >= hi) return;                       @@base
    int mid = lo + (hi - lo) / 2;               @@split
    mergeSort(a, lo, mid);
    mergeSort(a, mid + 1, hi);
    int[] out = new int[hi - lo + 1];           @@merge
    int i = lo, j = mid + 1, k = 0;
    while (i <= mid && j <= hi) {
        if (a[i] <= a[j]) out[k++] = a[i++];    @@compare
        else out[k++] = a[j++];
    }
    while (i <= mid) out[k++] = a[i++];
    while (j <= hi) out[k++] = a[j++];
    System.arraycopy(out, 0, a, lo, out.length);    @@write
}
`,
    javascript: `
function mergeSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;                         @@base
  const mid = lo + Math.floor((hi - lo) / 2);   @@split
  mergeSort(a, lo, mid);
  mergeSort(a, mid + 1, hi);
  const out = [];                               @@merge
  let i = lo, j = mid + 1;
  while (i <= mid && j <= hi) {
    if (a[i] <= a[j]) out.push(a[i++]);         @@compare
    else out.push(a[j++]);
  }
  while (i <= mid) out.push(a[i++]);
  while (j <= hi) out.push(a[j++]);
  a.splice(lo, out.length, ...out);             @@write
}
`,
  },
  run(values) {
    const t = new ArrayTracer(values);
    const n = t.length;

    const scope = (lo: number, hi: number, marks: Partial<Record<number, BarMark>> = {}) => {
      const all: Partial<Record<number, BarMark>> = {};
      for (let k = 0; k < n; k++) all[k] = k >= lo && k <= hi ? "active" : "muted";
      return Object.assign(all, marks);
    };
    const markAll = () => {
      for (let k = 0; k < n; k++) t.markSorted(k);
    };

    const sort = (lo: number, hi: number) => {
      const whole = lo === 0 && hi === n - 1;
      if (lo >= hi) {
        if (whole) markAll();
        const note = lo === hi ? `A[${lo}]=${t.at(lo)} is a single element, already sorted.` : "Nothing to sort.";
        t.step("base", note, whole ? {} : scope(lo, hi), { lo, hi });
        return;
      }
      const mid = lo + Math.floor((hi - lo) / 2);
      t.step("split", `Split A[${lo}..${hi}] into A[${lo}..${mid}] and A[${mid + 1}..${hi}].`, scope(lo, hi), { lo, hi, mid });
      sort(lo, mid);
      sort(mid + 1, hi);

      t.step("merge", `Merge sorted halves A[${lo}..${mid}] and A[${mid + 1}..${hi}].`, scope(lo, hi), { lo, hi, mid });
      const out: ArrayItem[] = [];
      let i = lo;
      let j = mid + 1;
      const outText = () => out.map((it) => it.value).join(", ");
      while (i <= mid && j <= hi) {
        const left = t.items[i];
        const right = t.items[j];
        const takeLeft = left.value <= right.value;
        const verdict = takeLeft ? `${left.value} ≤ ${right.value}, so take ${left.value}.` : `${left.value} > ${right.value}, so take ${right.value}.`;
        t.step("compare", `Compare A[${i}]=${left.value} with A[${j}]=${right.value}. ${verdict}`, scope(lo, hi, { [i]: "compare", [j]: "compare" }), { lo, hi, i, j, out: outText() });
        out.push(takeLeft ? left : right);
        if (takeLeft) i++;
        else j++;
      }
      while (i <= mid) out.push(t.items[i++]);
      while (j <= hi) out.push(t.items[j++]);

      const moved: Partial<Record<number, BarMark>> = {};
      out.forEach((item, k) => {
        if (t.items[lo + k].id !== item.id) moved[lo + k] = "swap";
        t.set(lo + k, item);
      });
      if (whole) markAll();
      t.step("write", `Copy merged values back into A[${lo}..${hi}]: ${outText()}.`, whole ? {} : scope(lo, hi, moved), { lo, hi, out: outText() });
    };

    sort(0, n - 1);
    return t.frames;
  },
};
