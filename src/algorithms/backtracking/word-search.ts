import { GridTracer } from "../../core/trace";
import type { Coord, GridAlgorithm } from "../../core/types";
import { STEPS, fillBoard, inside, numbers, roll, where } from "../grids/board";

type Input = { grid: string[][]; word: string };

const WORDS: Record<number, string[]> = {
  3: ["BIT", "MAP", "SET", "KEY"],
  4: ["HEAP", "TREE", "SORT", "NODE", "LIST", "HASH"],
  5: ["GRAPH", "STACK", "QUEUE", "ARRAY", "TABLE"],
  6: ["BINARY", "SEARCH", "STRING", "MEMORY", "BUFFER"],
};
const EXTRA_LETTERS = "AEIRST";

const found = (word: string) => `Found "${word}"`;
const missing = (word: string) => `"${word}" is not in the grid`;

export const wordSearch: GridAlgorithm<Input> = {
  id: "word-search",
  name: "Word Search",
  kind: "grid",
  topic: "backtracking",
  size: { label: "Word length", min: 3, max: 6, initial: 4 },
  legend: [
    ["current", "End of the path"],
    ["frontier", "Path so far"],
    ["conflict", "Neighbor rejected"],
    ["result", "Spelled word"],
  ],
  about: {
    summary:
      "Starts a path on every cell that holds the word's first letter and extends it one neighbor at a time, and when no neighbor continues the spelling it unmarks the last cell and tries the next direction from the cell before.",
    invariants: [
      "The path always spells a prefix of the word, and no cell appears in it twice.",
      "A cell is marked as used while it is on the path and unmarked when the search returns from it, so other paths may use it later.",
      "Directions are tried up, right, down, left, so the first path found is the one that comes first in that order.",
    ],
    useCases: [
      "Word puzzles, and boggle-style games where letters must touch.",
      "Finding a pattern of connected cells in an image or a map tile grid.",
      "The template for path search where cells may be reused between attempts but not within one.",
    ],
  },
  complexity: { best: "O(L)", average: "O(R·C·3^L)", worst: "O(R·C·3^L)", space: "O(L)" },
  code: {
    pseudo: `
procedure WordSearch(grid, word)
  used ← an empty set of cells                       @@init
  for each cell (r, c) in reading order do
    if Walk(r, c, 0) then return true
  return false                                       @@done

function Walk(r, c, i)
  if (r, c) is off the grid, used, or grid[r][c] ≠ word[i] then return false  @@check
  add (r, c) to used                                 @@visit
  if i = length(word) − 1 then return true           @@found
  for each neighbor (nr, nc) up, right, down, left do
    if Walk(nr, nc, i + 1) then return true
  remove (r, c) from used                            @@unmark
  return false
`,
    python: `
def word_search(grid, word):
    rows, cols = len(grid), len(grid[0])             @@init
    used = set()

    def walk(r, c, i):
        if not (0 <= r < rows and 0 <= c < cols) or (r, c) in used or grid[r][c] != word[i]:  @@check
            return False
        used.add((r, c))                             @@visit
        if i == len(word) - 1:
            return True                              @@found
        for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):
            if walk(r + dr, c + dc, i + 1):
                return True
        used.remove((r, c))                          @@unmark
        return False

    for r in range(rows):
        for c in range(cols):
            if walk(r, c, 0):
                return True
    return False                                     @@done
`,
    cpp: `
bool walk(const std::vector<std::string>& grid, const std::string& word,
          std::vector<std::vector<bool>>& used, int r, int c, size_t i) {
    if (r < 0 || r >= (int)grid.size() || c < 0 || c >= (int)grid[0].size() ||
        used[r][c] || grid[r][c] != word[i]) return false;  @@check
    const int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    used[r][c] = true;                               @@visit
    if (i + 1 == word.size()) return true;           @@found
    for (int k = 0; k < 4; k++)
        if (walk(grid, word, used, r + dr[k], c + dc[k], i + 1)) return true;
    used[r][c] = false;                              @@unmark
    return false;
}

bool wordSearch(const std::vector<std::string>& grid, const std::string& word) {
    std::vector<std::vector<bool>> used(grid.size(), std::vector<bool>(grid[0].size(), false));  @@init
    for (int r = 0; r < (int)grid.size(); r++)
        for (int c = 0; c < (int)grid[0].size(); c++)
            if (walk(grid, word, used, r, c, 0)) return true;
    return false;                                    @@done
}
`,
    java: `
static boolean wordSearch(char[][] grid, String word) {
    boolean[][] used = new boolean[grid.length][grid[0].length];  @@init
    for (int r = 0; r < grid.length; r++)
        for (int c = 0; c < grid[0].length; c++)
            if (walk(grid, word, used, r, c, 0)) return true;
    return false;                                    @@done
}

static boolean walk(char[][] grid, String word, boolean[][] used, int r, int c, int i) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length ||
        used[r][c] || grid[r][c] != word.charAt(i)) return false;  @@check
    int[] dr = {-1, 0, 1, 0}, dc = {0, 1, 0, -1};
    used[r][c] = true;                               @@visit
    if (i == word.length() - 1) return true;         @@found
    for (int k = 0; k < 4; k++)
        if (walk(grid, word, used, r + dr[k], c + dc[k], i + 1)) return true;
    used[r][c] = false;                              @@unmark
    return false;
}
`,
    javascript: `
function wordSearch(grid, word) {
  const rows = grid.length, cols = grid[0].length;   @@init
  const used = new Set();

  function walk(r, c, i) {
    if (r < 0 || r >= rows || c < 0 || c >= cols ||
        used.has(r * cols + c) || grid[r][c] !== word[i]) return false;  @@check
    used.add(r * cols + c);                          @@visit
    if (i === word.length - 1) return true;          @@found
    for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]])
      if (walk(r + dr, c + dc, i + 1)) return true;
    used.delete(r * cols + c);                       @@unmark
    return false;
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (walk(r, c, 0)) return true;
  return false;                                      @@done
}
`,
  },
  makeInput(length) {
    const side = length + 1;
    const word = WORDS[length][roll(WORDS[length].length)];
    const grid: string[][] = Array.from({ length: side }, () => Array(side).fill(""));
    for (;;) {
      const path: Coord[] = [[roll(side), roll(side)]];
      while (path.length < length) {
        const [r, c] = path[path.length - 1];
        const open = STEPS.map(([dr, dc]): Coord => [r + dr, c + dc]).filter(
          ([nr, nc]) => inside(side, side, nr, nc) && !path.some(([pr, pc]) => pr === nr && pc === nc),
        );
        if (!open.length) break;
        path.push(open[roll(open.length)]);
      }
      if (path.length < length) continue;
      path.forEach(([r, c], i) => (grid[r][c] = word[i]));
      break;
    }
    const pool = word + EXTRA_LETTERS;
    return { grid: grid.map((row) => row.map((ch) => ch || pool[roll(pool.length)])), word };
  },
  run({ grid, word }) {
    const rows = grid.length;
    const cols = grid[0].length;
    const t = new GridTracer(rows, cols, { rowHeaders: numbers(rows), colHeaders: numbers(cols) });
    fillBoard(t, (r, c) => [grid[r][c]]);
    const path: Coord[] = [];
    const show = (line: string, note: string, extra: Parameters<GridTracer["step"]>[2] = {}) => {
      t.aux = { title: "Path", items: path.map(([r, c]) => grid[r][c]) };
      t.step(line, note, extra);
    };
    show("init", `Find "${word}" by moving up, right, down, or left from letter to letter, never reusing a cell on the path. Start from each cell that holds '${word[0]}'.`);

    const walk = (r: number, c: number, i: number): boolean => {
      if (!inside(rows, cols, r, c)) return false;
      const onPath = path.some(([pr, pc]) => pr === r && pc === c);
      if (onPath || grid[r][c] !== word[i]) {
        if (i > 0) {
          const why = onPath ? `${where(r, c)} is already on the path.` : `${where(r, c)} holds '${grid[r][c]}', not '${word[i]}'.`;
          show("check", why, { current: path[path.length - 1], marks: [[[r, c], "conflict"]], vars: { i: i + 1 } });
        }
        return false;
      }
      path.push([r, c]);
      t.mark(r, c, "frontier");
      const start = i === 0 ? `'${grid[r][c]}' is the first letter. Start a path here.` : `'${grid[r][c]}' is letter ${i + 1} of "${word}". Extend the path.`;
      show("visit", `${where(r, c)}: ${start}`, { current: [r, c], vars: { i: i + 1 } });
      if (i === word.length - 1) {
        for (const [pr, pc] of path) t.mark(pr, pc, "result");
        t.answer = found(word);
        show("found", `The path spells "${word}" in ${path.length} cells.`);
        return true;
      }
      for (const [dr, dc] of STEPS) if (walk(r + dr, c + dc, i + 1)) return true;
      path.pop();
      t.mark(r, c, undefined);
      const back = path[path.length - 1];
      const next = back ? `go back to ${where(...back)}` : `scan on for the next '${word[0]}'`;
      show("unmark", `Dead end: no neighbor of ${where(r, c)} continues the spelling. Take it off the path and ${next}.`, { current: back });
      return false;
    };

    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (walk(r, c, 0)) return t.frames;
    t.answer = missing(word);
    show("done", `Every start was tried and none spells "${word}".`);
    return t.frames;
  },
  solve({ grid, word }) {
    const side = grid.length;
    let paths: number[][] = grid.flatMap((row, r) => row.flatMap((ch, c) => (ch === word[0] ? [[r * side + c]] : [])));
    for (const ch of word.slice(1)) {
      paths = paths.flatMap((p) => {
        const at = p[p.length - 1];
        return STEPS.flatMap(([dr, dc]) => {
          const r = Math.floor(at / side) + dr;
          const c = (at % side) + dc;
          return inside(side, side, r, c) && grid[r][c] === ch && !p.includes(r * side + c) ? [[...p, r * side + c]] : [];
        });
      });
    }
    return paths.length ? found(word) : missing(word);
  },
};
