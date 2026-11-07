import { ScanTracer } from "../../core/trace";
import { randomArray } from "../../core/inputs";
import type { ScanAlgorithm } from "../../core/types";

export const quickselect: ScanAlgorithm = {
  id: "quickselect",
  name: "Quickselect",
  kind: "scan",
  topic: "arrays",
  pointers: ["i", "j"],
  about: {
    summary: "Finds the k-th smallest value without sorting everything: partition around a pivot, then keep only the side that must hold rank k and ignore the other.",
    invariants: [
      "After a partition the pivot sits at its final sorted index, with smaller values to its left and the rest to its right.",
      "The k-th smallest always lies inside A[lo..hi], and each round discards the pivot and one side.",
      "Expected work is n + n/2 + n/4 + ..., which is O(n); a pivot that always lands at an end makes it O(n²).",
    ],
    useCases: [
      "Medians and percentiles of a data set without a full sort.",
      "Top-k selection: the k smallest or largest values end up on one side of index k − 1.",
      "The partition step shared with quicksort, as in C++'s std::nth_element.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n²)", space: "O(1)" },
  code: {
    pseudo: `
procedure quickselect(A, k)
  lo ← 0; hi ← length(A) − 1                       @@init
  loop
    swap A[(lo + hi) / 2] with A[hi]               @@pivot
    p ← A[hi]; i ← lo                              @@pivot
    for j ← lo to hi − 1 do
      if A[j] < p then                             @@compare
        swap A[i] with A[j]                        @@swap
        i ← i + 1                                  @@swap
    swap A[i] with A[hi]                           @@place
    if i = k − 1 then return A[i]                  @@found
    if i < k − 1 then lo ← i + 1                   @@right
    else hi ← i − 1                                @@left
`,
    python: `
def quickselect(values, k):
    a = list(values)
    lo, hi = 0, len(a) - 1                         @@init
    while True:
        m = (lo + hi) // 2                         @@pivot
        a[m], a[hi] = a[hi], a[m]                  @@pivot
        p, i = a[hi], lo                           @@pivot
        for j in range(lo, hi):
            if a[j] < p:                           @@compare
                a[i], a[j] = a[j], a[i]            @@swap
                i += 1                             @@swap
        a[i], a[hi] = a[hi], a[i]                  @@place
        if i == k - 1:                             @@found
            return a[i]                            @@found
        if i < k - 1:                              @@right
            lo = i + 1                             @@right
        else:                                      @@left
            hi = i - 1                             @@left
`,
    cpp: `
int quickselect(std::vector<int> a, int k) {
    int lo = 0, hi = (int)a.size() - 1;            @@init
    while (true) {
        std::swap(a[(lo + hi) / 2], a[hi]);        @@pivot
        int p = a[hi], i = lo;                     @@pivot
        for (int j = lo; j < hi; j++) {
            if (a[j] < p) {                        @@compare
                std::swap(a[i], a[j]);             @@swap
                i++;                               @@swap
            }
        }
        std::swap(a[i], a[hi]);                    @@place
        if (i == k - 1) return a[i];               @@found
        if (i < k - 1) lo = i + 1;                 @@right
        else hi = i - 1;                           @@left
    }
}
`,
    java: `
static int quickselect(int[] values, int k) {
    int[] a = values.clone();
    int lo = 0, hi = a.length - 1;                 @@init
    while (true) {
        swap(a, (lo + hi) / 2, hi);                @@pivot
        int p = a[hi], i = lo;                     @@pivot
        for (int j = lo; j < hi; j++) {
            if (a[j] < p) {                        @@compare
                swap(a, i, j);                     @@swap
                i++;                               @@swap
            }
        }
        swap(a, i, hi);                            @@place
        if (i == k - 1) return a[i];               @@found
        if (i < k - 1) lo = i + 1;                 @@right
        else hi = i - 1;                           @@left
    }
}
static void swap(int[] a, int x, int y) { int t = a[x]; a[x] = a[y]; a[y] = t; }
`,
    javascript: `
function quickselect(values, k) {
  const a = [...values];
  let lo = 0, hi = a.length - 1;                   @@init
  for (;;) {
    const m = (lo + hi) >> 1;                      @@pivot
    [a[m], a[hi]] = [a[hi], a[m]];                 @@pivot
    const p = a[hi];                               @@pivot
    let i = lo;                                    @@pivot
    for (let j = lo; j < hi; j++) {
      if (a[j] < p) {                              @@compare
        [a[i], a[j]] = [a[j], a[i]];               @@swap
        i++;                                       @@swap
      }
    }
    [a[i], a[hi]] = [a[hi], a[i]];                 @@place
    if (i === k - 1) return a[i];                  @@found
    if (i < k - 1) lo = i + 1;                     @@right
    else hi = i - 1;                               @@left
  }
}
`,
  },
  makeInput: (size) => ({ values: randomArray(size), k: 1 + Math.floor(Math.random() * size) }),
  solve: ({ values, k }) => [...values].sort((a, b) => a - b)[k! - 1],
  run({ values, k }) {
    const t = new ScanTracer(values);
    const rank = k!;
    const slot = rank - 1;
    const swap = (a: number, b: number) => ([t.items[a], t.items[b]] = [t.items[b], t.items[a]]);
    t.labels[slot] = `k=${rank}`;

    let lo = 0;
    let hi = values.length - 1;
    t.step("init", `Find the value of rank k = ${rank}, the one that would sit at index ${slot} if the array were sorted.`, { marks: t.range(lo, hi), vars: { k: rank, lo, hi } });
    for (;;) {
      swap((lo + hi) >> 1, hi);
      const p = t.items[hi].value;
      let i = lo;
      t.step("pivot", `Move the middle value ${p} of A[${lo}..${hi}] to the end and use it as the pivot.`, {
        marks: t.range(lo, hi, { [hi]: "pivot" }),
        pointers: { i },
        vars: { k: rank, lo, hi, pivot: p },
      });
      for (let j = lo; j < hi; j++) {
        const v = t.items[j].value;
        const here = { marks: t.range(lo, hi, { [hi]: "pivot", [j]: "compare" }), pointers: { i, j }, vars: { k: rank, lo, hi, pivot: p, i, j } };
        t.step("compare", v < p ? `A[${j}] = ${v} < pivot ${p}, so it belongs left of the pivot.` : `A[${j}] = ${v} ≥ pivot ${p}, so it stays right of i.`, here);
        if (v >= p) continue;
        swap(i, j);
        const slotted = i++;
        t.step("swap", slotted === j ? `A[${j}] is already at i = ${slotted}, so only i moves to ${i}.` : `Swap A[${slotted}] with A[${j}], then move i to ${i}.`, {
          vars: { k: rank, lo, hi, pivot: p, i, j },
          marks: t.range(lo, hi, { [hi]: "pivot", [slotted]: "swap", [j]: "swap" }),
          pointers: { i, j },
        });
      }
      swap(i, hi);
      t.step("place", `Swap the pivot ${p} into index ${i}. It is now in its sorted place, rank ${i + 1}.`, {
        marks: t.range(lo, hi, { [i]: "pivot" }),
        pointers: { i },
        vars: { k: rank, lo, hi, pivot: p, i },
      });
      if (i === slot) {
        t.answer = p;
        t.step("found", `Index ${i} is index k − 1, so the k = ${rank} smallest value is ${p}.`, { marks: { [i]: "found" }, pointers: { i }, vars: { k: rank, answer: p } });
        return t.frames;
      }
      if (i < slot) {
        lo = i + 1;
        t.step("right", `Index ${i} is left of index ${slot}, so the answer is in A[${lo}..${hi}]. Drop the left side.`, { marks: t.range(lo, hi), vars: { k: rank, lo, hi } });
      } else {
        hi = i - 1;
        t.step("left", `Index ${i} is right of index ${slot}, so the answer is in A[${lo}..${hi}]. Drop the right side.`, { marks: t.range(lo, hi), vars: { k: rank, lo, hi } });
      }
    }
  },
};
