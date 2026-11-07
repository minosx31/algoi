import { describe, expect, test } from "bun:test";
import { ALGORITHMS } from "./index";
import { floydWarshall } from "./graph/floyd-warshall";
import { labelsOf } from "../core/code";
import { GRAPH_LAYOUTS, buildGraph, randomArray, withRandomWeights } from "../core/inputs";
import { LANGUAGES, TOPIC_LABELS, type Graph } from "../core/types";
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

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

test("floyd-warshall's final matrix matches shortestWeighted from every source", () => {
  for (const n of [4, 5, 6])
    for (let k = 0; k < 30; k++) {
      const g = floydWarshall.makeInput(n);
      const last = floydWarshall.run(g).at(-1)!;
      for (const { id: s } of g.nodes) {
        const want = shortestWeighted(g, s);
        expect(last.cells[s].map((c) => c.text)).toEqual(want.map(String));
      }
    }
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
        for (const node of g.nodes) expect(last.nodes[node.id]).toBe("visited");
        if (algo.id === "bfs") {
          const want = shortestHops(g, start);
          for (const node of g.nodes) expect(last.labels[node.id]).toBe(String(want[node.id]));
        }
        if (algo.id === "dijkstra") {
          const want = shortestWeighted(g, start);
          for (const node of g.nodes) expect(last.labels[node.id]).toBe(String(want[node.id]));
        }
      }
    });
  } else if (algo.kind === "grid") {
    test("ends on solve's answer with every cell filled, tracing only listed lines, on 200 seeded inputs", () => {
      const random = Math.random;
      Math.random = mulberry32(2026);
      try {
        const { min, max } = algo.size;
        const used = new Set<string>();
        for (let k = 0; k < 200; k++) {
          const input = algo.makeInput(min + (k % (max - min + 1)));
          const frames = algo.run(input);
          const last = frames[frames.length - 1];
          expect(last.answer).toBe(algo.solve(input));
          expect(last.cells.flat().filter((c) => c.mark === "pending")).toEqual([]);
          for (const f of frames) used.add(f.line);
        }
        for (const lang of LANGUAGES) {
          const missing = [...used].filter((l) => !labelsOf(algo.code[lang.id]).has(l));
          expect({ lang: lang.id, missing }).toEqual({ lang: lang.id, missing: [] });
        }
      } finally {
        Math.random = random;
      }
    });
  }
});
