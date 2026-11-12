import { GridTracer } from "../../core/trace";
import type { Coord, GridAlgorithm } from "../../core/types";
import { STEPS, fillBoard, inside, numbers, where } from "./board";

type Input = { grid: number[][] };

const label = (islands: number) => `${islands} island${islands === 1 ? "" : "s"}`;

function countIslands(grid: number[][]) {
  const side = grid.length;
  const parent = grid.flat().map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  grid.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (!cell) return;
      if (r > 0 && grid[r - 1][c]) parent[find(r * side + c)] = find((r - 1) * side + c);
      if (c > 0 && grid[r][c - 1]) parent[find(r * side + c)] = find(r * side + c - 1);
    }),
  );
  return new Set(grid.flatMap((row, r) => row.flatMap((cell, c) => (cell ? [find(r * side + c)] : [])))).size;
}

export const islands: GridAlgorithm<Input> = {
  id: "islands",
  name: "Count Islands",
  kind: "grid",
  topic: "grids",
  size: { label: "Grid side", min: 4, max: 8, initial: 6 },
  legend: [
    ["blocked", "Water"],
    ["current", "Land being counted"],
    ["frontier", "Land waiting on the stack"],
    ["result", "Land in a counted island (its number)"],
  ],
  about: {
    summary:
      "Scans the grid row by row, and each land cell that no island owns yet starts a new island, which a flood fill then claims by spreading to every land cell that touches it up, down, left, or right.",
    invariants: [
      "A cell is marked as seen the moment it is pushed on the stack, so no cell is pushed or counted twice.",
      "When the stack is empty, the island holds every land cell connected to its first cell and nothing else.",
      "Land touching only at a corner is a separate island, because the fill moves in four directions.",
    ],
    useCases: [
      "Counting connected regions in an image mask, a map, or a game board.",
      "Finding the size of the largest region, by counting cells during each fill.",
      "Paint-bucket tools and the flood fill step of Minesweeper-style reveals.",
    ],
  },
  complexity: { best: "O(R·C)", average: "O(R·C)", worst: "O(R·C)", space: "O(R·C)" },
  code: {
    pseudo: `
procedure CountIslands(grid)
  seen ← a grid of false                             @@init
  count ← 0
  for each cell (r, c) in reading order do
    if grid[r][c] = 0 or seen[r][c] then continue
    count ← count + 1                                @@island
    seen[r][c] ← true
    stack ← [(r, c)]
    while stack is not empty do
      (cr, cc) ← pop from stack                      @@fill
      for each neighbor (nr, nc) up, right, down, left do
        if it is land and not seen then
          seen[nr][nc] ← true
          push (nr, nc) on stack                     @@fill
  return count                                       @@done
`,
    python: `
def count_islands(grid):
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]     @@init
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 0 or seen[r][c]:
                continue
            count += 1                               @@island
            seen[r][c] = True
            stack = [(r, c)]
            while stack:
                cr, cc = stack.pop()                 @@fill
                for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:
                        seen[nr][nc] = True
                        stack.append((nr, nc))       @@fill
    return count                                     @@done
`,
    cpp: `
int countIslands(const std::vector<std::vector<int>>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<std::vector<bool>> seen(rows, std::vector<bool>(cols, false));  @@init
    const int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    int count = 0;
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 0 || seen[r][c]) continue;
            count++;                                 @@island
            seen[r][c] = true;
            std::vector<std::pair<int, int>> stack = {{r, c}};
            while (!stack.empty()) {
                auto [cr, cc] = stack.back();        @@fill
                stack.pop_back();
                for (int k = 0; k < 4; k++) {
                    int nr = cr + dr[k], nc = cc + dc[k];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    if (grid[nr][nc] == 0 || seen[nr][nc]) continue;
                    seen[nr][nc] = true;
                    stack.push_back({nr, nc});       @@fill
                }
            }
        }
    return count;                                    @@done
}
`,
    java: `
static int countIslands(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    boolean[][] seen = new boolean[rows][cols];      @@init
    int[] dr = {-1, 0, 1, 0}, dc = {0, 1, 0, -1};
    int count = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 0 || seen[r][c]) continue;
            count++;                                 @@island
            seen[r][c] = true;
            Deque<int[]> stack = new ArrayDeque<>();
            stack.push(new int[] {r, c});
            while (!stack.isEmpty()) {
                int[] cur = stack.pop();             @@fill
                for (int k = 0; k < 4; k++) {
                    int nr = cur[0] + dr[k], nc = cur[1] + dc[k];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    if (grid[nr][nc] == 0 || seen[nr][nc]) continue;
                    seen[nr][nc] = true;
                    stack.push(new int[] {nr, nc});  @@fill
                }
            }
        }
    }
    return count;                                    @@done
}
`,
    javascript: `
function countIslands(grid) {
  const rows = grid.length, cols = grid[0].length;
  const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));  @@init
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 0 || seen[r][c]) continue;
      count++;                                       @@island
      seen[r][c] = true;
      const stack = [[r, c]];
      while (stack.length) {
        const [cr, cc] = stack.pop();                @@fill
        for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (grid[nr][nc] === 0 || seen[nr][nc]) continue;
          seen[nr][nc] = true;
          stack.push([nr, nc]);                      @@fill
        }
      }
    }
  }
  return count;                                      @@done
}
`,
  },
  makeInput(side) {
    for (;;) {
      const grid = Array.from({ length: side }, () => Array.from({ length: side }, () => (Math.random() < 0.45 ? 1 : 0)));
      if (countIslands(grid) >= 2) return { grid };
    }
  },
  run({ grid }) {
    const side = grid.length;
    const t = new GridTracer(side, side, { rowHeaders: numbers(side), colHeaders: numbers(side) });
    fillBoard(t, (r, c) => (grid[r][c] ? ["1"] : ["0", "blocked"]));
    const seen = grid.map((row) => row.map(() => false));
    const stack: Coord[] = [];
    const show = (line: string, note: string, extra: Parameters<GridTracer["step"]>[2] = {}) => {
      t.aux = { title: "Stack", items: stack.map(([r, c]) => `${r + 1},${c + 1}`) };
      t.step(line, note, extra);
    };
    show("init", "1 is land and 0 is water. Scan row by row. Each land cell no island owns yet starts a new island, and a flood fill then claims the rest of it.");

    let count = 0;
    for (let r = 0; r < side; r++)
      for (let c = 0; c < side; c++) {
        if (!grid[r][c] || seen[r][c]) continue;
        count++;
        seen[r][c] = true;
        stack.push([r, c]);
        t.mark(r, c, "frontier");
        show("island", `${where(r, c)} is land that no island owns yet. Island ${count} starts here, so push the cell on the stack.`, { current: [r, c], vars: { island: count } });
        while (stack.length) {
          const [cr, cc] = stack.pop()!;
          const added: Coord[] = [];
          for (const [dr, dc] of STEPS) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (!inside(side, side, nr, nc) || !grid[nr][nc] || seen[nr][nc]) continue;
            seen[nr][nc] = true;
            stack.push([nr, nc]);
            added.push([nr, nc]);
            t.mark(nr, nc, "frontier");
          }
          t.set(cr, cc, count, "result");
          const pushed = added.length ? `Push ${added.length} new land neighbor${added.length === 1 ? "" : "s"}.` : "It has no new land neighbors.";
          show("fill", `Pop ${where(cr, cc)} into island ${count}. ${pushed}`, { current: [cr, cc], vars: { island: count } });
        }
      }

    t.answer = label(count);
    show("done", `The scan reached the last cell, so the grid holds ${label(count)}.`);
    return t.frames;
  },
  solve: ({ grid }) => label(countIslands(grid)),
};
