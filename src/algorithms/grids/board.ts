import type { GridTracer } from "../../core/trace";
import type { CellMark, Coord } from "../../core/types";

/** Up, right, down, left. */
export const STEPS: readonly Coord[] = [[-1, 0], [0, 1], [1, 0], [0, -1]];

export const inside = (rows: number, cols: number, r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;

export const numbers = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1));

export const where = (r: number, c: number) => `row ${r + 1}, column ${c + 1}`;

/** Boards have no unfilled cells, so every cell leaves "pending" before the first frame. */
export function fillBoard(t: GridTracer, cell: (r: number, c: number) => [text: string | number, mark?: CellMark]) {
  t.cells.forEach((row, r) => row.forEach((_, c) => t.set(r, c, ...cell(r, c))));
}

export const roll = (max: number) => Math.floor(Math.random() * max);

export function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = roll(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
