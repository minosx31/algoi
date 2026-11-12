import { GridTracer } from "../../core/trace";
import type { Coord, GridAlgorithm } from "../../core/types";
import { fillBoard, shuffle, where } from "../grids/board";

type Input = { puzzle: number[][] };

const FRAME_BUDGET = 2500;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Cells that already hold `digit` in the same row, column, or box as (r, c). */
function holders(b: number[][], r: number, c: number, digit: number): Coord[] {
  const found: Coord[] = [];
  for (let i = 0; i < 9; i++) {
    const row = r - (r % 3) + Math.floor(i / 3);
    const col = c - (c % 3) + (i % 3);
    if (b[r][i] === digit && i !== c) found.push([r, i]);
    if (b[i][c] === digit && i !== r) found.push([i, c]);
    if (b[row][col] === digit && row !== r && col !== c) found.push([row, col]);
  }
  return found;
}

/** The solutions of `board` (at most `limit`), always extending the blank cell with the fewest candidates. */
function search(board: number[][], limit: number, out: number[][][] = []): number[][][] {
  let best: { r: number; c: number; options: number[] } | undefined;
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      if (board[r][c]) continue;
      const options = DIGITS.filter((d) => holders(board, r, c, d).length === 0);
      if (!best || options.length < best.options.length) best = { r, c, options };
    }
  if (!best) return [...out, board.map((row) => row.slice())];
  for (const d of best.options) {
    board[best.r][best.c] = d;
    out = search(board, limit, out);
    board[best.r][best.c] = 0;
    if (out.length >= limit) break;
  }
  return out;
}

function randomSolution(): number[][] {
  const order = () => shuffle([0, 1, 2]).flatMap((band) => shuffle([0, 1, 2]).map((i) => band * 3 + i));
  const rows = order();
  const cols = order();
  const digit = shuffle([...DIGITS]);
  return rows.map((r) => cols.map((c) => digit[(Math.floor(r / 3) + 3 * (r % 3) + c) % 9]));
}

const blanksOf = (puzzle: number[][]) => puzzle.flat().filter((d) => d === 0).length;

function trace(puzzle: number[][]) {
  const t = new GridTracer(9, 9, { box: { rows: 3, cols: 3 } });
  const b = puzzle.map((row) => row.slice());
  fillBoard(t, (r, c) => [puzzle[r][c] || ""]);
  t.step("init", `${blanksOf(puzzle)} blanks. Fill the first blank in reading order with 1 to 9, and back up when no digit fits.`);

  const go = (): boolean => {
    const blank = b.flatMap((row, r) => row.flatMap((d, c) => (d === 0 ? [[r, c] as Coord] : [])))[0];
    if (!blank) {
      b.forEach((row, r) => row.forEach((d, c) => puzzle[r][c] === 0 && t.set(r, c, d, "result")));
      t.answer = `Solved, ${blanksOf(puzzle)} blanks filled`;
      t.step("done", "No blank is left, and every row, column, and box holds each digit once.");
      return true;
    }
    const [r, c] = blank;
    for (const d of DIGITS) {
      const hits = holders(b, r, c, d);
      const vars = { row: r + 1, col: c + 1, digit: d };
      if (hits.length) {
        const units = [hits.some(([hr]) => hr === r) && "row", hits.some(([, hc]) => hc === c) && "column", hits.some(([hr, hc]) => hr !== r && hc !== c) && "box"].filter(Boolean);
        t.set(r, c, d);
        t.step("try", `${where(r, c)}: ${d} is already in the same ${units.join(" and ")}.`, { current: [r, c], marks: hits.map((h): [Coord, "conflict"] => [h, "conflict"]), vars });
        t.set(r, c, "");
        continue;
      }
      b[r][c] = d;
      t.set(r, c, d, "frontier");
      t.step("place", `${where(r, c)}: ${d} fits, so keep it and move to the next blank.`, { current: [r, c], vars });
      if (go()) return true;
      b[r][c] = 0;
      t.set(r, c, "");
      t.step("undo", `Take ${d} back out of ${where(r, c)} and try the next digit.`, { current: [r, c], vars });
    }
    t.step("dead", `${where(r, c)}: none of 1 to 9 fits, so the search backs up.`, { current: [r, c], vars: { row: r + 1, col: c + 1 } });
    return false;
  };

  go();
  return t.frames;
}

export const sudoku: GridAlgorithm<Input> = {
  id: "sudoku",
  name: "Sudoku",
  kind: "grid",
  topic: "backtracking",
  size: { label: "Blanks", min: 8, max: 32, initial: 28 },
  legend: [
    ["current", "Digit being tried"],
    ["frontier", "Digit kept so far"],
    ["conflict", "Same digit already there"],
    ["result", "Digit in the solution"],
  ],
  about: {
    summary:
      "Fills the first blank with the smallest digit that breaks no rule, moves on to the next blank, and when a blank has no digit left it clears the previous guess and tries that cell's next digit.",
    invariants: [
      "No row, column, or 3 × 3 box ever holds the same digit twice, because a digit is only placed after that check.",
      "Blanks are filled in reading order, so everything before the current blank is a guess that the search may still take back.",
      "A blank that has no legal digit proves some earlier guess was wrong, so the search returns instead of trying more digits further on.",
    ],
    useCases: [
      "Solving puzzles that are a grid of cells with row, column, and region rules, such as Sudoku variants and Kakuro.",
      "Timetabling and seat assignment, where each choice rules out some choices for others.",
      "The base case that faster solvers improve by picking the blank with the fewest candidates first.",
    ],
  },
  complexity: { best: "O(k)", average: "O(9^k)", worst: "O(9^k)", space: "O(k)" },
  code: {
    pseudo: `
procedure SolveSudoku(board)                         @@init
  find the first blank cell (row, col) in reading order
  if there is none then return true                  @@done
  for digit ← 1 to 9 do
    if digit is in the row, column, or box then continue  @@try
    board[row][col] ← digit                          @@place
    if SolveSudoku(board) then return true
    board[row][col] ← blank                          @@undo
  return false                                       @@dead
`,
    python: `
def solve_sudoku(board):                             @@init
    for row in range(9):
        for col in range(9):
            if board[row][col] != 0:
                continue
            for digit in range(1, 10):
                if not fits(board, row, col, digit):  @@try
                    continue
                board[row][col] = digit              @@place
                if solve_sudoku(board):
                    return True
                board[row][col] = 0                  @@undo
            return False                             @@dead
    return True                                      @@done

def fits(board, row, col, digit):
    top, left = row - row % 3, col - col % 3
    for i in range(9):
        if board[row][i] == digit or board[i][col] == digit:
            return False
        if board[top + i // 3][left + i % 3] == digit:
            return False
    return True
`,
    cpp: `
bool fits(int b[9][9], int row, int col, int digit) {
    int top = row - row % 3, left = col - col % 3;
    for (int i = 0; i < 9; i++) {
        if (b[row][i] == digit || b[i][col] == digit) return false;
        if (b[top + i / 3][left + i % 3] == digit) return false;
    }
    return true;
}

bool solveSudoku(int b[9][9]) {                      @@init
    for (int row = 0; row < 9; row++) {
        for (int col = 0; col < 9; col++) {
            if (b[row][col] != 0) continue;
            for (int digit = 1; digit <= 9; digit++) {
                if (!fits(b, row, col, digit)) continue;  @@try
                b[row][col] = digit;                 @@place
                if (solveSudoku(b)) return true;
                b[row][col] = 0;                     @@undo
            }
            return false;                            @@dead
        }
    }
    return true;                                     @@done
}
`,
    java: `
static boolean fits(int[][] b, int row, int col, int digit) {
    int top = row - row % 3, left = col - col % 3;
    for (int i = 0; i < 9; i++) {
        if (b[row][i] == digit || b[i][col] == digit) return false;
        if (b[top + i / 3][left + i % 3] == digit) return false;
    }
    return true;
}

static boolean solveSudoku(int[][] b) {              @@init
    for (int row = 0; row < 9; row++) {
        for (int col = 0; col < 9; col++) {
            if (b[row][col] != 0) continue;
            for (int digit = 1; digit <= 9; digit++) {
                if (!fits(b, row, col, digit)) continue;  @@try
                b[row][col] = digit;                 @@place
                if (solveSudoku(b)) return true;
                b[row][col] = 0;                     @@undo
            }
            return false;                            @@dead
        }
    }
    return true;                                     @@done
}
`,
    javascript: `
function fits(b, row, col, digit) {
  const top = row - (row % 3), left = col - (col % 3);
  for (let i = 0; i < 9; i++) {
    if (b[row][i] === digit || b[i][col] === digit) return false;
    if (b[top + Math.floor(i / 3)][left + (i % 3)] === digit) return false;
  }
  return true;
}

function solveSudoku(b) {                            @@init
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (b[row][col] !== 0) continue;
      for (let digit = 1; digit <= 9; digit++) {
        if (!fits(b, row, col, digit)) continue;     @@try
        b[row][col] = digit;                         @@place
        if (solveSudoku(b)) return true;
        b[row][col] = 0;                             @@undo
      }
      return false;                                  @@dead
    }
  }
  return true;                                       @@done
}
`,
  },
  makeInput(blanks) {
    for (;;) {
      const puzzle = randomSolution();
      for (const at of shuffle(Array.from({ length: 81 }, (_, i) => i)).slice(0, blanks)) puzzle[Math.floor(at / 9)][at % 9] = 0;
      if (search(puzzle, 2).length === 1 && trace(puzzle).length <= FRAME_BUDGET) return { puzzle };
    }
  },
  run: ({ puzzle }) => trace(puzzle),
  solve: ({ puzzle }) => (search(puzzle.map((row) => row.slice()), 1).length ? `Solved, ${blanksOf(puzzle)} blanks filled` : "No solution"),
};
