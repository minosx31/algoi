import { ScanTracer } from "../../core/trace";
import { randomArray } from "../../core/inputs";
import type { ScanAlgorithm, ScanFrame } from "../../core/types";

export const minWindowSum: ScanAlgorithm = {
  id: "min-window-sum",
  name: "Minimum Size Subarray Sum",
  kind: "scan",
  topic: "arrays",
  pointers: ["left", "right"],
  legend: [
    ["active", "In the window"],
    ["compare", "Value just added"],
    ["band", "Window"],
    ["found", "Shortest window"],
  ],
  about: {
    summary: "Finds the shortest run of consecutive positive values whose sum reaches a target by growing a window on the right and shrinking it from the left as long as the sum still reaches the target.",
    invariants: [
      "The window A[left..right] always has sum equal to the running total.",
      "After the shrinking loop, dropping the left value would put the sum below the target, or the window is empty.",
      "Both ends only move right, so each value enters and leaves the window once and the scan is O(n).",
    ],
    useCases: [
      "The shortest span of requests or days whose total reaches a quota.",
      "The variable-size sliding window template: grow to satisfy a condition, shrink while it still holds.",
      "Any positive-valued sum constraint; negative values break the shrink step and need prefix sums instead.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
  code: {
    pseudo: `
procedure minWindowSum(A, target)
  left ← 0; sum ← 0; best ← ∞                   @@init
  for right ← 0 to length(A) − 1 do
    sum ← sum + A[right]                        @@grow
    while sum ≥ target do                       @@record
      best ← min(best, right − left + 1)        @@record
      sum ← sum − A[left]                       @@shrink
      left ← left + 1                           @@shrink
  if best = ∞ then return 0                     @@done
  return best                                   @@done
`,
    python: `
def min_window_sum(a, target):
    left = total = 0                            @@init
    best = len(a) + 1                           @@init
    for right in range(len(a)):
        total += a[right]                       @@grow
        while total >= target:                  @@record
            best = min(best, right - left + 1)  @@record
            total -= a[left]                    @@shrink
            left += 1                           @@shrink
    return best if best <= len(a) else 0        @@done
`,
    cpp: `
int minWindowSum(const std::vector<int>& a, int target) {
    int n = (int)a.size(), left = 0, total = 0;     @@init
    int best = n + 1;                               @@init
    for (int right = 0; right < n; right++) {
        total += a[right];                          @@grow
        while (total >= target) {                   @@record
            best = std::min(best, right - left + 1);  @@record
            total -= a[left];                       @@shrink
            left++;                                 @@shrink
        }
    }
    return best <= n ? best : 0;                    @@done
}
`,
    java: `
static int minWindowSum(int[] a, int target) {
    int n = a.length, left = 0, total = 0;          @@init
    int best = n + 1;                               @@init
    for (int right = 0; right < n; right++) {
        total += a[right];                          @@grow
        while (total >= target) {                   @@record
            best = Math.min(best, right - left + 1);  @@record
            total -= a[left];                       @@shrink
            left++;                                 @@shrink
        }
    }
    return best <= n ? best : 0;                    @@done
}
`,
    javascript: `
function minWindowSum(a, target) {
  let left = 0, total = 0;                          @@init
  let best = a.length + 1;                          @@init
  for (let right = 0; right < a.length; right++) {
    total += a[right];                              @@grow
    while (total >= target) {                       @@record
      best = Math.min(best, right - left + 1);      @@record
      total -= a[left];                             @@shrink
      left++;                                       @@shrink
    }
  }
  return best <= a.length ? best : 0;               @@done
}
`,
  },
  makeInput(size) {
    const values = randomArray(size);
    // A target taken from a short run makes the window shrink; a random one is often out of reach.
    const len = 2 + Math.floor(Math.random() * Math.min(4, size - 1));
    const start = Math.floor(Math.random() * (size - len + 1));
    return { values, target: values.slice(start, start + len).reduce((a, b) => a + b, 0) };
  },
  solve({ values, target }) {
    let best = 0;
    for (let i = 0; i < values.length; i++) {
      let sum = 0;
      for (let j = i; j < values.length; j++) {
        sum += values[j];
        if (sum >= target! && (best === 0 || j - i + 1 < best)) best = j - i + 1;
      }
    }
    return best;
  },
  run({ values, target }) {
    const t = new ScanTracer(values);
    const goal = target!;
    const n = values.length;
    let left = 0;
    let sum = 0;
    let best = 0;
    let bestFrom = 0;

    const window = (right: number, marks: ScanFrame["marks"] = {}) => {
      const all: ScanFrame["marks"] = {};
      for (let k = left; k <= right; k++) all[k] = "active";
      return {
        marks: { ...all, ...marks },
        pointers: left < n ? { left, right } : { right },
        bands: left <= right ? [{ from: left, to: right }] : [],
        vars: { left, right, sum, target: goal, best },
      };
    };

    t.step("init", `Find the shortest run of values with a sum of at least ${goal}. Every value is positive, so a longer window never has a smaller sum.`, { vars: { target: goal } });
    for (let right = 0; right < n; right++) {
      sum += values[right];
      t.step(
        "grow",
        sum >= goal ? `Add A[${right}] = ${values[right]}, so the sum is ${sum}, which reaches ${goal}.` : `Add A[${right}] = ${values[right]}, so the sum is ${sum}, still under ${goal}. Keep growing.`,
        window(right, { [right]: "compare" }),
      );
      while (sum >= goal) {
        const size = right - left + 1;
        if (best === 0 || size < best) {
          best = size;
          bestFrom = left;
        }
        t.step("record", `The window A[${left}..${right}] has ${size} values and sum ${sum} ≥ ${goal}. The shortest so far is ${best}.`, window(right));
        sum -= values[left];
        left++;
        t.step("shrink", left > right ? `Drop A[${left - 1}] = ${values[left - 1]}. The window is empty and the sum is ${sum}.` : `Drop A[${left - 1}] = ${values[left - 1]}, so the sum falls to ${sum}${sum >= goal ? ", which still reaches " + goal : ", under " + goal}.`, window(right));
      }
    }
    const marks: ScanFrame["marks"] = {};
    for (let k = bestFrom; best && k < bestFrom + best; k++) marks[k] = "found";
    t.answer = best;
    t.step(
      "done",
      best ? `The shortest window with sum ≥ ${goal} has ${best} values, A[${bestFrom}..${bestFrom + best - 1}].` : `No window reaches ${goal}. Return 0.`,
      { marks, bands: best ? [{ from: bestFrom, to: bestFrom + best - 1 }] : [], vars: { target: goal, best } },
    );
    return t.frames;
  },
};
