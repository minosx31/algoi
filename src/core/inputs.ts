import type { Directed, Graph } from "./types";

export function randomArray(n: number, max = 100): number[] {
  return Array.from({ length: n }, () => 5 + Math.floor(Math.random() * (max - 5)));
}

const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

/**
 * A pattern with a border (so KMP has a non-zero failure value) and a text of
 * length n built from copies of it, near misses ending in "c", and random letters.
 * One copy is always planted, so every search finds at least one match.
 */
export function randomSearch(n: number): { text: string; pattern: string } {
  const word = (min: number, max: number) => Array.from({ length: min + Math.floor(Math.random() * (max - min + 1)) }, () => pick("ab")).join("");
  const border = word(1, 2);
  const pattern = border + word(1, 2) + border;
  let text = "";
  while (text.length < n) {
    const r = Math.random();
    text += r < 0.25 ? pattern : r < 0.5 ? pattern.slice(0, -1) + "c" : pick("abc");
  }
  const at = Math.floor(Math.random() * (n - pattern.length + 1));
  return { text: text.slice(0, at) + pattern + text.slice(at + pattern.length, n), pattern };
}

type Point = [number, number];
type Shape = { points: Point[]; edges: [number, number][]; weights?: number[] };

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

function dag(): Shape {
  return {
    points: [
      [60, 120], [60, 310],
      [230, 60], [230, 215], [230, 370],
      [410, 60], [410, 215], [410, 370],
      [590, 130], [590, 300],
    ],
    edges: [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [3, 6], [4, 6], [4, 7], [5, 8], [6, 8], [6, 9], [7, 9]],
  };
}

/** A flow network with its source (node 0) at the far left and its sink (node 9) at the far right. */
function flow(): Shape {
  return {
    points: [
      [50, 215],
      [200, 70], [200, 215], [200, 360],
      [370, 70], [370, 215], [370, 360],
      [500, 120], [500, 310],
      [620, 215],
    ],
    edges: [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 5], [3, 5], [3, 6], [4, 7], [5, 7], [5, 8], [6, 8], [7, 9], [8, 9]],
    weights: [10, 8, 10, 4, 6, 5, 4, 6, 4, 5, 6, 6, 9, 9],
  };
}

const DIRECTED_LAYOUTS = [
  { id: "dag", label: "Dependency DAG", build: dag },
  { id: "flow", label: "Flow network", build: flow },
] as const;

export type LayoutId = (typeof GRAPH_LAYOUTS)[number]["id"] | (typeof DIRECTED_LAYOUTS)[number]["id"];

/** The layouts a page offers. The DAG and flow layouts only make sense with arrows. */
export const layoutsOf = (directed: boolean): readonly { id: LayoutId; label: string; build: () => Shape }[] =>
  directed ? [...GRAPH_LAYOUTS, ...DIRECTED_LAYOUTS] : GRAPH_LAYOUTS;

const weightOf = (a: Point, b: Point) => Math.max(1, Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) / 30));

const reachable = (adj: number[][], from: number) => {
  const seen = new Set([from]);
  const stack = [from];
  while (stack.length) for (const v of adj[stack.pop()!]) if (!seen.has(v)) seen.add(v), stack.push(v);
  return seen;
};

const nearSegment = (p: Point, a: Point, b: Point) => {
  const len2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / len2));
  return Math.hypot(p[0] - (a[0] + t * (b[0] - a[0])), p[1] - (a[1] + t * (b[1] - a[1]))) < 40;
};

/**
 * Up to two back edges, each closing the shortest cycle it can: the pair whose forward paths cover the fewest nodes.
 * The two cycles share no node and no edge passes through another node, so the picture stays readable.
 */
function backEdges({ nodes, edges }: Graph): Graph["edges"] {
  const out = nodes.map(() => [] as number[]);
  const into = nodes.map(() => [] as number[]);
  for (const { u, v } of edges) out[u].push(v), into[v].push(u);
  const point = (i: number): Point => [nodes[i].x, nodes[i].y];
  const cycles: { a: number; b: number; path: number[] }[] = [];
  for (const { id: a } of nodes) {
    const down = reachable(out, a);
    for (const { id: b } of nodes) {
      if (b <= a || !down.has(b) || out[a].includes(b)) continue;
      if (nodes.some((n) => n.id !== a && n.id !== b && nearSegment(point(n.id), point(a), point(b)))) continue;
      const up = reachable(into, b);
      cycles.push({ a, b, path: [...down].filter((x) => up.has(x)) });
    }
  }
  cycles.sort((p, q) => p.path.length - q.path.length || p.a - q.a || p.b - q.b);
  const used = new Set<number>();
  const picked: typeof cycles = [];
  for (const c of cycles) {
    if (picked.length < 2 && c.path.every((x) => !used.has(x))) {
      picked.push(c);
      c.path.forEach((x) => used.add(x));
    }
  }
  return picked.map(({ a, b }) => ({ u: b, v: a, w: weightOf(point(b), point(a)) }));
}

/** An undirected layout with `directed` set becomes an arrow graph: low index to high, plus back edges when "cyclic". */
export function buildGraph(layout: LayoutId, directed?: Directed): Graph {
  const { points, edges, weights } = layoutsOf(true).find((l) => l.id === layout)!.build();
  const graph: Graph = {
    nodes: points.map(([x, y], id) => ({ id, name: NAMES[id], x, y })),
    edges: edges.map(([u, v], i) => ({ u, v, w: weights?.[i] ?? weightOf(points[u], points[v]) })),
  };
  if (!directed) return graph;
  const forward = { ...graph, edges: graph.edges.map((e) => (e.u < e.v ? e : { ...e, u: e.v, v: e.u })) };
  return directed === "cyclic" ? { ...forward, edges: [...forward.edges, ...backEdges(forward)] } : forward;
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
