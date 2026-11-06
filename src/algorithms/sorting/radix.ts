import { ArrayTracer } from "../../core/trace";
import type { BarMark, SortingAlgorithm } from "../../core/types";
import { placeAt } from "./place";

const DIGIT_NAMES = ["ones", "tens", "hundreds", "thousands"];

export const radixSort: SortingAlgorithm = {
  id: "radix-sort",
  name: "Radix Sort",
  kind: "sorting",
  topic: "sorting",
  about: {
    summary: "Sorts non-negative integers one decimal digit at a time, from the ones digit up, using a stable counting pass on each digit. Here d is the number of digits in the largest value.",
    invariants: [
      "After pass p, the array is sorted by its lowest p digits.",
      "Each pass is stable, so values with equal digit p keep the order the earlier passes gave them.",
      "The number of passes is d, the digit count of the largest value.",
    ],
    useCases: [
      "Sorting fixed-width keys such as IDs, phone numbers, and IPv4 addresses.",
      "Large arrays of integers where d passes beat n log n comparisons.",
      "Sorting by several fields: run one stable pass per field, from the least significant field up.",
    ],
  },
  complexity: { best: "O(d · (n + 10))", average: "O(d · (n + 10))", worst: "O(d · (n + 10))", space: "O(n + 10)" },
  code: {
    pseudo: `
procedure radixSort(A)
  if A is empty then return                     @@base
  hi ← max(A)
  exp ← 1
  while ⌊hi / exp⌋ > 0 do                       @@pass
    count ← array of 10 zeros
    for each x in A do
      count[⌊x / exp⌋ mod 10] += 1              @@count
    total ← 0
    for d ← 0 to 9 do
      c ← count[d]
      count[d] ← total                          @@prefix
      total ← total + c
    src ← copy of A                             @@copy
    for each x in src, in order do
      d ← ⌊x / exp⌋ mod 10
      A[count[d]] ← x                           @@place
      count[d] ← count[d] + 1
    exp ← exp × 10                              @@next
`,
    python: `
def radix_sort(a):
    if not a:                                   @@base
        return
    hi = max(a)
    exp = 1
    while hi // exp > 0:                        @@pass
        count = [0] * 10
        for x in a:
            count[x // exp % 10] += 1           @@count
        total = 0
        for d in range(10):
            count[d], total = total, total + count[d]   @@prefix
        src = a[:]                              @@copy
        for x in src:
            d = x // exp % 10
            a[count[d]] = x                     @@place
            count[d] += 1
        exp *= 10                               @@next
`,
    cpp: `
void radixSort(std::vector<int>& a) {
    if (a.empty()) return;                      @@base
    int hi = *std::max_element(a.begin(), a.end());
    long exp = 1;
    while (hi / exp > 0) {                      @@pass
        int count[10] = {0};
        for (int x : a) count[x / exp % 10]++;  @@count
        int total = 0;
        for (int d = 0; d < 10; d++) {
            int c = count[d];
            count[d] = total;                   @@prefix
            total += c;
        }
        std::vector<int> src = a;               @@copy
        for (int x : src) a[count[x / exp % 10]++] = x;     @@place
        exp *= 10;                              @@next
    }
}
`,
    java: `
static void radixSort(int[] a) {
    if (a.length == 0) return;                  @@base
    int hi = Arrays.stream(a).max().getAsInt();
    long exp = 1;
    while (hi / exp > 0) {                      @@pass
        int[] count = new int[10];
        for (int x : a) count[(int) (x / exp % 10)]++;      @@count
        int total = 0;
        for (int d = 0; d < 10; d++) {
            int c = count[d];
            count[d] = total;                   @@prefix
            total += c;
        }
        int[] src = a.clone();                  @@copy
        for (int x : src) a[count[(int) (x / exp % 10)]++] = x;     @@place
        exp *= 10;                              @@next
    }
}
`,
    javascript: `
function radixSort(a) {
  if (a.length === 0) return;                   @@base
  const hi = Math.max(...a);
  let exp = 1;
  while (Math.floor(hi / exp) > 0) {            @@pass
    const count = new Array(10).fill(0);
    for (const x of a) count[Math.floor(x / exp) % 10]++;   @@count
    let total = 0;
    for (let d = 0; d < 10; d++) {
      const c = count[d];
      count[d] = total;                         @@prefix
      total += c;
    }
    const src = [...a];                         @@copy
    for (const x of src) a[count[Math.floor(x / exp) % 10]++] = x;   @@place
    exp *= 10;                                  @@next
  }
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

    const hi = Math.max(...values);
    if (hi === 0) {
      t.markSorted(...values.keys());
      t.step("pass", "The largest value is 0, so there is no digit to sort by and the array is already sorted.");
      return t.frames;
    }
    let exp = 1;
    let pos = 1;
    while (Math.floor(hi / exp) > 0) {
      const last = Math.floor(hi / (exp * 10)) === 0;
      const digit = (v: number) => Math.floor(v / exp) % 10;
      const where = `digit position ${pos}, the ${DIGIT_NAMES[pos - 1] ?? `10^${pos - 1}s`} digit`;
      const count = new Array<number>(10).fill(0);
      t.step("pass", `Pass ${pos}: sort by ${where}.`, {}, { pass: pos, exp });

      const src = t.items.slice();
      src.forEach((item, i) => {
        const d = digit(item.value);
        count[d]++;
        const marks: Partial<Record<number, BarMark>> = {};
        for (let k = 0; k < i; k++) marks[k] = "active";
        marks[i] = "compare";
        t.step("count", `A[${i}]=${item.value} has digit ${d} at position ${pos}, so the counter for ${d} is now ${count[d]}.`, marks, { x: item.value, digit: d, [`count[${d}]`]: count[d] });
      });

      let total = 0;
      for (let d = 0; d < 10; d++) {
        const c = count[d];
        if (c === 0) continue;
        count[d] = total;
        const marks: Partial<Record<number, BarMark>> = {};
        t.items.forEach((item, k) => {
          if (digit(item.value) === d) marks[k] = "active";
        });
        t.step("prefix", `${total} ${total === 1 ? "value has" : "values have"} a smaller digit than ${d}, so the ${c} ${c === 1 ? "bar" : "bars"} with digit ${d} start at index ${total}.`, marks, { digit: d, start: total });
        total += c;
      }

      t.step("copy", `Pass ${pos}: copy A into src, then read values from src and write them into A, so no bar is swapped.`, {}, { pass: pos });

      const placed: Partial<Record<number, BarMark>> = {};
      for (const item of src) {
        const d = digit(item.value);
        const p = count[d]++;
        const { marks, aside } = placeAt(t, item, p);
        if (last) t.markSorted(p);
        else placed[p] = "active";
        const note = last ? `Write ${item.value} at index ${p}, its final place${aside}.` : `Write ${item.value} at index ${p}, the next free spot for digit ${d}${aside}.`;
        t.step("place", note, { ...placed, ...marks, [p]: "swap" }, { x: item.value, digit: d, index: p });
      }

      exp *= 10;
      const note = last
        ? `Pass ${pos} is done and no value has a digit at position ${pos + 1}, so the array is sorted.`
        : `Pass ${pos} is done: the bars are now ordered by ${where}.`;
      t.step("next", note, {}, { pass: pos });
      pos++;
    }
    return t.frames;
  },
};
