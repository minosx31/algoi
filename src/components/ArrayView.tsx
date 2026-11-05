import type { ArrayFrame } from "../core/types";

export function ArrayView({ frame, max }: { frame: ArrayFrame; max: number }) {
  const n = frame.items.length;
  const slots = frame.items.map((item, i) => ({ item, i }));
  // Render in id order so React keeps each bar's DOM node; position comes from the slot index.
  slots.sort((a, b) => a.item.id - b.item.id);
  return (
    <div className="array-view" role="img" aria-label={`Array: ${frame.items.map((x) => x.value).join(", ")}`}>
      {slots.map(({ item, i }) => (
        <div
          key={item.id}
          className="bar"
          data-mark={frame.marks[i] ?? "idle"}
          style={{
            width: `${100 / n}%`,
            transform: `translateX(${i * 100}%)`,
            height: `${Math.max(4, (item.value / max) * 100)}%`,
          }}
        >
          {n <= 24 && <span>{item.value}</span>}
        </div>
      ))}
    </div>
  );
}
