import { edgeKey, type Graph, type GraphFrame } from "../core/types";

type Props = {
  graph: Graph;
  frame: GraphFrame;
  start: number;
  weighted: boolean;
  onPickStart: (id: number) => void;
};

const R = 22;

export function GraphView({ graph, frame, start, weighted, onPickStart }: Props) {
  return (
    <svg className="graph-view" viewBox="20 0 640 440" role="img" aria-label="Graph">
      {graph.edges.map(({ u, v, w }) => {
        const a = graph.nodes[u];
        const b = graph.nodes[v];
        const key = edgeKey(u, v);
        return (
          <g key={key} className="edge" data-mark={frame.edges[key] ?? "idle"}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            {weighted && (
              <text className="weight" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} dy="-6">
                {w}
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
          onClick={() => onPickStart(n.id)}
          transform={`translate(${n.x} ${n.y})`}
        >
          <title>{`Start from ${n.name}`}</title>
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
