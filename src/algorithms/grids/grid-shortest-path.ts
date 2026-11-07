import { GridTracer } from "../../core/trace";
import type { Coord, GridAlgorithm } from "../../core/types";
import { STEPS, fillBoard, inside, numbers, where } from "./board";

type Input = { grid: number[][] };

const WALL_CHANCE = 0.3;
const UNREACHABLE_KEPT = 0.1;
const DIRECT_KEPT = 0.4;

const stepsLabel = (steps: number) => `${steps} step${steps === 1 ? "" : "s"}`;

function shortest(grid: number[][]) {
  const side = grid.length;
  const best = grid.map((row) => row.map(() => Infinity));
  best[0][0] = 0;
  for (let changed = true; changed; ) {
    changed = false;
    grid.forEach((row, r) =>
      row.forEach((wall, c) => {
        if (wall) return;
        for (const [dr, dc] of STEPS) {
          if (inside(side, side, r + dr, c + dc) && best[r + dr][c + dc] + 1 < best[r][c]) (best[r][c] = best[r + dr][c + dc] + 1), (changed = true);
        }
      }),
    );
  }
  return best[side - 1][side - 1];
}

export const gridShortestPath: GridAlgorithm<Input> = {
  id: "grid-shortest-path",
  name: "Grid Shortest Path",
  kind: "grid",
  topic: "grids",
  size: { label: "Grid side", min: 4, max: 8, initial: 6 },
  legend: [
    ["blocked", "Wall"],
    ["current", "Cell taken off the queue"],
    ["frontier", "In the queue (its distance)"],
    ["result", "Shortest path"],
  ],
  about: {
    summary:
      "Searches outward from the top-left cell with a queue, so every cell is reached by the fewest moves possible, and stops the moment it discovers the bottom-right cell.",
    invariants: [
      "Cells leave the queue in order of distance, so the first time a cell is discovered its distance is the shortest.",
      "Every cell in the queue is at distance d or d + 1 from the start, never further.",
      "A cell is given its distance when discovered, so it is queued at most once.",
    ],
    useCases: [
      "Robot and maze navigation on a grid of free and blocked cells.",
      "Shortest moves for a game piece, such as a knight on a chessboard or a unit on a tile map.",
      "Spreading effects that grow one step at a time, such as fire, flood, or infection puzzles.",
    ],
  },
  complexity: { best: "O(1)", average: "O(R·C)", worst: "O(R·C)", space: "O(R·C)" },
  code: {
    pseudo: `
procedure ShortestPath(grid)
  n ← side length of grid                            @@init
  dist ← map with (0, 0) → 0
  queue ← [(0, 0)]
  while queue is not empty do
    (r, c) ← remove from front of queue              @@expand
    for each neighbor (nr, nc) up, right, down, left do
      if it is on the grid, open, and not in dist then
        dist[nr][nc] ← dist[r][c] + 1                @@expand
        if (nr, nc) = (n − 1, n − 1) then return dist[nr][nc]  @@found
        add (nr, nc) to back of queue
  return −1                                          @@done
`,
    python: `
from collections import deque

def shortest_path(grid):
    n = len(grid)                                    @@init
    dist = {(0, 0): 0}
    queue = deque([(0, 0)])
    while queue:
        r, c = queue.popleft()                       @@expand
        for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0 and (nr, nc) not in dist:
                dist[(nr, nc)] = dist[(r, c)] + 1    @@expand
                if (nr, nc) == (n - 1, n - 1):
                    return dist[(nr, nc)]            @@found
                queue.append((nr, nc))
    return -1                                        @@done
`,
    cpp: `
int shortestPath(const std::vector<std::vector<int>>& grid) {
    int n = grid.size();                             @@init
    const int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    std::vector<std::vector<int>> dist(n, std::vector<int>(n, -1));
    std::queue<std::pair<int, int>> queue;
    dist[0][0] = 0;
    queue.push({0, 0});
    while (!queue.empty()) {
        auto [r, c] = queue.front();                 @@expand
        queue.pop();
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
            if (grid[nr][nc] == 1 || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;           @@expand
            if (nr == n - 1 && nc == n - 1) return dist[nr][nc];  @@found
            queue.push({nr, nc});
        }
    }
    return -1;                                       @@done
}
`,
    java: `
static int shortestPath(int[][] grid) {
    int n = grid.length;                             @@init
    int[] dr = {-1, 0, 1, 0}, dc = {0, 1, 0, -1};
    int[][] dist = new int[n][n];
    for (int[] row : dist) Arrays.fill(row, -1);
    Deque<int[]> queue = new ArrayDeque<>();
    dist[0][0] = 0;
    queue.add(new int[] {0, 0});
    while (!queue.isEmpty()) {
        int[] cur = queue.poll();                    @@expand
        for (int k = 0; k < 4; k++) {
            int nr = cur[0] + dr[k], nc = cur[1] + dc[k];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
            if (grid[nr][nc] == 1 || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[cur[0]][cur[1]] + 1; @@expand
            if (nr == n - 1 && nc == n - 1) return dist[nr][nc];  @@found
            queue.add(new int[] {nr, nc});
        }
    }
    return -1;                                       @@done
}
`,
    javascript: `
function shortestPath(grid) {
  const n = grid.length;                             @@init
  const dist = Array.from({ length: n }, () => new Array(n).fill(-1));
  const queue = [[0, 0]];
  dist[0][0] = 0;
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];                      @@expand
    for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (grid[nr][nc] === 1 || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[r][c] + 1;                 @@expand
      if (nr === n - 1 && nc === n - 1) return dist[nr][nc];  @@found
      queue.push([nr, nc]);
    }
  }
  return -1;                                         @@done
}
`,
  },
  makeInput(side) {
    for (;;) {
      const grid = Array.from({ length: side }, () => Array.from({ length: side }, () => (Math.random() < WALL_CHANCE ? 1 : 0)));
      grid[0][0] = 0;
      grid[side - 1][side - 1] = 0;
      const d = shortest(grid);
      const kept = d === Infinity ? UNREACHABLE_KEPT : d > 2 * (side - 1) ? 1 : DIRECT_KEPT;
      if (Math.random() < kept) return { grid };
    }
  },
  run({ grid }) {
    const side = grid.length;
    const goal: Coord = [side - 1, side - 1];
    const t = new GridTracer(side, side, { rowHeaders: numbers(side), colHeaders: numbers(side) });
    fillBoard(t, (r, c) => (grid[r][c] ? ["", "blocked"] : [""]));
    const dist = grid.map((row) => row.map(() => -1));
    const parent = new Map<number, Coord>();
    const queue: Coord[] = [[0, 0]];
    dist[0][0] = 0;
    t.set(0, 0, 0, "frontier");
    t.set(goal[0], goal[1], "E");
    const show = (line: string, note: string, extra: Parameters<GridTracer["step"]>[2] = {}) => {
      t.aux = { title: "Queue", items: queue.map(([r, c]) => `${r + 1},${c + 1}`) };
      t.step(line, note, extra);
    };
    show("init", "Dark cells are walls. Find the fewest moves from the top-left cell (distance 0) to E in the bottom-right. Cells are taken off the queue nearest first.");

    while (queue.length) {
      const [r, c] = queue.shift()!;
      t.mark(r, c, undefined);
      const found: Coord[] = [];
      let reached = false;
      for (const [dr, dc] of STEPS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inside(side, side, nr, nc) || grid[nr][nc] || dist[nr][nc] !== -1) continue;
        dist[nr][nc] = dist[r][c] + 1;
        parent.set(nr * side + nc, [r, c]);
        t.set(nr, nc, dist[nr][nc], "frontier");
        found.push([nr, nc]);
        if (nr === goal[0] && nc === goal[1]) {
          reached = true;
          break;
        }
        queue.push([nr, nc]);
      }
      const d = dist[r][c];
      const list = found.map(([fr, fc]) => `${fr + 1},${fc + 1}`).join(" and ");
      const gain = found.length ? `Its open, unseen neighbors (${list}) get distance ${d + 1}.` : "It has no open, unseen neighbors.";
      show("expand", `Take ${where(r, c)} (distance ${d}) off the queue. ${gain}`, { current: [r, c], vars: { r: r + 1, c: c + 1, d } });
      if (reached) {
        for (let at: Coord | undefined = goal; at; at = parent.get(at[0] * side + at[1])) t.set(at[0], at[1], dist[at[0]][at[1]], "result");
        t.answer = stepsLabel(dist[goal[0]][goal[1]]);
        show("found", `E is reached at distance ${dist[goal[0]][goal[1]]}. Follow the cells that discovered each other back to the start to draw the path.`);
        return t.frames;
      }
    }

    t.answer = "No path";
    show("done", "The queue is empty and E was never reached, so walls cut it off.");
    return t.frames;
  },
  solve: ({ grid }) => {
    const d = shortest(grid);
    return d === Infinity ? "No path" : stepsLabel(d);
  },
};
