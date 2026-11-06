import { edgeKey, type Graph, type GraphFrame } from "../core/types";

type Props = {
  graph: Graph;
  frame: GraphFrame;
  start?: number;
  weighted: boolean;
  goal?: string | number;
  directed: boolean;
  onPickStart?: (id: number) => void;
};

const R = 22;

export function GraphView({ graph, frame, start, weighted, goal, directed, onPickStart }: Props) {
  const xs = graph.nodes.map((n) => n.x);
  const ys = graph.nodes.map((n) => n.y);
  const pad = R + 16;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const viewBox = `${minX} ${minY} ${Math.max(...xs) + pad - minX} ${Math.max(...ys) + pad + 20 - minY}`;
  return (
    <svg className="graph-view" viewBox={viewBox} role="img" aria-label="Graph">
      {graph.edges.map(({ u, v, w }) => {
        const a = graph.nodes[u];
        const b = graph.nodes[v];
        const key = edgeKey(u, v);
        return (
          <g key={key} className="edge" data-mark={frame.edges[key] ?? "idle"}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            {directed && (
              <g transform={`translate(${b.x} ${b.y}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI})`}>
                <path className="arrow" d="M0 0L-14 -7L-14 7Z" />
              </g>
            )}
            {weighted && (
              <text className="weight" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} dy="-6">
                {frame.edgeLabels?.[key] ?? w}
              </text>
            )}
          </g>
        );
      })}
      {graph.nodes.map((n) => (
        <g
          key={n.id}
          className="node"
          data-mark={frame.nodes[n.id] ?? "idle"}
          data-start={n.id === start || undefined}
          data-goal={n.name === goal || undefined}
          data-static={!onPickStart || undefined}
          onClick={() => onPickStart?.(n.id)}
          transform={`translate(${n.x} ${n.y})`}
        >
          {onPickStart && <title>{`Start from ${n.name}`}</title>}
          <circle r={R} />
          <text className="name" dy="5">
            {n.name}
          </text>
          {frame.labels[n.id] !== undefined && (
            <text className="label" dy={R + 18}>
              {frame.labels[n.id]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
