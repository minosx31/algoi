import { edgeKey, type TreeFrame, type TreeNode } from "../core/types";

const W = 640;
const H = 360;
const PAD = 30;
const UNIT_MAX = 52;
const ROW_MAX = 68;
const ARRAY_ROW = 64;
const CAPTION_ROOM = 22;
const CELL_MAX = 44;
const R = 18;

/** Smallest centre-to-centre distance `layoutTree` keeps between nodes, in viewBox units, for the inputs the tree row generates. */
export const MIN_NODE_DISTANCE = 56;

/**
 * Tidy layered layout. A `null` child takes one slot and a childless node two, as a binary leaf with two `null` children does.
 * A parent sits midway between its first and last child, and roots of a forest sit side by side. Same-row nodes end up at least two slots apart.
 */
export function layoutTree(frame: TreeFrame): Map<number, { x: number; y: number }> {
  const byId = new Map(frame.nodes.map((n) => [n.id, n]));
  const slots: [id: number, x: number, depth: number][] = [];
  let width = 0;
  let depth = 0;
  const place = (id: number | null, d: number): number => {
    if (id === null) return width++ + 0.5;
    depth = Math.max(depth, d);
    const xs = byId.get(id)!.children.map((c) => place(c, d + 1));
    const x = xs.length === 0 ? (width += 2) - 1 : (xs[0] + xs[xs.length - 1]) / 2;
    slots.push([id, x, d]);
    return x;
  };
  for (const root of frame.roots) place(root, 0);
  const unit = Math.min(UNIT_MAX, (W - 2 * PAD) / Math.max(1, width));
  const left = (W - unit * width) / 2;
  const below = frame.array ? ARRAY_ROW : frame.nodes.some((n) => n.caption) ? CAPTION_ROOM : 0;
  const row = Math.min(ROW_MAX, (H - 2 * PAD - below) / Math.max(1, depth));
  return new Map(slots.map(([id, x, d]) => [id, { x: left + x * unit, y: PAD + d * row }]));
}

export function TreeView({ frame }: { frame: TreeFrame }) {
  const pos = layoutTree(frame);
  const edges = frame.nodes.flatMap((n) => n.children.flatMap((c) => (c === null ? [] : [[n.id, c] as const])));
  return (
    <svg className="tree-view" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tree">
      {edges.map(([u, v]) => {
        const a = pos.get(u)!;
        const b = pos.get(v)!;
        const d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
        return <path key={edgeKey(u, v)} className="tree-edge" d={d} style={{ d: `path("${d}")` }} />;
      })}
      {frame.nodes.map((n) => {
        const { x, y } = pos.get(n.id)!;
        return (
          <g key={n.id} className="tree-node" data-mark={n.mark ?? "idle"} style={{ transform: `translate(${x}px, ${y}px)` }}>
            <circle r={R} />
            <text dy="5">{n.value}</text>
          </g>
        );
      })}
      {frame.nodes.map((n) => {
        if (!n.caption) return null;
        const { x, y } = pos.get(n.id)!;
        return (
          <g key={n.id} className="tree-label" style={{ transform: `translate(${x}px, ${y}px)` }}>
            <text y={R + 14}>{n.caption}</text>
          </g>
        );
      })}
      {frame.array && <ArrayRow ids={frame.array} nodes={frame.nodes} />}
    </svg>
  );
}

function ArrayRow({ ids, nodes }: { ids: number[]; nodes: TreeNode[] }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const cell = Math.min(CELL_MAX, (W - 2 * PAD) / Math.max(1, ids.length));
  const left = (W - cell * ids.length) / 2;
  const top = H - ARRAY_ROW + 4;
  return (
    <g className="tree-array">
      {ids.map((_, i) => (
        <text key={i} className="tree-index" x={left + (i + 0.5) * cell} y={top + 48}>
          {i}
        </text>
      ))}
      {ids.map((id, i) => {
        const node = byId.get(id)!;
        return (
          <g key={id} className="tree-cell" data-mark={node.mark ?? "idle"} style={{ transform: `translate(${left + i * cell}px, ${top}px)` }}>
            <rect x={2} width={cell - 4} height={32} rx={4} />
            <text x={cell / 2} y={21}>
              {node.value}
            </text>
          </g>
        );
      })}
    </g>
  );
}
