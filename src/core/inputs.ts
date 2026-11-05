import type { Graph } from "./types";

export function randomArray(n: number, max = 100): number[] {
  return Array.from({ length: n }, () => 5 + Math.floor(Math.random() * (max - 5)));
}

const NAMES = "ABCDEFGHIJ".split("");
const POSITIONS: [number, number][] = [
  [80, 80], [260, 50], [440, 90], [600, 60],
  [140, 230], [330, 210], [520, 240],
  [70, 380], [270, 370], [470, 390],
];
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [2, 6], [3, 6],
  [4, 5], [5, 6], [4, 7], [4, 8], [5, 8], [6, 9], [8, 9], [7, 8],
];

export function sampleGraph(randomWeights = false): Graph {
  return {
    nodes: POSITIONS.map(([x, y], id) => ({ id, name: NAMES[id], x, y })),
    edges: EDGES.map(([u, v]) => ({ u, v, w: randomWeights ? 1 + Math.floor(Math.random() * 9) : defaultWeight(u, v) })),
  };
}

function defaultWeight(u: number, v: number) {
  const [ax, ay] = POSITIONS[u];
  const [bx, by] = POSITIONS[v];
  return Math.max(1, Math.round(Math.hypot(ax - bx, ay - by) / 30));
}
