import { GridTracer } from "../../core/trace";
import type { GridAlgorithm } from "../../core/types";

type Input = { a: string; b: string };

const strand = (n: number) => Array.from({ length: n }, () => "ACGT"[Math.floor(Math.random() * 4)]).join("");

export const lcs: GridAlgorithm<Input> = {
  id: "lcs",
  name: "Longest Common Subsequence",
  kind: "grid",
  topic: "dp",
  size: { label: "Length", min: 3, max: 8, initial: 6 },
  legend: [
    ["current", "Cell being filled"],
    ["read", "Cells it reads"],
    ["pending", "Not filled yet"],
    ["result", "Answer"],
  ],
  about: {
    summary:
      "Fills a table where each cell holds the length of the longest subsequence two prefixes share, extending the diagonal on a match and keeping the better neighbour otherwise.",
    invariants: [
      "dp[i][j] is the LCS length of the first i letters of a and the first j letters of b.",
      "On a match the last letters pair up, so dp[i][j] = dp[i − 1][j − 1] + 1.",
      "On a mismatch one of the two last letters is unused, so dp[i][j] = max(dp[i − 1][j], dp[i][j − 1]).",
    ],
    useCases: [
      "Diff tools and version control, which show the lines two files keep in common.",
      "DNA and protein comparison.",
      "Merge tools and plagiarism checks that align two texts.",
    ],
  },
  complexity: { best: "O(m·n)", average: "O(m·n)", worst: "O(m·n)", space: "O(m·n)" },
  code: {
    pseudo: `
procedure LCS(a, b)
  m ← length(a); n ← length(b)
  dp ← an (m + 1) × (n + 1) table of zeros            @@init
  for i ← 1 to m do
    for j ← 1 to n do
      if a[i] = b[j] then                             @@match
        dp[i][j] ← dp[i − 1][j − 1] + 1               @@match
      else                                            @@skip
        dp[i][j] ← max(dp[i − 1][j], dp[i][j − 1])    @@skip
  return dp[m][n]                                     @@done
`,
    python: `
def lcs(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]          @@init
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:                    @@match
                dp[i][j] = dp[i - 1][j - 1] + 1         @@match
            else:                                       @@skip
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  @@skip
    return dp[m][n]                                     @@done
`,
    cpp: `
int lcs(const std::string& a, const std::string& b) {
    int m = a.size(), n = b.size();
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1, 0));  @@init
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a[i - 1] == b[j - 1]) {                         @@match
                dp[i][j] = dp[i - 1][j - 1] + 1;                @@match
            } else {                                            @@skip
                dp[i][j] = std::max(dp[i - 1][j], dp[i][j - 1]);  @@skip
            }
        }
    }
    return dp[m][n];                                            @@done
}
`,
    java: `
static int lcs(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];                         @@init
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {           @@match
                dp[i][j] = dp[i - 1][j - 1] + 1;                @@match
            } else {                                            @@skip
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);  @@skip
            }
        }
    }
    return dp[m][n];                                            @@done
}
`,
    javascript: `
function lcs(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));  @@init
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {                              @@match
        dp[i][j] = dp[i - 1][j - 1] + 1;                        @@match
      } else {                                                  @@skip
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);        @@skip
      }
    }
  }
  return dp[m][n];                                              @@done
}
`,
  },
  makeInput: (size) => ({ a: strand(size), b: strand(size) }),
  run({ a, b }) {
    const m = a.length;
    const n = b.length;
    const t = new GridTracer(m + 1, n + 1, { rowHeaders: ["", ...a], colHeaders: ["", ...b] });
    const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
    for (let i = 0; i <= m; i++) t.set(i, 0, 0);
    for (let j = 0; j <= n; j++) t.set(0, j, 0);
    t.step("init", `Make a ${m + 1} × ${n + 1} table of zeros. Row 0 and column 0 stay 0: an empty prefix shares nothing.`);

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const x = a[i - 1];
        const y = b[j - 1];
        const vars = { i, j };
        if (x === y) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          t.set(i, j, dp[i][j]);
          t.step("match", `dp[${i}][${j}]: '${x}' = '${y}', so extend the diagonal: ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}.`, {
            current: [i, j],
            reads: [[i - 1, j - 1]],
            vars,
          });
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          t.set(i, j, dp[i][j]);
          t.step("skip", `dp[${i}][${j}]: '${x}' ≠ '${y}', so keep the better neighbour: max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}.`, {
            current: [i, j],
            reads: [[i - 1, j], [i, j - 1]],
            vars,
          });
        }
      }
    }

    let common = "";
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        common = a[i - 1] + common;
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
      else j--;
    }
    t.answer = String(dp[m][n]);
    t.mark(m, n, "result");
    const example = common ? `, for example "${common}"` : "";
    t.step("done", `"${a}" and "${b}" share a subsequence of length ${dp[m][n]}${example}.`);
    return t.frames;
  },
  solve({ a, b }) {
    const memo = new Map<number, number>();
    const go = (i: number, j: number): number => {
      if (i === a.length || j === b.length) return 0;
      const key = i * (b.length + 1) + j;
      if (!memo.has(key)) memo.set(key, a[i] === b[j] ? 1 + go(i + 1, j + 1) : Math.max(go(i + 1, j), go(i, j + 1)));
      return memo.get(key)!;
    };
    return String(go(0, 0));
  },
};
