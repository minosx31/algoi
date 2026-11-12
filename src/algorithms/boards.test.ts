import { describe, expect, test } from "bun:test";
import { nQueens } from "./backtracking/n-queens";
import { sudoku } from "./backtracking/sudoku";
import { wordSearch } from "./backtracking/word-search";
import { gridShortestPath } from "./grids/grid-shortest-path";
import { islands } from "./grids/islands";
import { uniquePaths } from "./grids/unique-paths";
import type { Coord, GridAlgorithm, GridFrame } from "../core/types";

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seeded<T>(seed: number, body: () => T): T {
  const random = Math.random;
  Math.random = mulberry32(seed);
  try {
    return body();
  } finally {
    Math.random = random;
  }
}

const sizes = ({ size: { min, max } }: GridAlgorithm<any>) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
const last = (frames: GridFrame[]) => frames[frames.length - 1];
const marked = (frame: GridFrame, mark: string) =>
  frame.cells.flatMap((row, r) => row.flatMap((cell, c) => (cell.mark === mark ? [{ at: [r, c] as Coord, text: cell.text }] : [])));
const touching = ([ar, ac]: Coord, [br, bc]: Coord) => Math.abs(ar - br) + Math.abs(ac - bc) === 1;

describe("n-queens", () => {
  test("the final board has one queen per row and no two share a column or diagonal", () => {
    for (const n of sizes(nQueens)) {
      const final = last(nQueens.run({ n }));
      const queens = marked(final, "result").map((q) => q.at);
      expect(queens.map(([r]) => r)).toEqual(Array.from({ length: n }, (_, r) => r));
      for (const [r, c] of queens)
        for (const [r2, c2] of queens) if (r < r2) expect(c === c2 || Math.abs(c - c2) === r2 - r).toBe(false);
    }
  });

  test("size 6 backs up: a queen is removed, and the note names its square", () => {
    const frames = nQueens.run({ n: 6 });
    const removal = frames.find((f) => f.line === "remove")!;
    expect(removal.note).toMatch(/Take the queen back out of row \d, column \d/);
    expect(removal.cells.flat().filter((c) => c.text === "×")).toHaveLength(1);
    expect(frames.filter((f) => f.line === "dead").length).toBeGreaterThan(0);
  });
});

describe("sudoku", () => {
  const valid = (b: number[][]) => {
    const full = (cells: number[]) => [...cells].sort().join("") === "123456789";
    for (let i = 0; i < 9; i++) {
      expect(full(b[i])).toBe(true);
      expect(full(b.map((row) => row[i]))).toBe(true);
      expect(full(Array.from({ length: 9 }, (_, k) => b[3 * Math.floor(i / 3) + Math.floor(k / 3)][3 * (i % 3) + (k % 3)]))).toBe(true);
    }
  };

  test("the final board is valid, keeps every given, and stays under 5000 frames at every size", () => {
    seeded(7, () => {
      for (const blanks of sizes(sudoku))
        for (let k = 0; k < 12; k++) {
          const input = sudoku.makeInput(blanks);
          const frames = sudoku.run(input);
          expect(frames.length).toBeLessThan(5000);
          const board = last(frames).cells.map((row) => row.map((cell) => +cell.text));
          valid(board);
          input.puzzle.forEach((row, r) => row.forEach((d, c) => d && expect(board[r][c]).toBe(d)));
        }
    });
  });

  test("most puzzles at the default size back up at least once", () => {
    seeded(11, () => {
      const backed = Array.from({ length: 40 }, () => sudoku.run(sudoku.makeInput(sudoku.size.initial)).some((f) => f.line === "undo"));
      expect(backed.filter(Boolean).length).toBeGreaterThan(24);
    });
  });
});

describe("word-search", () => {
  const grid = (rows: string[]) => rows.map((r) => r.split(""));

  test("the final path spells the word on touching cells, and dead ends unmark", () => {
    seeded(3, () => {
      for (const length of sizes(wordSearch))
        for (let k = 0; k < 30; k++) {
          const input = wordSearch.makeInput(length);
          const frames = wordSearch.run(input);
          const path = marked(last(frames), "result").map((p) => p.at);
          if (last(frames).answer?.startsWith("Found")) {
            expect(last(frames).aux!.items.join("")).toBe(input.word);
            expect(path).toHaveLength(input.word.length);
            expect(path.every((p) => path.some((q) => touching(p, q)))).toBe(true);
            expect(path.map(([r, c]) => input.grid[r][c]).sort()).toEqual([...input.word].sort());
          }
          frames.forEach((f, i) => {
            if (f.line !== "unmark") return;
            expect(f.aux!.items.length).toBe(frames[i - 1].aux!.items.length - 1);
            expect(marked(f, "frontier").length + marked(f, "current").length).toBe(f.aux!.items.length);
          });
        }
    });
  });

  test("a word that is not in the grid ends on a not-found answer with an empty path", () => {
    const frames = wordSearch.run({ grid: grid(["CAT", "XXX", "XXX"]), word: "CAR" });
    expect(last(frames).answer).toBe('"CAR" is not in the grid');
    expect(marked(last(frames), "frontier")).toEqual([]);
    expect(wordSearch.solve({ grid: grid(["CAT", "XXX", "XXX"]), word: "CAR" })).toBe('"CAR" is not in the grid');
  });
});

describe("islands", () => {
  test("every land cell ends owned by a numbered island and the numbers match the count", () => {
    seeded(5, () => {
      for (const side of sizes(islands))
        for (let k = 0; k < 20; k++) {
          const input = islands.makeInput(side);
          const final = last(islands.run(input));
          const owned = marked(final, "result");
          expect(owned).toHaveLength(input.grid.flat().filter(Boolean).length);
          expect(final.answer).toBe(`${new Set(owned.map((o) => o.text)).size} islands`);
        }
    });
  });

  test("land that touches only at a corner is two islands", () => {
    const grid = [[1, 0], [0, 1]];
    expect(last(islands.run({ grid })).answer).toBe("2 islands");
  });
});

describe("grid-shortest-path", () => {
  test("the drawn path is as long as the answer and every cell on it touches the next", () => {
    seeded(9, () => {
      for (const side of sizes(gridShortestPath))
        for (let k = 0; k < 20; k++) {
          const final = last(gridShortestPath.run(gridShortestPath.makeInput(side)));
          if (final.answer === "No path") continue;
          const path = marked(final, "result").sort((a, b) => +a.text - +b.text);
          expect(final.answer).toBe(`${path.length - 1} step${path.length === 2 ? "" : "s"}`);
          path.forEach((p, i) => i && expect(touching(path[i - 1].at, p.at)).toBe(true));
          expect(path.map((p) => +p.text)).toEqual(path.map((_, i) => i));
        }
    });
  });

  test("a wall that seals the goal ends on No path", () => {
    const grid = [[0, 0, 0], [0, 1, 1], [0, 1, 0]];
    const final = last(gridShortestPath.run({ grid }));
    expect(final.answer).toBe("No path");
    expect(marked(final, "result")).toEqual([]);
  });

  test("a walled start or goal ends on No path in run and solve", () => {
    for (const grid of [
      [[1, 0, 0], [0, 0, 0], [0, 0, 0]],
      [[0, 0, 0], [0, 0, 0], [0, 0, 1]],
    ]) {
      expect(last(gridShortestPath.run({ grid })).answer).toBe("No path");
      expect(gridShortestPath.solve!({ grid })).toBe("No path");
    }
  });
});

describe("unique-paths", () => {
  test("an open 3 by 3 grid has 6 paths, and the bottom-right cell shows the answer", () => {
    const final = last(uniquePaths.run({ grid: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] }));
    expect(final.answer).toBe("6");
    expect(final.cells[2][2].text).toBe("6");
  });

  test("an obstacle holds 0 and the final cell equals the answer on seeded inputs", () => {
    seeded(13, () => {
      for (const side of sizes(uniquePaths))
        for (let k = 0; k < 20; k++) {
          const input = uniquePaths.makeInput(side);
          const final = last(uniquePaths.run(input));
          expect(final.cells[side - 1][side - 1].text).toBe(final.answer!);
          input.grid.forEach((row, r) => row.forEach((wall, c) => wall && expect(final.cells[r][c]).toEqual({ text: "0", mark: "blocked" })));
        }
    });
  });
});
