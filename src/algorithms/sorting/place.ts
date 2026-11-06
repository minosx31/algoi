import type { ArrayTracer } from "../../core/trace";
import type { ArrayItem } from "../../core/types";

/** Writes `item` to index `to` through `ArrayTracer.set`. The bar that sat there takes the vacated slot, so every frame still holds each bar once. */
export function placeAt(t: ArrayTracer, item: ArrayItem, to: number) {
  const from = t.items.indexOf(item);
  t.set(from, t.items[to]);
  t.set(to, item);
}
