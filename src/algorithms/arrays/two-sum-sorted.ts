import { ScanTracer } from "../../core/trace";
import type { ScanAlgorithm, ScanInput, ScanMark, Vars } from "../../core/types";

function firstPair({ values, target }: ScanInput) {
  for (let i = 0; i < values.length; i++)
    for (let j = values.length - 1; j > i; j--) if (values[i] + values[j] === target) return [i, j];
  return [-1, -1];
}

export const twoSumSorted: ScanAlgorithm = {
  id: "two-sum-sorted",
  name: "Two Sum (Sorted)",
  kind: "scan",
  topic: "arrays",
  pointers: ["i", "j"],
  about: {
    summary: "Finds two values in a sorted array that add up to a target by starting a pointer at each end and moving the one whose value cannot be part of any remaining pair.",
    invariants: [
      "No pair with an index outside i..j sums to the target.",
      "Moving i right drops only pairs whose sum is too small; moving j left drops only pairs whose sum is too large.",
    ],
    useCases: [
      "Pair sums and differences on sorted data, and the inner loop of 3Sum after sorting.",
      "Matching items from two ends of a sorted list, such as pairing the lightest and heaviest people per boat.",
      "Shrink-from-both-ends problems such as container with most water.",
    ],
  },
  complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)" },
  code: {
    pseudo: `
procedure twoSumSorted(A, target)
  i ← 0; j ← length(A) − 1                   @@init
  while i < j do
    s ← A[i] + A[j]                           @@sum
    if s = target then                        @@found
      return (i, j)                           @@found
    else if s < target then                   @@inc
      i ← i + 1                               @@inc
    else                                      @@dec
      j ← j − 1                               @@dec
  return (−1, −1)                             @@none
`,
    python: `
def two_sum_sorted(a, target):
    i, j = 0, len(a) - 1                    @@init
    while i < j:
        s = a[i] + a[j]                     @@sum
        if s == target:                     @@found
            return i, j                     @@found
        elif s < target:                    @@inc
            i += 1                          @@inc
        else:                               @@dec
            j -= 1                          @@dec
    return -1, -1                           @@none
`,
    cpp: `
std::pair<int, int> twoSumSorted(const std::vector<int>& a, int target) {
    int i = 0, j = (int)a.size() - 1;       @@init
    while (i < j) {
        int s = a[i] + a[j];                @@sum
        if (s == target) {                  @@found
            return {i, j};                  @@found
        } else if (s < target) {            @@inc
            i++;                            @@inc
        } else {                            @@dec
            j--;                            @@dec
        }
    }
    return {-1, -1};                        @@none
}
`,
    java: `
static int[] twoSumSorted(int[] a, int target) {
    int i = 0, j = a.length - 1;            @@init
    while (i < j) {
        int s = a[i] + a[j];                @@sum
        if (s == target) {                  @@found
            return new int[] {i, j};        @@found
        } else if (s < target) {            @@inc
            i++;                            @@inc
        } else {                            @@dec
            j--;                            @@dec
        }
    }
    return new int[] {-1, -1};              @@none
}
`,
    javascript: `
function twoSumSorted(a, target) {
  let i = 0, j = a.length - 1;              @@init
  while (i < j) {
    const s = a[i] + a[j];                  @@sum
    if (s === target) {                     @@found
      return [i, j];                        @@found
    } else if (s < target) {                @@inc
      i++;                                  @@inc
    } else {                                @@dec
      j--;                                  @@dec
    }
  }
  return [-1, -1];                          @@none
}
`,
  },
  makeInput(size) {
    const values = Array.from({ length: 99 }, (_, i) => i + 1)
      .sort(() => Math.random() - 0.5)
      .slice(0, size)
      .sort((a, b) => a - b);
    const sums = new Set(values.flatMap((a, i) => values.slice(i + 1).map((b) => a + b)));
    const low = values[0] + values[1];
    const missing = Array.from({ length: values[size - 1] + values[size - 2] - low }, (_, k) => low + k).filter((s) => !sums.has(s));
    if (missing.length && Math.random() < 0.12) return { values, target: missing[Math.floor(Math.random() * missing.length)] };
    // A pair found within a few moves ends the trace before the pointers have done anything.
    const half = size >> 1;
    for (let tries = 0; ; tries++) {
      const i = Math.floor(Math.random() * half);
      const j = half + Math.floor(Math.random() * (size - half));
      const input = { values, target: values[i] + values[j] };
      const [p, q] = firstPair(input);
      if (p + size - 1 - q >= Math.min(4, size - 2) || tries > 50) return input;
    }
  },
  solve: firstPair,
  run({ values, target }) {
    const t = new ScanTracer(values);
    const want = target!;
    let i = 0;
    let j = values.length - 1;
    const at = (mark: ScanMark, vars: Vars = {}) => ({
      marks: t.range(i, j, { [i]: mark, [j]: mark }),
      pointers: { i, j },
      vars: { target: want, i, j, ...vars },
    });

    t.step("init", `Put i on the smallest value and j on the largest, and look for a pair that sums to ${want}.`, at("compare"));
    while (i < j) {
      const s = values[i] + values[j];
      t.step("sum", `A[${i}] + A[${j}] = ${values[i]} + ${values[j]} = ${s}.`, at("compare", { s }));
      if (s === want) {
        t.answer = [i, j];
        t.step("found", `${s} is the target. Return [${i}, ${j}].`, at("found", { s }));
        return t.frames;
      }
      if (s < want) {
        i++;
        t.step("inc", `${s} < ${want}, and A[${i - 1}] = ${values[i - 1]} is too small even with the largest value left, so move i right to ${i}.`, at("compare"));
      } else {
        j--;
        t.step("dec", `${s} > ${want}, and A[${j + 1}] = ${values[j + 1]} is too large even with the smallest value left, so move j left to ${j}.`, at("compare"));
      }
    }
    t.answer = [-1, -1];
    t.step("none", `i met j without a match, so no pair sums to ${want}. Return [-1, -1].`, { ...at("muted"), marks: t.range(0, -1) });
    return t.frames;
  },
};
