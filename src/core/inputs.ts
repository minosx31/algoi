import type { Graph } from "./types";

export function randomArray(n: number, max = 100): number[] {
  return Array.from({ length: n }, () => 5 + Math.floor(Math.random() * (max - 5)));
}

type Point = [number, number];
type Shape = { points: Point[]; edges: [number, number][] };

const NAMES = "ABCDEFGHIJKL".split("");

function mesh(): Shape {
  return {
    points: [
      [80, 80], [260, 50], [440, 90], [600, 60],
      [140, 230], [330, 210], [520, 240],
      [70, 380], [270, 370], [470, 390],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [2, 6], [3, 6],
      [4, 5], [5, 6], [4, 7], [4, 8], [5, 8], [6, 9], [8, 9], [7, 8],
    ],
  };
}

function grid(): Shape {
  const cols = 4;
  const rows = 3;
  const points: Point[] = [];
  const edges: [number, number][] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      points.push([80 + c * 160, 60 + r * 150]);
      if (c > 0) edges.push([i - 1, i]);
      if (r > 0) edges.push([i - cols, i]);
    }
  return { points, edges };
}

function tree(): Shape {
  const n = 10;
  const points: Point[] = [];
  const edges: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const depth = Math.floor(Math.log2(i + 1));
    const slot = i + 1 - 2 ** depth;
    points.push([((slot + 0.5) / 2 ** depth) * 600 + 20, 50 + depth * 110]);
    if (i > 0) edges.push([Math.floor((i - 1) / 2), i]);
  }
  return { points, edges };
}

function ring(): Shape {
  const n = 10;
  const points: Point[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return [320 + 260 * Math.cos(a), 215 + 175 * Math.sin(a)];
  });
  const edges: [number, number][] = points.map((_, i) => [i, (i + 1) % n]);
  edges.push([0, 3], [5, 8], [2, 7]);
  return { points, edges };
}

function random(): Shape {
  const cells = Array.from({ length: 12 }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, 10).sort((a, b) => a - b);
  const points: Point[] = cells.map((cell) => [
    80 + (cell % 4) * 160 + (Math.random() - 0.5) * 80,
    60 + Math.floor(cell / 4) * 150 + (Math.random() - 0.5) * 60,
  ]);
  const dist = (a: number, b: number) => Math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1]);
  const pairs: [number, number][] = [];
  for (let a = 0; a < points.length; a++) for (let b = a + 1; b < points.length; b++) pairs.push([a, b]);
  pairs.sort((p, q) => dist(...p) - dist(...q));

  // Kruskal on Euclidean distance gives a connected, crossing-free spanning tree.
  const parent = points.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const edges: [number, number][] = [];
  for (const [a, b] of pairs) {
    if (find(a) !== find(b)) {
      parent[find(a)] = find(b);
      edges.push([a, b]);
    }
  }
  const extra = 3 + Math.floor(Math.random() * 3);
  for (const [a, b] of pairs) {
    if (edges.length >= points.length - 1 + extra) break;
    const exists = edges.some(([u, v]) => (u === a && v === b) || (u === b && v === a));
    if (!exists && !edges.some(([u, v]) => crosses(points, [a, b], [u, v]))) edges.push([a, b]);
  }
  return { points, edges };
}

function crosses(pts: Point[], [a, b]: [number, number], [c, d]: [number, number]) {
  if (a === c || a === d || b === c || b === d) return false;
  const orient = (p: Point, q: Point, r: Point) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return (
    orient(pts[a], pts[b], pts[c]) !== orient(pts[a], pts[b], pts[d]) &&
    orient(pts[c], pts[d], pts[a]) !== orient(pts[c], pts[d], pts[b])
  );
}

export const GRAPH_LAYOUTS = [
  { id: "mesh", label: "Mesh", build: mesh },
  { id: "grid", label: "Grid", build: grid },
  { id: "tree", label: "Tree", build: tree },
  { id: "ring", label: "Ring + chords", build: ring },
  { id: "random", label: "Random", build: random },
] as const;

export type LayoutId = (typeof GRAPH_LAYOUTS)[number]["id"];

export function buildGraph(layout: LayoutId): Graph {
  const { points, edges } = GRAPH_LAYOUTS.find((l) => l.id === layout)!.build();
  return {
    nodes: points.map(([x, y], id) => ({ id, name: NAMES[id], x, y })),
    edges: edges.map(([u, v]) => {
      const [ax, ay] = points[u];
      const [bx, by] = points[v];
      return { u, v, w: Math.max(1, Math.round(Math.hypot(ax - bx, ay - by) / 30)) };
    }),
  };
}

export function withRandomWeights(graph: Graph): Graph {
  return { ...graph, edges: graph.edges.map((e) => ({ ...e, w: 1 + Math.floor(Math.random() * 9) })) };
}

/**
 * Distinct keys from 1 to 99 in insertion order (n ≥ 3). Inserted into a BST they give a tree that fits the canvas,
 * a root with two children, a root successor reached by stepping left at least once (n ≥ 5), and a last key that is
 * a leaf other than that successor, so the BST page always shows a two-child delete and a leaf delete.
 */
export function randomKeys(n: number): number[] {
  for (;;) {
    const picked = new Set<number>();
    while (picked.size < n) picked.add(1 + Math.floor(Math.random() * 99));
    const keys = [...picked];
    const [root] = keys;
    const left = new Map<number, number>();
    const right = new Map<number, number>();
    const side = (key: number, parent: number) => (key < parent ? left : right);
    let height = 0;
    for (const key of keys.slice(1)) {
      let parent = root;
      let depth = 1;
      for (; side(key, parent).has(parent); depth++) parent = side(key, parent).get(parent)!;
      side(key, parent).set(parent, key);
      height = Math.max(height, depth);
    }
    const rootRight = right.get(root);
    let successor = rootRight;
    while (successor !== undefined && left.has(successor)) successor = left.get(successor)!;
    const drawable = height <= Math.ceil(Math.log2(n + 1)) + 1;
    const stepsLeft = n < 5 || (rootRight !== undefined && left.has(rootRight));
    if (drawable && stepsLeft && left.has(root) && rootRight !== undefined && successor !== keys[n - 1]) return keys;
  }
}
