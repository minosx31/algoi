import { GridTracer } from "../../core/trace";
import type { Coord, GridAlgorithm } from "../../core/types";
import { fillBoard, numbers, where } from "../grids/board";

type Input = { n: number };

const answerOf = (cols: number[]) => `Columns ${cols.map((c) => c + 1).join(", ")}, one queen per row`;

export const nQueens: GridAlgorithm<Input> = {
  id: "n-queens",
  name: "N-Queens",
  kind: "grid",
  topic: "backtracking",
  size: { label: "Board size", min: 4, max: 8, initial: 6 },
  legend: [
    ["current", "Queen just placed or removed"],
    ["frontier", "Queen kept"],
    ["blocked", "Attacked square"],
    ["conflict", "Row with no square left"],
    ["result", "Solution"],
  ],
  about: {
    summary:
      "Puts one queen in each row from the top, trying columns left to right, and when a row has no safe square it removes the previous queen and moves that one further right.",
    invariants: [
      "The queens placed so far never share a column or a diagonal, and there is at most one per row.",
      "Rows above the current one are decided; every choice below it is thrown away when the search backs up.",
      "A square is skipped without any search below it when an earlier queen attacks it, which prunes whole branches.",
    ],
    useCases: [
      "The template for any search that builds a solution one choice at a time and undoes a choice when it hits a dead end.",
      "Constraint problems such as scheduling and seating, where a partial answer is checked as soon as it breaks a rule.",
      "Teaching why pruning early beats generating every arrangement and checking it at the end.",
    ],
  },
  complexity: { best: "O(n²)", average: "O(n!)", worst: "O(n!)", space: "O(n)" },
  code: {
    pseudo: `
procedure SolveQueens(n)
  cols ← an empty list                               @@init
  function place(row)
    if row = n then return true                      @@done
    for col ← 0 to n − 1 do
      if some queen in cols attacks (row, col) then continue
      append col to cols                             @@place
      if place(row + 1) then return true
      remove the last item of cols                   @@remove
    return false                                     @@dead
  place(0)
  return cols
`,
    python: `
def solve_queens(n):
    cols = []                                        @@init

    def attacked(row, col):
        return any(c == col or abs(c - col) == row - r for r, c in enumerate(cols))

    def place(row):
        if row == n:                                 @@done
            return True                              @@done
        for col in range(n):
            if attacked(row, col):
                continue
            cols.append(col)                         @@place
            if place(row + 1):
                return True
            cols.pop()                               @@remove
        return False                                 @@dead

    place(0)
    return cols
`,
    cpp: `
bool attacked(const std::vector<int>& cols, int row, int col) {
    for (int r = 0; r < row; r++)
        if (cols[r] == col || std::abs(cols[r] - col) == row - r) return true;
    return false;
}

bool place(int n, int row, std::vector<int>& cols) {
    if (row == n) return true;                       @@done
    for (int col = 0; col < n; col++) {
        if (attacked(cols, row, col)) continue;
        cols.push_back(col);                         @@place
        if (place(n, row + 1, cols)) return true;
        cols.pop_back();                             @@remove
    }
    return false;                                    @@dead
}

std::vector<int> solveQueens(int n) {
    std::vector<int> cols;                           @@init
    place(n, 0, cols);
    return cols;
}
`,
    java: `
static List<Integer> solveQueens(int n) {
    List<Integer> cols = new ArrayList<>();          @@init
    place(n, 0, cols);
    return cols;
}

static boolean attacked(List<Integer> cols, int row, int col) {
    for (int r = 0; r < row; r++)
        if (cols.get(r) == col || Math.abs(cols.get(r) - col) == row - r) return true;
    return false;
}

static boolean place(int n, int row, List<Integer> cols) {
    if (row == n) return true;                       @@done
    for (int col = 0; col < n; col++) {
        if (attacked(cols, row, col)) continue;
        cols.add(col);                               @@place
        if (place(n, row + 1, cols)) return true;
        cols.remove(cols.size() - 1);                @@remove
    }
    return false;                                    @@dead
}
`,
    javascript: `
function solveQueens(n) {
  const cols = [];                                   @@init
  const attacked = (row, col) =>
    cols.some((c, r) => c === col || Math.abs(c - col) === row - r);

  function place(row) {
    if (row === n) return true;                      @@done
    for (let col = 0; col < n; col++) {
      if (attacked(row, col)) continue;
      cols.push(col);                                @@place
      if (place(row + 1)) return true;
      cols.pop();                                    @@remove
    }
    return false;                                    @@dead
  }

  place(0);
  return cols;
}
`,
  },
  makeInput: (n) => ({ n }),
  run({ n }) {
    const t = new GridTracer(n, n, { rowHeaders: numbers(n), colHeaders: numbers(n) });
    const cols: number[] = [];
    const attacks = (row: number, col: number) => cols.some((c, r) => c === col || Math.abs(c - col) === row - r);

    const paint = () =>
      fillBoard(t, (r, c) => {
        if (cols[r] === c) return ["♛", "frontier"];
        return ["", r >= cols.length && attacks(r, c) ? "blocked" : undefined];
      });
    const show = (line: string, note: string, extra: Parameters<GridTracer["step"]>[2] = {}) => {
      t.aux = { title: "Queens", items: cols.map((c, r) => `r${r + 1}c${c + 1}`) };
      t.step(line, note, extra);
    };

    paint();
    show("init", `An empty ${n} × ${n} board. Place one queen per row from the top, trying columns from the left.`);

    const place = (row: number): boolean => {
      if (row === n) {
        cols.forEach((c, r) => t.set(r, c, "♛", "result"));
        t.answer = answerOf(cols);
        show("done", `All ${n} rows have a queen and none attacks another.`);
        return true;
      }
      let from = 0;
      for (let col = 0; col < n; col++) {
        if (attacks(row, col)) continue;
        const skipped = col - from;
        from = col + 1;
        cols.push(col);
        paint();
        const skip = skipped ? `${skipped} attacked ${skipped === 1 ? "square is" : "squares are"} skipped. ` : "";
        show("place", `Row ${row + 1}: ${skip}Column ${col + 1} is safe, so the queen goes there.`, { current: [row, col], vars: { row: row + 1, col: col + 1 } });
        if (place(row + 1)) return true;
        cols.pop();
        paint();
        t.set(row, col, "×");
        show("remove", `Take the queen back out of ${where(row, col)} and try the next safe column to its right.`, {
          current: [row, col],
          vars: { row: row + 1, col: col + 1 },
        });
      }
      paint();
      const rowCells: [Coord, "conflict"][] = Array.from({ length: n }, (_, c) => [[row, c], "conflict"]);
      show("dead", `Row ${row + 1} has no safe square left, so the search backs up to row ${row}.`, { marks: rowCells, vars: { row: row + 1 } });
      return false;
    };

    place(0);
    return t.frames;
  },
  solve({ n }) {
    const first = (cols: number[], taken: number, down: number, up: number): number[] | null => {
      const row = cols.length;
      if (row === n) return cols;
      for (let c = 0; c < n; c++) {
        const d = row + c;
        const u = row - c + n;
        if (taken & (1 << c) || down & (1 << d) || up & (1 << u)) continue;
        const found = first([...cols, c], taken | (1 << c), down | (1 << d), up | (1 << u));
        if (found) return found;
      }
      return null;
    };
    return answerOf(first([], 0, 0, 0)!);
  },
};
