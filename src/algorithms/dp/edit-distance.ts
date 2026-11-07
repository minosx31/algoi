import { GridTracer } from "../../core/trace";
import type { GridAlgorithm } from "../../core/types";

type Input = { a: string; b: string };

const WORDS: Record<number, string[]> = {
  3: ["cat", "map", "key", "bit", "sun", "log"],
  4: ["word", "data", "code", "tree", "node", "path"],
  5: ["graph", "table", "stack", "queue", "array", "merge"],
  6: ["kitten", "string", "binary", "search", "vector", "bucket"],
  7: ["sitting", "program", "integer", "pointer", "compile", "network"],
  8: ["distance", "sequence", "function", "variable", "database", "keyboard"],
};

const pick = <T>(xs: ArrayLike<T>) => xs[Math.floor(Math.random() * xs.length)];

function typo(word: string) {
  let w = word;
  for (let k = 1 + Math.floor(Math.random() * 3); k > 0 || w === word; k--) {
    const at = Math.floor(Math.random() * w.length);
    const letter = pick("abcdefghijklmnopqrstuvwxyz");
    const op = Math.floor(Math.random() * (w.length > 2 ? 3 : 2));
    if (op === 0) w = w.slice(0, at) + letter + w.slice(at + 1);
    else if (op === 1) w = w.slice(0, at) + letter + w.slice(at);
    else w = w.slice(0, at) + w.slice(at + 1);
  }
  return w;
}

export const editDistance: GridAlgorithm<Input> = {
  id: "edit-distance",
  name: "Edit Distance",
  kind: "grid",
  topic: "dp",
  size: { label: "Word length", min: 3, max: 8, initial: 6 },
  legend: [
    ["current", "Cell being filled"],
    ["read", "Cells it reads"],
    ["pending", "Not filled yet"],
    ["result", "Answer"],
  ],
  about: {
    summary:
      "Fills a table where each cell holds the fewest single-letter inserts, deletes, and replacements that turn a prefix of one word into a prefix of the other, so the bottom-right cell is the answer.",
    invariants: [
      "d[i][j] is the edit distance between the first i letters of a and the first j letters of b.",
      "A cell needs only its upper, left, and upper-left neighbours, so filling row by row always has them ready.",
      "Row 0 and column 0 are the cost of building a prefix from an empty word, or shrinking one to it.",
    ],
    useCases: [
      "Spell checkers that suggest the nearest dictionary word.",
      "Fuzzy search and record matching that tolerate typos.",
      "DNA and protein alignment, which uses the same table with different costs.",
    ],
  },
  complexity: { best: "O(m·n)", average: "O(m·n)", worst: "O(m·n)", space: "O(m·n)" },
  code: {
    pseudo: `
procedure EditDistance(a, b)
  m ← length(a); n ← length(b)
  d ← an (m + 1) × (n + 1) table                 @@init
  for i ← 0 to m do d[i][0] ← i                  @@base-col
  for j ← 0 to n do d[0][j] ← j                  @@base-row
  for i ← 1 to m do
    for j ← 1 to n do
      cost ← 0 if a[i] = b[j] else 1             @@fill
      d[i][j] ← min(d[i − 1][j] + 1,             @@fill
                    d[i][j − 1] + 1,             @@fill
                    d[i − 1][j − 1] + cost)      @@fill
  return d[m][n]                                 @@done
`,
    python: `
def edit_distance(a, b):
    m, n = len(a), len(b)
    d = [[0] * (n + 1) for _ in range(m + 1)]        @@init
    for i in range(m + 1):                            @@base-col
        d[i][0] = i                                   @@base-col
    for j in range(n + 1):                            @@base-row
        d[0][j] = j                                   @@base-row
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1   @@fill
            d[i][j] = min(d[i - 1][j] + 1,            @@fill
                          d[i][j - 1] + 1,            @@fill
                          d[i - 1][j - 1] + cost)     @@fill
    return d[m][n]                                    @@done
`,
    cpp: `
int editDistance(const std::string& a, const std::string& b) {
    int m = a.size(), n = b.size();
    std::vector<std::vector<int>> d(m + 1, std::vector<int>(n + 1));  @@init
    for (int i = 0; i <= m; i++) d[i][0] = i;              @@base-col
    for (int j = 0; j <= n; j++) d[0][j] = j;              @@base-row
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            int cost = a[i - 1] == b[j - 1] ? 0 : 1;       @@fill
            d[i][j] = std::min({d[i - 1][j] + 1,           @@fill
                                d[i][j - 1] + 1,           @@fill
                                d[i - 1][j - 1] + cost});  @@fill
        }
    }
    return d[m][n];                                        @@done
}
`,
    java: `
static int editDistance(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] d = new int[m + 1][n + 1];                     @@init
    for (int i = 0; i <= m; i++) d[i][0] = i;              @@base-col
    for (int j = 0; j <= n; j++) d[0][j] = j;              @@base-row
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;  @@fill
            d[i][j] = Math.min(Math.min(d[i - 1][j] + 1,   @@fill
                                        d[i][j - 1] + 1),  @@fill
                               d[i - 1][j - 1] + cost);    @@fill
        }
    }
    return d[m][n];                                        @@done
}
`,
    javascript: `
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));  @@init
  for (let i = 0; i <= m; i++) d[i][0] = i;                @@base-col
  for (let j = 0; j <= n; j++) d[0][j] = j;                @@base-row
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;          @@fill
      d[i][j] = Math.min(d[i - 1][j] + 1,                  @@fill
                         d[i][j - 1] + 1,                  @@fill
                         d[i - 1][j - 1] + cost);          @@fill
    }
  }
  return d[m][n];                                          @@done
}
`,
  },
  makeInput(size) {
    const a = pick(WORDS[size]);
    return { a, b: typo(a) };
  },
  run({ a, b }) {
    const m = a.length;
    const n = b.length;
    const t = new GridTracer(m + 1, n + 1, { rowHeaders: ["", ...a], colHeaders: ["", ...b] });
    const d = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
    t.step("init", `Make a ${m + 1} × ${n + 1} table. d[i][j] will hold the edits that turn the first i letters of "${a}" into the first j letters of "${b}".`);

    for (let i = 0; i <= m; i++) t.set(i, 0, (d[i][0] = i));
    t.step("base-col", `Column 0: shrinking the first i letters of "${a}" to an empty word takes i deletes.`);
    for (let j = 0; j <= n; j++) t.set(0, j, (d[0][j] = j));
    t.step("base-row", `Row 0: building the first j letters of "${b}" from an empty word takes j inserts.`);

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        const del = d[i - 1][j];
        const ins = d[i][j - 1];
        const rep = d[i - 1][j - 1];
        d[i][j] = Math.min(del + 1, ins + 1, rep + cost);
        t.set(i, j, d[i][j]);
        const pair = cost ? `'${a[i - 1]}' and '${b[j - 1]}' differ` : `'${a[i - 1]}' matches '${b[j - 1]}'`;
        const diag = cost ? `replace ${rep} + 1` : `keep ${rep} + 0`;
        t.step("fill", `d[${i}][${j}]: ${pair}. min(delete ${del} + 1, insert ${ins} + 1, ${diag}) = ${d[i][j]}.`, {
          current: [i, j],
          reads: [[i - 1, j - 1], [i - 1, j], [i, j - 1]],
          vars: { i, j, cost },
        });
      }
    }

    t.answer = String(d[m][n]);
    t.mark(m, n, "result");
    t.step("done", `"${a}" becomes "${b}" in ${d[m][n]} edit${d[m][n] === 1 ? "" : "s"}, the value in the bottom-right cell.`);
    return t.frames;
  },
  solve({ a, b }) {
    const memo = new Map<number, number>();
    const go = (i: number, j: number): number => {
      if (i === 0 || j === 0) return i + j;
      const key = i * (b.length + 1) + j;
      if (!memo.has(key)) {
        const v = a[i - 1] === b[j - 1] ? go(i - 1, j - 1) : 1 + Math.min(go(i - 1, j), go(i, j - 1), go(i - 1, j - 1));
        memo.set(key, v);
      }
      return memo.get(key)!;
    };
    return String(go(a.length, b.length));
  },
};
