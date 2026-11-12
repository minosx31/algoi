import { GridTracer } from "../../core/trace";
import type { GridAlgorithm } from "../../core/types";

type Input = { weights: number[]; values: number[]; cap: number };

const ITEMS = 4;
const roll = (max: number) => 1 + Math.floor(Math.random() * max);

export const knapsack: GridAlgorithm<Input> = {
  id: "knapsack",
  name: "0/1 Knapsack",
  kind: "grid",
  topic: "dp",
  size: { label: "Capacity", min: 4, max: 15, initial: 8 },
  legend: [
    ["current", "Cell being filled"],
    ["read", "Skip it, or take it"],
    ["pending", "Not filled yet"],
    ["result", "Answer"],
  ],
  about: {
    summary:
      "Fills a table of best values, one item per row and one capacity per column, where each cell either skips its item or takes it and adds its value to the best fill of the room that is left.",
    invariants: [
      "dp[i][c] is the most value the first i items can give within capacity c, using each item at most once.",
      "Skipping item i copies dp[i − 1][c]; taking it reads dp[i − 1][c − w], from the row above so the item is never used twice.",
      "Row 0 is all zeros because no items give no value.",
    ],
    useCases: [
      "Choosing which tasks, ads, or shipments fit a fixed budget of time, money, or space.",
      "Capital budgeting and portfolio selection with indivisible options.",
      "The template for subset-sum and partition problems.",
    ],
  },
  complexity: { best: "O(n·W)", average: "O(n·W)", worst: "O(n·W)", space: "O(n·W)" },
  code: {
    pseudo: `
procedure Knapsack(weights, values, cap)
  n ← length(weights)
  dp ← an (n + 1) × (cap + 1) table of zeros           @@init
  for i ← 1 to n do
    (w, v) ← (weights[i], values[i])                   @@item
    for c ← 0 to cap do
      dp[i][c] ← dp[i − 1][c]                          @@skip
      if w ≤ c then                                    @@take
        dp[i][c] ← max(dp[i][c], dp[i − 1][c − w] + v) @@take
  return dp[n][cap]                                    @@done
`,
    python: `
def knapsack(weights, values, cap):
    n = len(weights)
    dp = [[0] * (cap + 1) for _ in range(n + 1)]       @@init
    for i in range(1, n + 1):
        w, v = weights[i - 1], values[i - 1]            @@item
        for c in range(cap + 1):
            dp[i][c] = dp[i - 1][c]                     @@skip
            if w <= c:                                  @@take
                dp[i][c] = max(dp[i][c], dp[i - 1][c - w] + v)  @@take
    return dp[n][cap]                                   @@done
`,
    cpp: `
int knapsack(const std::vector<int>& weights, const std::vector<int>& values, int cap) {
    int n = weights.size();
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(cap + 1, 0));  @@init
    for (int i = 1; i <= n; i++) {
        int w = weights[i - 1], v = values[i - 1];      @@item
        for (int c = 0; c <= cap; c++) {
            dp[i][c] = dp[i - 1][c];                    @@skip
            if (w <= c) {                               @@take
                dp[i][c] = std::max(dp[i][c], dp[i - 1][c - w] + v);  @@take
            }
        }
    }
    return dp[n][cap];                                  @@done
}
`,
    java: `
static int knapsack(int[] weights, int[] values, int cap) {
    int n = weights.length;
    int[][] dp = new int[n + 1][cap + 1];               @@init
    for (int i = 1; i <= n; i++) {
        int w = weights[i - 1], v = values[i - 1];      @@item
        for (int c = 0; c <= cap; c++) {
            dp[i][c] = dp[i - 1][c];                    @@skip
            if (w <= c) {                               @@take
                dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w] + v);  @@take
            }
        }
    }
    return dp[n][cap];                                  @@done
}
`,
    javascript: `
function knapsack(weights, values, cap) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(cap + 1).fill(0));  @@init
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1], v = values[i - 1];        @@item
    for (let c = 0; c <= cap; c++) {
      dp[i][c] = dp[i - 1][c];                          @@skip
      if (w <= c) {                                     @@take
        dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w] + v);  @@take
      }
    }
  }
  return dp[n][cap];                                    @@done
}
`,
  },
  makeInput: (cap) => ({
    weights: Array.from({ length: ITEMS }, () => roll(6)),
    values: Array.from({ length: ITEMS }, () => roll(9)),
    cap,
  }),
  run({ weights, values, cap }) {
    const n = weights.length;
    const t = new GridTracer(n + 1, cap + 1, {
      rowHeaders: ["none", ...weights.map((w, i) => `${w}kg $${values[i]}`)],
      colHeaders: Array.from({ length: cap + 1 }, (_, c) => String(c)),
    });
    const dp = Array.from({ length: n + 1 }, () => new Array<number>(cap + 1).fill(0));
    for (let c = 0; c <= cap; c++) t.set(0, c, 0);
    t.step("init", `Rows are items, columns are capacities 0 to ${cap}kg. Row 0 uses no items, so every capacity is worth $0.`);

    for (let i = 1; i <= n; i++) {
      const w = weights[i - 1];
      const v = values[i - 1];
      t.step("item", `Item ${i} weighs ${w}kg and is worth $${v}. Fill row ${i}, one capacity at a time.`, { vars: { i, w, v } });
      for (let c = 0; c <= cap; c++) {
        const skip = dp[i - 1][c];
        const vars = { i, c, w, v };
        if (w > c) {
          dp[i][c] = skip;
          t.set(i, c, skip);
          t.step("skip", `Capacity ${c}kg: the ${w}kg item does not fit, so copy $${skip} from the row above.`, {
            current: [i, c],
            reads: [[i - 1, c]],
            vars,
          });
          continue;
        }
        const take = dp[i - 1][c - w] + v;
        dp[i][c] = Math.max(skip, take);
        t.set(i, c, dp[i][c]);
        t.step("take", `Capacity ${c}kg: skip it for $${skip}, or take it for $${dp[i - 1][c - w]} + $${v} = $${take}. Keep $${dp[i][c]}.`, {
          current: [i, c],
          reads: [[i - 1, c], [i - 1, c - w]],
          vars,
        });
      }
    }

    const chosen: number[] = [];
    for (let i = n, c = cap; i > 0; i--) {
      if (dp[i][c] !== dp[i - 1][c]) {
        chosen.unshift(i);
        c -= weights[i - 1];
      }
    }
    t.answer = String(dp[n][cap]);
    t.mark(n, cap, "result");
    const pack = chosen.length ? `, by packing item${chosen.length === 1 ? "" : "s"} ${chosen.join(", ")}` : "";
    t.step("done", `The best value within ${cap}kg is $${dp[n][cap]}${pack}.`);
    return t.frames;
  },
  solve({ weights, values, cap }) {
    let best = 0;
    for (let set = 0; set < 1 << weights.length; set++) {
      let w = 0;
      let v = 0;
      weights.forEach((wi, i) => {
        if (set & (1 << i)) {
          w += wi;
          v += values[i];
        }
      });
      if (w <= cap) best = Math.max(best, v);
    }
    return String(best);
  },
};
