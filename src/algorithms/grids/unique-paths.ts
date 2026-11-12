import { GridTracer } from "../../core/trace";
import type { Coord, GridAlgorithm } from "../../core/types";
import { numbers, where } from "./board";

type Input = { grid: number[][] };

const OBSTACLE_CHANCE = 0.15;

export const uniquePaths: GridAlgorithm<Input> = {
  id: "unique-paths",
  name: "Unique Paths",
  kind: "grid",
  topic: "grids",
  size: { label: "Grid side", min: 3, max: 7, initial: 5 },
  legend: [
    ["current", "Cell being filled"],
    ["read", "Above and left"],
    ["blocked", "Obstacle"],
    ["pending", "Not filled yet"],
    ["result", "Answer"],
  ],
  about: {
    summary:
      "Counts the ways to walk from the top-left to the bottom-right moving only right or down, by giving each cell the sum of the counts above it and to its left, and zero if an obstacle sits there.",
    invariants: [
      "ways[r][c] is the number of right-and-down walks from the start to that cell that avoid every obstacle.",
      "A walk reaches a cell from above or from the left, never both, so the two counts add without double counting.",
      "An obstacle holds 0, so it adds nothing to the cells that read it.",
    ],
    useCases: [
      "Counting routes for a robot or a delivery grid that may not move back.",
      "The template for grid DP such as minimum path sum and dungeon-style problems.",
      "Counting lattice paths, where without obstacles the answer is a binomial coefficient.",
    ],
  },
  complexity: { best: "O(R·C)", average: "O(R·C)", worst: "O(R·C)", space: "O(R·C)" },
  code: {
    pseudo: `
procedure UniquePaths(grid)
  ways ← a grid of zeros the same size as grid       @@init
  for each cell (r, c) in reading order do
    if grid[r][c] = 1 then ways[r][c] ← 0            @@blocked
    else if (r, c) = (0, 0) then ways[r][c] ← 1      @@base
    else
      above ← ways[r − 1][c] if r > 0, else 0
      left ← ways[r][c − 1] if c > 0, else 0
      ways[r][c] ← above + left                      @@fill
  return ways[last row][last column]                 @@done
`,
    python: `
def unique_paths(grid):
    rows, cols = len(grid), len(grid[0])
    ways = [[0] * cols for _ in range(rows)]         @@init
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                ways[r][c] = 0                       @@blocked
            elif r == 0 and c == 0:
                ways[r][c] = 1                       @@base
            else:
                above = ways[r - 1][c] if r > 0 else 0
                left = ways[r][c - 1] if c > 0 else 0
                ways[r][c] = above + left            @@fill
    return ways[rows - 1][cols - 1]                  @@done
`,
    cpp: `
long long uniquePaths(const std::vector<std::vector<int>>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<std::vector<long long>> ways(rows, std::vector<long long>(cols, 0));  @@init
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 1) {
                ways[r][c] = 0;                      @@blocked
            } else if (r == 0 && c == 0) {
                ways[r][c] = 1;                      @@base
            } else {
                long long above = r > 0 ? ways[r - 1][c] : 0;
                long long left = c > 0 ? ways[r][c - 1] : 0;
                ways[r][c] = above + left;           @@fill
            }
        }
    }
    return ways[rows - 1][cols - 1];                 @@done
}
`,
    java: `
static long uniquePaths(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    long[][] ways = new long[rows][cols];            @@init
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 1) {
                ways[r][c] = 0;                      @@blocked
            } else if (r == 0 && c == 0) {
                ways[r][c] = 1;                      @@base
            } else {
                long above = r > 0 ? ways[r - 1][c] : 0;
                long left = c > 0 ? ways[r][c - 1] : 0;
                ways[r][c] = above + left;           @@fill
            }
        }
    }
    return ways[rows - 1][cols - 1];                 @@done
}
`,
    javascript: `
function uniquePaths(grid) {
  const rows = grid.length, cols = grid[0].length;
  const ways = Array.from({ length: rows }, () => new Array(cols).fill(0));  @@init
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        ways[r][c] = 0;                              @@blocked
      } else if (r === 0 && c === 0) {
        ways[r][c] = 1;                              @@base
      } else {
        const above = r > 0 ? ways[r - 1][c] : 0;
        const left = c > 0 ? ways[r][c - 1] : 0;
        ways[r][c] = above + left;                   @@fill
      }
    }
  }
  return ways[rows - 1][cols - 1];                   @@done
}
`,
  },
  makeInput(side) {
    const grid = Array.from({ length: side }, () => Array.from({ length: side }, () => (Math.random() < OBSTACLE_CHANCE ? 1 : 0)));
    grid[0][0] = 0;
    grid[side - 1][side - 1] = 0;
    return { grid };
  },
  run({ grid }) {
    const side = grid.length;
    const t = new GridTracer(side, side, { rowHeaders: numbers(side), colHeaders: numbers(side) });
    grid.forEach((row, r) => row.forEach((wall, c) => wall && t.set(r, c, "", "blocked")));
    const ways = grid.map((row) => row.map(() => 0));
    t.step("init", "Count the walks from the top-left to the bottom-right that only move right or down. Dark cells are obstacles. A cell's count comes from the cells above it and to its left.");

    for (let r = 0; r < side; r++)
      for (let c = 0; c < side; c++) {
        if (grid[r][c]) {
          t.set(r, c, 0, "blocked");
          t.step("blocked", `${where(r, c)} is an obstacle, so no walk passes through it and it holds 0.`, { vars: { r: r + 1, c: c + 1 } });
        } else if (r === 0 && c === 0) {
          ways[0][0] = 1;
          t.set(0, 0, 1);
          t.step("base", "The start has exactly one way to be reached: stand there.", { current: [0, 0], vars: { r: 1, c: 1 } });
        } else {
          const reads: Coord[] = [];
          if (r > 0) reads.push([r - 1, c]);
          if (c > 0) reads.push([r, c - 1]);
          const above = r > 0 ? ways[r - 1][c] : 0;
          const left = c > 0 ? ways[r][c - 1] : 0;
          ways[r][c] = above + left;
          t.set(r, c, ways[r][c]);
          const edge = r === 0 ? " There is no cell above." : c === 0 ? " There is no cell to the left." : "";
          t.step("fill", `${where(r, c)}: ${above} from above + ${left} from the left = ${ways[r][c]}.${edge}`, { current: [r, c], reads, vars: { r: r + 1, c: c + 1, above, left } });
        }
      }

    const total = ways[side - 1][side - 1];
    t.answer = String(total);
    t.mark(side - 1, side - 1, "result");
    t.step("done", total ? `${total} different walks reach the bottom-right cell.` : "Obstacles cut off every walk, so no path reaches the bottom-right cell.");
    return t.frames;
  },
  solve({ grid }) {
    const side = grid.length;
    const memo = new Map<number, number>();
    const from = (r: number, c: number): number => {
      if (r >= side || c >= side || grid[r][c]) return 0;
      if (r === side - 1 && c === side - 1) return 1;
      const key = r * side + c;
      if (!memo.has(key)) memo.set(key, from(r + 1, c) + from(r, c + 1));
      return memo.get(key)!;
    };
    return String(from(0, 0));
  },
};
