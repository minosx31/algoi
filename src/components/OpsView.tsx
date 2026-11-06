import { useEffect, useRef, type CSSProperties } from "react";
import type { Cell, OpsFrame, RingPoint } from "../core/types";

export function OpsView({ frame }: { frame: OpsFrame }) {
  return (
    <div className="ops-view">
      <div className="ops-rows">
        {frame.rows.map((row) =>
          "cells" in row ? (
            <CellRow key={row.title} title={row.title} cells={row.cells} />
          ) : (
            <Ring key={row.title} title={row.title} nodes={row.ring.nodes} keys={row.ring.keys} />
          ),
        )}
      </div>
      <OpsLog log={frame.log} at={frame.at} />
    </div>
  );
}

function CellRow({ title, cells }: { title: string; cells: Cell[] }) {
  // Render in id order so React keeps each cell's DOM node; position comes from the slot index.
  const slots = cells.map((cell, i) => ({ cell, i })).sort((a, b) => a.cell.id.localeCompare(b.cell.id));
  return (
    <div className="ops-row">
      <h3>{title}</h3>
      <div className="cells" style={{ "--n": cells.length } as CSSProperties}>
        {slots.map(({ cell, i }) => (
          <div
            key={cell.id}
            className="cell"
            data-mark={cell.mark ?? "idle"}
            data-blank={cell.text === "" || undefined}
            style={{ "--i": i } as CSSProperties}
          >
            {cell.text}
            {cell.sub !== undefined && <small>{cell.sub}</small>}
          </div>
        ))}
      </div>
    </div>
  );
}

const R = 104;

const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)] as const;
};

function arc(from: number, to: number) {
  const sweep = (to - from + 360) % 360;
  const [x0, y0] = polar(from, R);
  const [x1, y1] = polar(to, R);
  return `M${x0} ${y0} A${R} ${R} 0 ${sweep > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

const near = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b)) < 24;

/** Each key takes the outermost of three inner rings with no other key within 24°, so clustered labels do not overlap. */
function ringTiers(keys: RingPoint[]) {
  const placed: { angle: number; tier: number }[] = [];
  return keys.map(({ angle }) => {
    let tier = 0;
    while (tier < 2 && placed.some((p) => p.tier === tier && near(p.angle, angle))) tier++;
    placed.push({ angle, tier });
    return tier;
  });
}

function Ring({ title, nodes, keys }: { title: string; nodes: RingPoint[]; keys: RingPoint[] }) {
  const ring = [...nodes].sort((a, b) => a.angle - b.angle);
  const inner = [...keys].sort((a, b) => a.angle - b.angle);
  const tiers = ringTiers(inner);
  return (
    <figure className="ops-ring">
      <figcaption>{title}</figcaption>
      <svg viewBox="-150 -150 300 300" role="img" aria-label={title}>
        <circle className="ring-track" r={R} />
        {ring.length === 1 && <circle className="ring-arc" data-tone={ring[0].tone} r={R} />}
        {ring.length > 1 &&
          ring.map((n, i) => (
            <path key={n.id} className="ring-arc" data-tone={n.tone} d={arc(ring[(i + ring.length - 1) % ring.length].angle, n.angle)} />
          ))}
        {inner.map((k, i) => {
          const r = R - 30 - tiers[i] * 26;
          const [x, y] = polar(k.angle, r);
          const [tx, ty] = polar(k.angle, R);
          return (
            <g key={k.id} className="ring-point" data-mark={k.mark ?? "idle"} data-tone={k.tone}>
              <line className="ring-tick" x1={tx} y1={ty} x2={x} y2={y} />
              <circle cx={x} cy={y} r={6} />
              <text x={x} y={y - 11}>
                {k.text}
              </text>
            </g>
          );
        })}
        {ring.map((n) => {
          const [x, y] = polar(n.angle, R);
          const [lx, ly] = polar(n.angle, R + 22);
          return (
            <g key={n.id} className="ring-point" data-mark={n.mark ?? "idle"} data-tone={n.tone}>
              <circle cx={x} cy={y} r={8} />
              <text x={lx} y={ly + 4}>
                {n.text}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function OpsLog({ log, at }: { log: OpsFrame["log"]; at: number }) {
  const listRef = useRef<HTMLOListElement>(null);

  // Scroll only the log; scrollIntoView would also scroll the page away from the visualization.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[at] as HTMLElement | undefined;
    if (!list || !item) return;
    list.scrollTo({ top: item.offsetTop - list.clientHeight / 3, left: item.offsetLeft - list.clientWidth / 3 });
  }, [at, log]);

  return (
    <ol ref={listRef} className="ops-log" aria-label="Operations">
      {log.map((entry, i) => (
        <li key={i} data-mark={entry.result === undefined ? "pending" : "done"} aria-current={i === at ? "step" : undefined}>
          <span>{entry.op}</span>
          {entry.result !== undefined && <b>{entry.result}</b>}
        </li>
      ))}
    </ol>
  );
}
