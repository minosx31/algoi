import { GridTracer } from "../../core/trace";
import type { GridAlgorithm } from "../../core/types";

type Input = { coins: number[]; amount: number };

function pickCoins() {
  const coins: number[] = [];
  while (coins.length < 3) {
    const c = 1 + Math.floor(Math.random() * 8);
    if (!coins.includes(c)) coins.push(c);
  }
  return coins.sort((x, y) => x - y);
}

export const coinChange: GridAlgorithm<Input> = {
  id: "coin-change",
  name: "Coin Change",
  kind: "grid",
  topic: "dp",
  size: { label: "Amount", min: 5, max: 15, initial: 11 },
  legend: [
    ["current", "Amount being solved"],
    ["read", "Amount left after one coin"],
    ["result", "Answer"],
  ],
  about: {
    summary:
      "Solves every amount from 0 up, where the fewest coins for an amount is one coin plus the fewest coins for whatever that coin leaves.",
    invariants: [
      "dp[a] is the fewest coins that make exactly a, or ∞ when no mix of coins can.",
      "Every amount below a is final before a is solved, because a coin only ever leaves a smaller amount.",
      "Coins are reusable, so dp[a] may read any smaller amount, including one that already used the same coin.",
    ],
    useCases: [
      "Making change and splitting payments into the fewest notes or tokens.",
      "Resource bundling where each pack size can be bought any number of times.",
      "The unbounded-knapsack pattern behind many counting and minimum-cost interview problems.",
    ],
  },
  complexity: { best: "O(A·k)", average: "O(A·k)", worst: "O(A·k)", space: "O(A)" },
  code: {
    pseudo: `
procedure CoinChange(coins, amount)
  INF ← amount + 1                                   @@init
  dp ← array of amount + 1 entries, all INF          @@init
  dp[0] ← 0                                          @@init
  for a ← 1 to amount do
    for each coin c in coins do                      @@try
      if c ≤ a and dp[a − c] + 1 < dp[a] then        @@try
        dp[a] ← dp[a − c] + 1                        @@better
  if dp[amount] = INF then return −1                 @@done
  return dp[amount]                                  @@done
`,
    python: `
def coin_change(coins, amount):
    INF = amount + 1                                  @@init
    dp = [0] + [INF] * amount                         @@init
    for a in range(1, amount + 1):
        for c in coins:                               @@try
            if c <= a and dp[a - c] + 1 < dp[a]:      @@try
                dp[a] = dp[a - c] + 1                 @@better
    if dp[amount] == INF:                             @@done
        return -1                                     @@done
    return dp[amount]                                 @@done
`,
    cpp: `
int coinChange(const std::vector<int>& coins, int amount) {
    const int INF = amount + 1;                       @@init
    std::vector<int> dp(amount + 1, INF);             @@init
    dp[0] = 0;                                        @@init
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {                         @@try
            if (c <= a && dp[a - c] + 1 < dp[a]) {    @@try
                dp[a] = dp[a - c] + 1;                @@better
            }
        }
    }
    return dp[amount] < INF ? dp[amount] : -1;        @@done
}
`,
    java: `
static int coinChange(int[] coins, int amount) {
    int INF = amount + 1;                             @@init
    int[] dp = new int[amount + 1];                   @@init
    Arrays.fill(dp, INF);                             @@init
    dp[0] = 0;                                        @@init
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {                         @@try
            if (c <= a && dp[a - c] + 1 < dp[a]) {    @@try
                dp[a] = dp[a - c] + 1;                @@better
            }
        }
    }
    return dp[amount] < INF ? dp[amount] : -1;        @@done
}
`,
    javascript: `
function coinChange(coins, amount) {
  const INF = amount + 1;                             @@init
  const dp = new Array(amount + 1).fill(INF);         @@init
  dp[0] = 0;                                          @@init
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {                          @@try
      if (c <= a && dp[a - c] + 1 < dp[a]) {          @@try
        dp[a] = dp[a - c] + 1;                        @@better
      }
    }
  }
  return dp[amount] < INF ? dp[amount] : -1;          @@done
}
`,
  },
  makeInput: (amount) => ({ coins: pickCoins(), amount }),
  run({ coins, amount }) {
    const INF = amount + 1;
    const show = (v: number) => (v === INF ? "∞" : String(v));
    const t = new GridTracer(1, amount + 1, {
      rowHeaders: ["coins"],
      colHeaders: Array.from({ length: amount + 1 }, (_, a) => String(a)),
    });
    t.aux = { title: "Coins", items: coins.map(String) };
    const dp = [0, ...new Array<number>(amount).fill(INF)];
    const used = new Array<number>(amount + 1).fill(0);
    dp.forEach((v, a) => t.set(0, a, show(v)));
    t.step("init", `dp[a] is the fewest coins that make amount a. dp[0] = 0, and every other amount starts at ∞, which the code stores as ${INF}.`);

    for (let a = 1; a <= amount; a++) {
      for (const c of coins) {
        const vars = { a, c };
        if (c > a) {
          t.step("try", `Amount ${a}, coin ${c}: the coin is bigger than the amount, so skip it.`, { current: [0, a], vars });
          continue;
        }
        const rest = dp[a - c];
        const cand = rest + 1;
        if (cand < dp[a]) {
          const old = dp[a];
          dp[a] = cand;
          used[a] = c;
          t.set(0, a, cand);
          t.step("better", `Amount ${a}, coin ${c}: dp[${a - c}] + 1 = ${cand} beats ${show(old)}, so dp[${a}] = ${cand}.`, {
            current: [0, a],
            reads: [[0, a - c]],
            vars,
          });
        } else {
          const why = rest === INF ? `dp[${a - c}] is ∞, so coin ${c} cannot finish amount ${a}.` : `dp[${a - c}] + 1 = ${cand} does not beat ${dp[a]}.`;
          t.step("try", `Amount ${a}, coin ${c}: ${why}`, { current: [0, a], reads: [[0, a - c]], vars });
        }
      }
    }

    t.mark(0, amount, "result");
    if (dp[amount] === INF) {
      t.answer = "-1";
      t.step("done", `No mix of coins ${coins.join(", ")} makes ${amount}, so the answer is -1.`);
    } else {
      const parts: number[] = [];
      for (let a = amount; a > 0; a -= used[a]) parts.push(used[a]);
      t.answer = String(dp[amount]);
      t.step("done", `Amount ${amount} needs ${dp[amount]} coin${dp[amount] === 1 ? "" : "s"}: ${parts.join(" + ")}.`);
    }
    return t.frames;
  },
  solve({ coins, amount }) {
    const steps = new Map<number, number>([[0, 0]]);
    const queue = [0];
    while (queue.length) {
      const s = queue.shift()!;
      for (const c of coins) {
        if (s + c <= amount && !steps.has(s + c)) {
          steps.set(s + c, steps.get(s)! + 1);
          queue.push(s + c);
        }
      }
    }
    return String(steps.get(amount) ?? -1);
  },
};
