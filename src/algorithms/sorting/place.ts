import type { ArrayTracer } from "../../core/trace";
import type { ArrayItem, BarMark } from "../../core/types";

/** Writes `item` to index `to` through `ArrayTracer.set`. The bar that sat there takes the vacated slot so every frame still holds each bar once; `marks` fades that bar and `aside` explains it, because real counting and radix sort write into a separate output and swap nothing. */
export function placeAt(t: ArrayTracer, item: ArrayItem, to: number) {
  const from = t.items.indexOf(item);
  t.set(from, t.items[to]);
  t.set(to, item);
  const marks: Partial<Record<number, BarMark>> = {};
  if (from === to) return { marks, aside: "" };
  marks[from] = "muted";
  return { marks, aside: `; the bar that sat there is faded and moved aside to index ${from} only because this picture reuses one row for the output` };
}
