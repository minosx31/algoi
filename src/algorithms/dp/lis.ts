import { GridTracer } from "../../core/trace";
import type { GridAlgorithm } from "../../core/types";

export const lis: GridAlgorithm<number[]> = {
  id: "lis",
  name: "Longest Increasing Subsequence",
  kind: "grid",
  topic: "dp",
  size: { label: "Length", min: 5, max: 12, initial: 8 },
  legend: [
    ["current", "dp[i] being computed"],
    ["read", "Smaller value it can follow"],
    ["blocked", "Not smaller, so skipped"],
    ["result", "Longest"],
  ],
  about: {
    summary:
      "For each value, finds the longest strictly increasing run that can end on it by extending the best earlier run that ends on a smaller value.",
    invariants: [
      "dp[i] is the length of the longest increasing subsequence that ends exactly at a[i].",
      "dp[i] only reads dp[j] for j < i, so a left-to-right pass always has them ready.",
      "The answer is the largest dp[i], since the best subsequence can end anywhere.",
    ],
    useCases: [
      "Finding the longest steadily rising stretch in prices, metrics, or versions.",
      "Box stacking, envelope nesting, and scheduling problems that reduce to it.",
      "The O(n log n) patience-sorting version keeps the smallest tail for each length and binary-searches it, which also powers patience diff.",
    ],
  },
  complexity: { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(n)" },
  code: {
    pseudo: `
procedure LIS(a)
  n ← length(a)
  if n = 0 then return 0
  dp ← [1, 1, …, 1] of length n                     @@init
  for i ← 1 to n − 1 do
    for j ← 0 to i − 1 do                            @@compare
      if a[j] < a[i] and dp[j] + 1 > dp[i] then      @@compare
        dp[i] ← dp[j] + 1                            @@extend
  best ← the largest value in dp                     @@done
  return best                                        @@done
`,
    python: `
def lis(a):
    n = len(a)
    if n == 0:
        return 0
    dp = [1] * n                                     @@init
    for i in range(1, n):
        for j in range(i):                           @@compare
            if a[j] < a[i] and dp[j] + 1 > dp[i]:    @@compare
                dp[i] = dp[j] + 1                    @@extend
    return max(dp)                                   @@done
`,
    cpp: `
int lis(const std::vector<int>& a) {
    int n = a.size();
    if (n == 0) return 0;
    std::vector<int> dp(n, 1);                       @@init
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {                @@compare
            if (a[j] < a[i] && dp[j] + 1 > dp[i]) {  @@compare
                dp[i] = dp[j] + 1;                   @@extend
            }
        }
    }
    return *std::max_element(dp.begin(), dp.end());  @@done
}
`,
    java: `
static int lis(int[] a) {
    int n = a.length;
    if (n == 0) return 0;
    int[] dp = new int[n];                           @@init
    Arrays.fill(dp, 1);                              @@init
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {                @@compare
            if (a[j] < a[i] && dp[j] + 1 > dp[i]) {  @@compare
                dp[i] = dp[j] + 1;                   @@extend
            }
        }
    }
    return Arrays.stream(dp).max().getAsInt();       @@done
}
`,
    javascript: `
function lis(a) {
  const n = a.length;
  if (n === 0) return 0;
  const dp = new Array(n).fill(1);                   @@init
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {                    @@compare
      if (a[j] < a[i] && dp[j] + 1 > dp[i]) {        @@compare
        dp[i] = dp[j] + 1;                           @@extend
      }
    }
  }
  return Math.max(...dp);                            @@done
}
`,
  },
  makeInput: (n) => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 20)),
  run(a) {
    const n = a.length;
    const t = new GridTracer(1, n, { rowHeaders: ["dp"], colHeaders: a.map(String) });
    const dp = new Array<number>(n).fill(1);
    const prev = new Array<number>(n).fill(-1);
    dp.forEach((v, i) => t.set(0, i, v));
    t.step("init", "dp[i] is the longest increasing run that ends at a[i]. Each value alone is a run of 1.");

    for (let i = 1; i < n; i++) {
      for (let j = 0; j < i; j++) {
        const vars = { i, j };
        if (a[j] >= a[i]) {
          t.step("compare", `a[${j}] = ${a[j]} is not smaller than a[${i}] = ${a[i]}, so ${a[i]} cannot follow it.`, {
            current: [0, i],
            marks: [[[0, j], "blocked"]],
            vars,
          });
        } else if (dp[j] + 1 > dp[i]) {
          dp[i] = dp[j] + 1;
          prev[i] = j;
          t.set(0, i, dp[i]);
          t.step("extend", `${a[j]} < ${a[i]}, so ${a[i]} can follow ${a[j]}: dp[${i}] = dp[${j}] + 1 = ${dp[i]}.`, {
            current: [0, i],
            reads: [[0, j]],
            vars,
          });
        } else {
          t.step("compare", `${a[j]} < ${a[i]}, but dp[${j}] + 1 = ${dp[j] + 1} does not beat dp[${i}] = ${dp[i]}.`, {
            current: [0, i],
            reads: [[0, j]],
            vars,
          });
        }
      }
    }

    const best = n === 0 ? 0 : Math.max(...dp);
    dp.forEach((v, i) => {
      if (v === best) t.mark(0, i, "result");
    });
    const run: number[] = [];
    for (let i = dp.indexOf(best); i !== -1; i = prev[i]) run.unshift(a[i]);
    t.answer = String(best);
    t.step("done", `The longest increasing subsequence has length ${best}, for example ${run.join(", ")}.`);
    return t.frames;
  },
  solve(a) {
    const tails: number[] = [];
    for (const x of a) {
      let lo = 0;
      let hi = tails.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (tails[mid] < x) lo = mid + 1;
        else hi = mid;
      }
      tails[lo] = x;
    }
    return String(tails.length);
  },
};
