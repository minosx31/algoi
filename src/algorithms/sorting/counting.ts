import { ArrayTracer } from "../../core/trace";
import type { BarMark, SortingAlgorithm } from "../../core/types";
import { placeAt } from "./place";

export const countingSort: SortingAlgorithm = {
  id: "counting-sort",
  name: "Counting Sort",
  kind: "sorting",
  topic: "sorting",
  about: {
    summary: "Counts how often each value occurs, turns the counts into the index where each value's block starts, then writes every value straight to its place without comparing values.",
    invariants: [
      "After the prefix pass, count[v] is the number of values smaller than v, which is the index where v's block starts.",
      "Every write lands in its final place, so written bars never move again.",
      "Equal values keep their input order, so the sort is stable.",
    ],
    useCases: [
      "Sorting small non-negative integer keys, such as ages, scores, or grades, in linear time.",
      "The stable per-digit pass inside radix sort.",
      "Building a histogram or rank table over a bounded range of values.",
    ],
  },
  complexity: { best: "O(n + k)", average: "O(n + k)", worst: "O(n + k)", space: "O(n + k)" },
  code: {
    pseudo: `
procedure countingSort(A)
  if A is empty then return                    @@base
  hi ← max(A)
  count ← array of hi + 1 zeros                @@init
  for each x in A do
    count[x] ← count[x] + 1                    @@count
  total ← 0
  for v ← 0 to hi do
    c ← count[v]
    count[v] ← total                           @@prefix
    total ← total + c
  src ← copy of A
  for each x in src, in order do
    A[count[x]] ← x                            @@place
    count[x] ← count[x] + 1
`,
    python: `
def counting_sort(a):
    if not a:                                   @@base
        return
    hi = max(a)
    count = [0] * (hi + 1)                      @@init
    for x in a:
        count[x] += 1                           @@count
    total = 0
    for v in range(hi + 1):
        count[v], total = total, total + count[v]   @@prefix
    src = a[:]
    for x in src:
        a[count[x]] = x                         @@place
        count[x] += 1
`,
    cpp: `
void countingSort(std::vector<int>& a) {
    if (a.empty()) return;                      @@base
    int hi = *std::max_element(a.begin(), a.end());
    std::vector<int> count(hi + 1, 0);          @@init
    for (int x : a) count[x]++;                 @@count
    int total = 0;
    for (int v = 0; v <= hi; v++) {
        int c = count[v];
        count[v] = total;                       @@prefix
        total += c;
    }
    std::vector<int> src = a;
    for (int x : src) a[count[x]++] = x;        @@place
}
`,
    java: `
static void countingSort(int[] a) {
    if (a.length == 0) return;                  @@base
    int hi = Arrays.stream(a).max().getAsInt();
    int[] count = new int[hi + 1];              @@init
    for (int x : a) count[x]++;                 @@count
    int total = 0;
    for (int v = 0; v <= hi; v++) {
        int c = count[v];
        count[v] = total;                       @@prefix
        total += c;
    }
    int[] src = a.clone();
    for (int x : src) a[count[x]++] = x;        @@place
}
`,
    javascript: `
function countingSort(a) {
  if (a.length === 0) return;                   @@base
  const hi = Math.max(...a);
  const count = new Array(hi + 1).fill(0);      @@init
  for (const x of a) count[x]++;                @@count
  let total = 0;
  for (let v = 0; v <= hi; v++) {
    const c = count[v];
    count[v] = total;                           @@prefix
    total += c;
  }
  for (const x of [...a]) a[count[x]++] = x;    @@place
}
`,
  },
  run(values) {
    const t = new ArrayTracer(values);
    const n = t.length;
    if (n === 0) {
      t.step("base", "Nothing to sort.");
      return t.frames;
    }

    const src = t.items.slice();
    const hi = Math.max(...values);
    const count = new Array<number>(hi + 1).fill(0);
    t.step("init", `Make a counter for every value from 0 to ${hi}, the largest value.`, {}, { max: hi });

    src.forEach((item, i) => {
      count[item.value]++;
      const marks: Partial<Record<number, BarMark>> = {};
      for (let k = 0; k < i; k++) marks[k] = "active";
      marks[i] = "compare";
      t.step("count", `Count A[${i}]=${item.value}: the counter for ${item.value} is now ${count[item.value]}.`, marks, { x: item.value, [`count[${item.value}]`]: count[item.value] });
    });

    let total = 0;
    for (let v = 0; v <= hi; v++) {
      const c = count[v];
      if (c === 0) continue;
      count[v] = total;
      const marks: Partial<Record<number, BarMark>> = {};
      t.items.forEach((item, k) => {
        if (item.value === v) marks[k] = "active";
      });
      t.step("prefix", `${total} ${total === 1 ? "value is" : "values are"} smaller than ${v}, so its ${c === 1 ? "bar starts" : `${c} bars start`} at index ${total}.`, marks, { v, start: total });
      total += c;
    }

    for (const item of src) {
      const p = count[item.value]++;
      placeAt(t, item, p);
      t.markSorted(p);
      t.step("place", `Write ${item.value} at index ${p}, its final place.`, { [p]: "swap" }, { x: item.value, index: p });
    }
    t.step("place", "Every value is written to its place, so the array is sorted.");
    return t.frames;
  },
};
