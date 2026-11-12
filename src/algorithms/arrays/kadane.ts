import { ScanTracer } from "../../core/trace";
import { randomArray } from "../../core/inputs";
import type { ScanAlgorithm, ScanFrame } from "../../core/types";

export const kadane: ScanAlgorithm = {
  id: "kadane",
  name: "Kadane's Maximum Subarray",
  kind: "scan",
  topic: "arrays",
  pointers: ["i"],
  legend: [
    ["compare", "Current value"],
    ["band", "Current run"],
    ["found", "Best run so far"],
  ],
  labelTitle: "cur: best sum ending at each index",
  about: {
    summary: "Finds the largest sum of a contiguous subarray in one pass by keeping the best sum that ends at the current index, and dropping a running sum that is zero or negative because it can only lower what follows.",
    invariants: [
      "cur is the largest sum of a subarray that ends at index i.",
      "best is the largest sum of any subarray inside A[0..i].",
    ],
    useCases: [
      "The best stretch of a profit-and-loss or gain series.",
      "Maximum-sum rectangle in a matrix, by running Kadane over column sums.",
      "The pattern behind many sequence DP problems: the state is the best answer that ends here.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
  code: {
    pseudo: `
procedure maxSubarray(A)
  cur ← A[0]; best ← A[0]                     @@init
  for i ← 1 to length(A) − 1 do
    if cur > 0 then                            @@extend
      cur ← cur + A[i]                         @@extend
    else                                       @@restart
      cur ← A[i]                               @@restart
    if cur > best then                         @@best
      best ← cur                               @@best
  return best                                  @@done
`,
    python: `
def max_subarray(a):
    cur = best = a[0]                       @@init
    for i in range(1, len(a)):
        if cur > 0:                         @@extend
            cur += a[i]                     @@extend
        else:                               @@restart
            cur = a[i]                      @@restart
        if cur > best:                      @@best
            best = cur                      @@best
    return best                             @@done
`,
    cpp: `
int maxSubarray(const std::vector<int>& a) {
    int cur = a[0], best = a[0];            @@init
    for (size_t i = 1; i < a.size(); i++) {
        if (cur > 0) {                      @@extend
            cur += a[i];                    @@extend
        } else {                            @@restart
            cur = a[i];                     @@restart
        }
        if (cur > best) {                   @@best
            best = cur;                     @@best
        }
    }
    return best;                            @@done
}
`,
    java: `
static int maxSubarray(int[] a) {
    int cur = a[0], best = a[0];            @@init
    for (int i = 1; i < a.length; i++) {
        if (cur > 0) {                      @@extend
            cur += a[i];                    @@extend
        } else {                            @@restart
            cur = a[i];                     @@restart
        }
        if (cur > best) {                   @@best
            best = cur;                     @@best
        }
    }
    return best;                            @@done
}
`,
    javascript: `
function maxSubarray(a) {
  let cur = a[0], best = a[0];              @@init
  for (let i = 1; i < a.length; i++) {
    if (cur > 0) {                          @@extend
      cur += a[i];                          @@extend
    } else {                                @@restart
      cur = a[i];                           @@restart
    }
    if (cur > best) {                       @@best
      best = cur;                           @@best
    }
  }
  return best;                              @@done
}
`,
  },
  makeInput: (size) => ({ values: randomArray(size).map((v) => v - 52) }),
  solve({ values }) {
    let best = -Infinity;
    for (let i = 0; i < values.length; i++) {
      let sum = 0;
      for (let j = i; j < values.length; j++) best = Math.max(best, (sum += values[j]));
    }
    return best;
  },
  run({ values }) {
    const t = new ScanTracer(values);
    let cur = values[0];
    let best = cur;
    let start = 0;
    let from = 0;
    let to = 0;
    t.labels[0] = String(cur);
    const bestRun = () => {
      const marks: ScanFrame["marks"] = {};
      for (let k = from; k <= to; k++) marks[k] = "found";
      return marks;
    };
    const view = (i: number, marks: ScanFrame["marks"] = {}) => ({
      marks: { ...bestRun(), ...marks },
      pointers: { i },
      bands: [{ from: start, to: i }],
      vars: { i, cur, best },
    });

    t.step("init", `Start with cur = best = A[0] = ${cur}.`, view(0));
    for (let i = 1; i < values.length; i++) {
      const prev = cur;
      if (cur > 0) {
        cur += values[i];
        t.labels[i] = String(cur);
        t.step("extend", `cur = ${prev} is positive, so extend the run: cur = ${prev} + (${values[i]}) = ${cur}.`, view(i, { [i]: "compare" }));
      } else {
        cur = values[i];
        start = i;
        t.labels[i] = String(cur);
        const why = prev === 0 ? `cur = 0 adds nothing to the next value` : `cur = ${prev} would only lower the sum`;
        t.step("restart", `${why}, so start a new run at A[${i}]: cur = ${cur}.`, view(i, { [i]: "compare" }));
      }
      if (cur > best) {
        best = cur;
        from = start;
        to = i;
        t.step("best", `cur = ${cur} beats the best so far, so best = ${cur}, the sum of A[${from}..${to}].`, view(i));
      }
    }
    t.answer = best;
    t.step("done", `Return best = ${best}, the sum of A[${from}..${to}].`, { marks: bestRun(), vars: { cur, best } });
    return t.frames;
  },
};
