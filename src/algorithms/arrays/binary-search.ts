import { ScanTracer } from "../../core/trace";
import type { ScanAlgorithm } from "../../core/types";

export const binarySearch: ScanAlgorithm = {
  id: "binary-search",
  name: "Binary Search",
  kind: "scan",
  topic: "arrays",
  pointers: ["lo", "mid", "hi"],
  legend: [
    ["active", "In range"],
    ["compare", "Middle probe"],
    ["found", "Target found"],
    ["muted", "Ruled out"],
  ],
  about: {
    summary: "Finds a value in a sorted array by probing the middle of the remaining range and discarding the half that cannot hold it.",
    invariants: [
      "If the target is in the array, it lies in A[lo..hi].",
      "Each probe at least halves the size of A[lo..hi], so the loop runs at most ⌊log₂ n⌋ + 1 times.",
    ],
    useCases: [
      "Lookups in sorted arrays, sorted files, and database index pages.",
      "Search on the answer: binary search a monotone yes/no question, such as the smallest ship capacity that delivers every package in D days.",
      "Lower and upper bounds, as in Python's bisect and C++'s std::lower_bound.",
    ],
  },
  complexity: { best: "O(1)", average: "O(log n)", worst: "O(log n)", space: "O(1)" },
  code: {
    pseudo: `
procedure binarySearch(A, target)
  lo ← 0; hi ← length(A) − 1                @@init
  while lo ≤ hi do
    mid ← ⌊(lo + hi) / 2⌋                    @@mid
    if A[mid] = target then                  @@check
      return mid                             @@found
    else if A[mid] < target then             @@right
      lo ← mid + 1                           @@right
    else                                     @@left
      hi ← mid − 1                           @@left
  return −1                                  @@absent
`,
    python: `
def binary_search(a, target):
    lo, hi = 0, len(a) - 1                  @@init
    while lo <= hi:
        mid = (lo + hi) // 2                @@mid
        if a[mid] == target:                @@check
            return mid                      @@found
        elif a[mid] < target:               @@right
            lo = mid + 1                    @@right
        else:                               @@left
            hi = mid - 1                    @@left
    return -1                               @@absent
`,
    cpp: `
int binarySearch(const std::vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;     @@init
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;       @@mid
        if (a[mid] == target) {             @@check
            return mid;                     @@found
        } else if (a[mid] < target) {       @@right
            lo = mid + 1;                   @@right
        } else {                            @@left
            hi = mid - 1;                   @@left
        }
    }
    return -1;                              @@absent
}
`,
    java: `
static int binarySearch(int[] a, int target) {
    int lo = 0, hi = a.length - 1;          @@init
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;       @@mid
        if (a[mid] == target) {             @@check
            return mid;                     @@found
        } else if (a[mid] < target) {       @@right
            lo = mid + 1;                   @@right
        } else {                            @@left
            hi = mid - 1;                   @@left
        }
    }
    return -1;                              @@absent
}
`,
    javascript: `
function binarySearch(a, target) {
  let lo = 0, hi = a.length - 1;            @@init
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);  @@mid
    if (a[mid] === target) {                @@check
      return mid;                           @@found
    } else if (a[mid] < target) {           @@right
      lo = mid + 1;                         @@right
    } else {                                @@left
      hi = mid - 1;                         @@left
    }
  }
  return -1;                                @@absent
}
`,
  },
  makeInput(size) {
    const values = Array.from({ length: 99 }, (_, i) => i + 1)
      .sort(() => Math.random() - 0.5)
      .slice(0, size)
      .sort((a, b) => a - b);
    // A target found in one or two probes ends the trace before there is a search to watch.
    const m = (size - 1) >> 1;
    const quick = [m, (m - 1) >> 1, (m + size) >> 1];
    const deep = values.filter((_, i) => !quick.includes(i));
    if (deep.length && Math.random() < 0.9) return { values, target: deep[Math.floor(Math.random() * deep.length)] };
    const absent = Array.from({ length: values[size - 1] - values[0] }, (_, i) => values[0] + i).filter((v) => !values.includes(v));
    return { values, target: absent.length ? absent[Math.floor(Math.random() * absent.length)] : values[size - 1] + 1 };
  },
  solve: ({ values, target }) => values.indexOf(target!),
  run({ values, target }) {
    const t = new ScanTracer(values);
    const want = target!;
    const n = values.length;
    const inBounds = (pointers: Record<string, number>) => Object.fromEntries(Object.entries(pointers).filter(([, i]) => i >= 0 && i < n));

    let lo = 0;
    let hi = n - 1;
    const narrowed = () => ({ marks: t.range(lo, hi), pointers: inBounds({ lo, hi }), vars: { target: want, lo, hi } });

    t.step("init", `Look for ${want} in the sorted array. It can only be in A[${lo}..${hi}].`, narrowed());
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const at = { pointers: { lo, mid, hi }, vars: { target: want, lo, mid, hi } };
      t.step("mid", `The middle of A[${lo}..${hi}] is index ${mid}.`, { ...at, marks: t.range(lo, hi, { [mid]: "compare" }) });
      if (values[mid] === want) {
        t.step("check", `A[${mid}] = ${values[mid]} is the target.`, { ...at, marks: t.range(lo, hi, { [mid]: "compare" }) });
        t.answer = mid;
        t.step("found", `Return index ${mid}.`, { ...at, marks: t.range(lo, hi, { [mid]: "found" }) });
        return t.frames;
      }
      t.step("check", `A[${mid}] = ${values[mid]} is not ${want}.`, { ...at, marks: t.range(lo, hi, { [mid]: "compare" }) });
      if (values[mid] < want) {
        lo = mid + 1;
        t.step("right", `${values[mid]} < ${want}, so the target can only be right of mid. Set lo = ${lo}.`, narrowed());
      } else {
        hi = mid - 1;
        t.step("left", `${values[mid]} > ${want}, so the target can only be left of mid. Set hi = ${hi}.`, narrowed());
      }
    }
    t.answer = -1;
    t.step("absent", `lo = ${lo} > hi = ${hi}, so the range is empty and ${want} is absent. Return -1.`, narrowed());
    return t.frames;
  },
};
