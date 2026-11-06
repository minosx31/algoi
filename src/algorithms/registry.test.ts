import { describe, expect, test } from "bun:test";
import { ALGORITHMS } from "./index";
import { labelsOf } from "../core/code";
import { GRAPH_LAYOUTS, buildGraph, randomArray, withRandomWeights } from "../core/inputs";
import { LANGUAGES, TOPIC_LABELS, edgeKey, type Graph, type GraphFrame } from "../core/types";
import { VIEWS, viewOf } from "../core/views";

function framesOf(algo: (typeof ALGORITHMS)[number]) {
  if (algo.kind === "sorting") return algo.run(randomArray(12));
  if (algo.kind === "graph") return algo.run(withRandomWeights(buildGraph("mesh")), 0);
  return viewOf(algo).run(algo, viewOf(algo).largestInput(algo));
}

function shortestHops(g: Graph, s: number) {
  const adj = g.nodes.map(() => [] as number[]);
  for (const { u, v } of g.edges) adj[u].push(v), adj[v].push(u);
  const dist: Record<number, number> = { [s]: 0 };
  const q = [s];
  while (q.length) {
    const u = q.shift()!;
    for (const v of adj[u]) if (!(v in dist)) (dist[v] = dist[u] + 1), q.push(v);
  }
  return dist;
}

function shortestWeighted(g: Graph, s: number) {
  const n = g.nodes.length;
  const d = Array(n).fill(Infinity);
  d[s] = 0;
  for (let k = 0; k < n; k++)
    for (const { u, v, w } of g.edges) {
      d[v] = Math.min(d[v], d[u] + w);
      d[u] = Math.min(d[u], d[v] + w);
    }
  return d;
}

function connected(g: Graph, without: { edge?: number; node?: number }) {
  const adj = g.nodes.map(() => [] as number[]);
  g.edges.forEach(({ u, v }, i) => {
    if (i === without.edge || u === without.node || v === without.node) return;
    adj[u].push(v), adj[v].push(u);
  });
  const rest = g.nodes.map((n) => n.id).filter((id) => id !== without.node);
  const seen = new Set([rest[0]]);
  const stack = [rest[0]];
  while (stack.length) for (const v of adj[stack.pop()!]) if (!seen.has(v)) seen.add(v), stack.push(v);
  return seen.size === rest.length;
}

function mstWeight(g: Graph) {
  const key = (u: number, v: number) => g.edges.filter((e) => edgeKey(e.u, e.v) === edgeKey(u, v)).map((e) => e.w)[0] ?? Infinity;
  const best = g.nodes.map((_, i) => (i === 0 ? 0 : key(0, i)));
  const done = new Set([0]);
  let total = 0;
  while (done.size < g.nodes.length) {
    const next = g.nodes.map((n) => n.id).filter((i) => !done.has(i)).sort((a, b) => best[a] - best[b])[0];
    total += best[next];
    done.add(next);
    for (const n of g.nodes) if (!done.has(n.id)) best[n.id] = Math.min(best[n.id], key(next, n.id));
  }
  return total;
}

function twoColourable(g: Graph) {
  const adj = g.nodes.map(() => [] as number[]);
  for (const { u, v } of g.edges) adj[u].push(v), adj[v].push(u);
  const colour: Record<number, number> = { 0: 0 };
  const q = [0];
  while (q.length) {
    const u = q.shift()!;
    for (const v of adj[u]) {
      if (!(v in colour)) (colour[v] = 1 - colour[u]), q.push(v);
      else if (colour[v] === colour[u]) return false;
    }
  }
  return true;
}

const treeEdges = (g: Graph, last: GraphFrame) => g.edges.filter((e) => last.edges[edgeKey(e.u, e.v)] === "tree");

function expectSpanningTree(g: Graph, _start: number, last: GraphFrame) {
  const tree = treeEdges(g, last);
  expect(tree.length).toBe(g.nodes.length - 1);
  expect(tree.reduce((sum, e) => sum + e.w, 0)).toBe(mstWeight(g));
}

type Oracle = (g: Graph, start: number, last: GraphFrame) => void;

const GRAPH_ORACLES: Record<string, Oracle> = {
  bfs: (g, start, last) => {
    const want = shortestHops(g, start);
    for (const node of g.nodes) expect(last.labels[node.id]).toBe(String(want[node.id]));
  },
  dijkstra: (g, start, last) => {
    const want = shortestWeighted(g, start);
    for (const node of g.nodes) expect(last.labels[node.id]).toBe(String(want[node.id]));
  },
  "bellman-ford": (g, start, last) => {
    const want = shortestWeighted(g, start);
    for (const node of g.nodes) expect(last.labels[node.id]).toBe(String(want[node.id]));
  },
  "a-star": (g, start, last) => {
    const far = (a: number, b: number) => Math.hypot(g.nodes[a].x - g.nodes[b].x, g.nodes[a].y - g.nodes[b].y);
    const goal = g.nodes.map((n) => n.id).reduce((best, id) => (far(start, id) > far(start, best) ? id : best), start);
    const want = shortestWeighted(g, start)[goal];
    expect(last.nodes[goal]).toBe("visited");
    expect(last.labels[goal]).toBe(String(want));
    const path = treeEdges(g, last);
    expect(path.reduce((sum, e) => sum + e.w, 0)).toBe(want);
    const degree: Record<number, number> = {};
    for (const { u, v } of path) (degree[u] = (degree[u] ?? 0) + 1), (degree[v] = (degree[v] ?? 0) + 1);
    expect(degree[start]).toBe(1);
    expect(degree[goal]).toBe(1);
    for (const [id, d] of Object.entries(degree)) if (+id !== start && +id !== goal) expect(d).toBe(2);
  },
  prim: expectSpanningTree,
  kruskal: expectSpanningTree,
  bridges: (g, _, last) => {
    const bridges = g.edges.filter((_, i) => !connected(g, { edge: i }));
    expect(treeEdges(g, last)).toEqual(bridges);
    for (const node of g.nodes) expect(last.labels[node.id]!.endsWith(" AP")).toBe(!connected(g, { node: node.id }));
  },
  bipartite: (g, _, last) => {
    const ok = twoColourable(g);
    expect(last.vars?.bipartite).toBe(ok ? "yes" : "no");
    const clashes = g.edges.filter((e) => last.labels[e.u] === last.labels[e.v]);
    expect(clashes.length === 0).toBe(ok);
  },
};

const ids = ALGORITHMS.map((a) => a.id);

test("every layout is connected and has at most 12 named nodes", () => {
  for (const { id } of GRAPH_LAYOUTS)
    for (let k = 0; k < 20; k++) {
      const g = buildGraph(id);
      expect(g.nodes.length).toBeLessThanOrEqual(12);
      expect(Object.keys(shortestHops(g, 0)).length).toBe(g.nodes.length);
    }
});

test("every algorithm documents summary, invariants, complexity, and use cases", () => {
  for (const a of ALGORITHMS) {
    expect(a.about.summary.length).toBeGreaterThan(0);
    expect(a.about.invariants.length).toBeGreaterThan(0);
    expect(a.about.useCases.length).toBeGreaterThan(0);
    for (const v of Object.values(a.complexity)) expect(v).toMatch(/^O\(/);
  }
});

test("every algorithm has a topic with a label, and every topic has an algorithm", () => {
  for (const a of ALGORITHMS) expect(TOPIC_LABELS[a.topic]).toBeTruthy();
  for (const topic of Object.keys(TOPIC_LABELS)) expect(ALGORITHMS.some((a) => a.topic === topic)).toBe(true);
});

test("every kind has a VIEWS row", () => {
  for (const a of ALGORITHMS) expect(VIEWS[a.kind]).toBeDefined();
});

test("algorithm ids are unique", () => {
  expect(new Set(ids).size).toBe(ids.length);
});

describe.each(ALGORITHMS.map((a) => [a.id, a] as const))("%s", (_, algo) => {
  test("every traced line exists in every language", () => {
    const used = new Set(framesOf(algo).map((f) => f.line));
    for (const lang of LANGUAGES) {
      const labels = labelsOf(algo.code[lang.id]);
      const missing = [...used].filter((l) => !labels.has(l));
      expect({ lang: lang.id, missing }).toEqual({ lang: lang.id, missing: [] });
    }
  });

  if (algo.kind === "sorting") {
    test("sorts random arrays, keeps every item, and ends fully marked sorted", () => {
      for (const n of [0, 1, 2, 7, 25]) {
        const input = randomArray(n);
        const frames = algo.run(input);
        expect(frames.length).toBeGreaterThan(0);
        const last = frames[frames.length - 1];
        expect(last.items.map((i) => i.value)).toEqual([...input].sort((a, b) => a - b));
        expect(last.items.map((i) => i.id).sort((a, b) => a - b)).toEqual(input.map((_, i) => i));
        for (let i = 0; i < n; i++) expect(last.marks[i]).toBe("sorted");
        for (const f of frames) expect(new Set(f.items.map((x) => x.id)).size).toBe(n);
      }
    });
  } else if (algo.kind === "graph") {
    test.each(GRAPH_LAYOUTS.map((l) => l.id))("visits everything with correct final labels on %s", (layout) => {
      for (const start of [0, 5, 9]) {
        const g = withRandomWeights(buildGraph(layout));
        const frames = algo.run(g, start);
        const last = frames[frames.length - 1];
        if (!algo.stopsAtGoal) for (const node of g.nodes) expect(last.nodes[node.id]).toBe("visited");
        GRAPH_ORACLES[algo.id]?.(g, start, last);
      }
    });
  }
});
