import { describe, expect, test } from "bun:test";
import { ALGORITHMS } from "./index";
import { labelsOf } from "../core/code";
import { buildGraph, layoutsOf, randomArray, withRandomWeights } from "../core/inputs";
import { LANGUAGES, TOPIC_LABELS, edgeKey, type Graph, type GraphFrame } from "../core/types";
import { VIEWS, viewOf } from "../core/views";

function framesOf(algo: (typeof ALGORITHMS)[number]) {
  if (algo.kind === "sorting") return algo.run(randomArray(12));
  if (algo.kind === "graph") return algo.run(withRandomWeights(buildGraph("mesh", algo.directed)), 0);
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

function outEdges(g: Graph) {
  const out = g.nodes.map(() => [] as number[]);
  for (const { u, v } of g.edges) out[u].push(v);
  return out;
}

function hasDirectedCycle(g: Graph) {
  const out = outEdges(g);
  const left = new Set(g.nodes.map((n) => n.id));
  let sink: number | undefined;
  while ((sink = [...left].find((u) => out[u].every((v) => !left.has(v)))) !== undefined) left.delete(sink);
  return left.size > 0;
}

function kosaraju(g: Graph) {
  const out = outEdges(g);
  const into = g.nodes.map(() => [] as number[]);
  for (const { u, v } of g.edges) into[v].push(u);
  const finish: number[] = [];
  const seen = new Set<number>();
  const dfs = (u: number, adj: number[][], sink: number[]) => {
    seen.add(u);
    for (const v of adj[u]) if (!seen.has(v)) dfs(v, adj, sink);
    sink.push(u);
  };
  for (const n of g.nodes) if (!seen.has(n.id)) dfs(n.id, out, finish);
  seen.clear();
  const parts: number[][] = [];
  for (const u of finish.reverse())
    if (!seen.has(u)) {
      const part: number[] = [];
      dfs(u, into, part);
      parts.push(part.sort((a, b) => a - b));
    }
  return parts.sort((a, b) => a[0] - b[0]);
}

function flowEndpoints(g: Graph, source: number) {
  const out = outEdges(g);
  const seen = new Set([source]);
  const stack = [source];
  while (stack.length) for (const v of out[stack.pop()!]) if (!seen.has(v)) seen.add(v), stack.push(v);
  const sink = Math.max(...[...seen].filter((i) => i !== source), -1);
  return { source, sink };
}

function minCut(g: Graph, source: number, sink: number) {
  const others = g.nodes.map((n) => n.id).filter((i) => i !== source && i !== sink);
  let best = Infinity;
  for (let mask = 0; mask < 2 ** others.length; mask++) {
    const side = new Set([source, ...others.filter((_, i) => mask & (1 << i))]);
    const cap = g.edges.filter((e) => side.has(e.u) && !side.has(e.v)).reduce((sum, e) => sum + e.w, 0);
    best = Math.min(best, cap);
  }
  return best;
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
  kahn: (g, _, last) => {
    const order = last.aux.items.map((name) => g.nodes.findIndex((n) => n.name === name));
    expect(order.length).toBe(g.nodes.length);
    for (const { u, v } of g.edges) expect(order.indexOf(u)).toBeLessThan(order.indexOf(v));
  },
  "cycle-detect": (g, _, last) => {
    const cyclic = hasDirectedCycle(g);
    expect(last.vars?.cycle).toBe(cyclic ? "yes" : "no");
    if (!cyclic) return;
    const cycle = treeEdges(g, last);
    expect(cycle.length).toBeGreaterThanOrEqual(2);
    for (const { u, v } of cycle) {
      expect(cycle.filter((e) => e.u === u).length).toBe(1);
      expect(cycle.filter((e) => e.v === v).length).toBe(1);
      expect(cycle.some((e) => e.u === v)).toBe(true);
    }
    expect(g.nodes.filter((n) => last.nodes[n.id] === "visited").length).toBe(cycle.length);
  },
  "tarjan-scc": (g, _, last) => {
    const groups = new Map<string, number[]>();
    for (const n of g.nodes) groups.set(last.labels[n.id]!, [...(groups.get(last.labels[n.id]!) ?? []), n.id]);
    const got = [...groups.values()].sort((a, b) => a[0] - b[0]);
    expect(got).toEqual(kosaraju(g));
  },
  "edmonds-karp": (g, start, last) => {
    const { source, sink } = flowEndpoints(g, start);
    const flow = last.vars?.flow;
    expect(flow).toBe(sink < 0 ? 0 : minCut(g, source, sink));
    const on = g.edges.map((e) => {
      const [f, c] = last.edgeLabels![edgeKey(e.u, e.v)]!.split("/").map(Number);
      expect(c).toBe(e.w);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(c);
      return { ...e, f };
    });
    const net = (i: number) => on.filter((e) => e.u === i).reduce((s, e) => s + e.f, 0) - on.filter((e) => e.v === i).reduce((s, e) => s + e.f, 0);
    expect(net(source)).toBe(flow as number);
    for (const n of g.nodes) if (n.id !== source && n.id !== sink) expect(net(n.id)).toBe(0);
    expect(treeEdges(g, last).length).toBe(on.filter((e) => e.f === e.w).length);
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
  for (const { id } of layoutsOf(true))
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
    const expectSorted = (input: number[]) => {
      const n = input.length;
      const frames = algo.run(input);
      expect(frames.length).toBeGreaterThan(0);
      const last = frames[frames.length - 1];
      expect(last.items.map((i) => i.value)).toEqual([...input].sort((a, b) => a - b));
      expect(last.items.map((i) => i.id).sort((a, b) => a - b)).toEqual(input.map((_, i) => i));
      for (let i = 0; i < n; i++) expect(last.marks[i]).toBe("sorted");
      for (const f of frames) expect(new Set(f.items.map((x) => x.id)).size).toBe(n);
    };

    test("sorts random arrays, keeps every item, and ends fully marked sorted", () => {
      const threeDistinct = Array.from({ length: 25 }, () => [10, 40, 70][Math.floor(Math.random() * 3)]);
      for (const input of [0, 1, 2, 7, 25].map((n) => randomArray(n)).concat([threeDistinct])) expectSorted(input);
    });

    test("sorts arrays containing zero", () => {
      for (const input of [[0], [0, 0, 0], [0, 5, 0, 3], [3, 0], [100, 0, 7, 0]]) expectSorted(input);
    });

    if (algo.id === "counting-sort" || algo.id === "radix-sort") {
      test("a write that displaces another bar fades it and says so", () => {
        const frames = algo.run(randomArray(25));
        expect(frames.some((f) => f.line === "copy")).toBe(true);
        const places = frames.filter((f) => f.line === "place" && f.note.startsWith("Write"));
        for (const f of places) expect(Object.values(f.marks).filter((m) => m === "muted").length).toBe(f.note.includes("moved aside") ? 1 : 0);
        expect(places.some((f) => f.note.includes("moved aside"))).toBe(true);
      });
    }
  } else if (algo.kind === "graph") {
    test.each(layoutsOf(!!algo.directed).map((l) => l.id))("visits everything with correct final labels on %s", (layout) => {
      for (const start of [0, 5, 9]) {
        const g = withRandomWeights(buildGraph(layout, algo.directed));
        const frames = algo.run(g, start);
        const last = frames[frames.length - 1];
        if (!algo.stopsAtGoal && !algo.stopsAtCycle) for (const node of g.nodes) expect(last.nodes[node.id]).toBe("visited");
        GRAPH_ORACLES[algo.id]?.(g, start, last);
      }
    });
  }
});

describe("directed inputs", () => {
  const byId = (id: string) => ALGORITHMS.find((a) => a.id === id)! as Extract<(typeof ALGORITHMS)[number], { kind: "graph" }>;

  test("only the new algorithms are directed, and undirected layouts stay the five originals", () => {
    expect(ALGORITHMS.filter((a) => a.kind === "graph" && a.directed).map((a) => a.id)).toEqual(["kahn", "cycle-detect", "tarjan-scc", "edmonds-karp"]);
    expect(layoutsOf(false).map((l) => l.id)).toEqual(["mesh", "grid", "tree", "ring", "random"]);
  });

  test.each(layoutsOf(true).map((l) => l.id))("%s: acyclic points forward, cyclic adds back edges without antiparallel pairs", (layout) => {
    for (let k = 0; k < 20; k++) {
      const forward = buildGraph(layout, "acyclic");
      expect(forward.edges.every((e) => e.u < e.v)).toBe(true);
      expect(hasDirectedCycle(forward)).toBe(false);
      const cyclic = buildGraph(layout, "cyclic");
      expect(hasDirectedCycle(cyclic)).toBe(true);
      expect(new Set(cyclic.edges.map((e) => edgeKey(e.u, e.v))).size).toBe(cyclic.edges.length);
    }
  });

  test("cycle detection reports no cycle on a DAG and visits every node", () => {
    const g = buildGraph("dag", "acyclic");
    const last = byId("cycle-detect").run(g, 0).at(-1)!;
    expect(last.vars?.cycle).toBe("no");
    for (const n of g.nodes) expect(last.nodes[n.id]).toBe("visited");
  });

  test("Kahn stops short on a cyclic graph and says so", () => {
    const g = buildGraph("mesh", "cyclic");
    const last = byId("kahn").run(g, 0).at(-1)!;
    expect(last.aux.items.length).toBeLessThan(g.nodes.length);
    expect(last.note).toContain("cycle");
  });

  test("parallel edges in one direction add their capacities", () => {
    const g: Graph = {
      nodes: ["A", "B"].map((name, id) => ({ id, name, x: id * 100, y: 0 })),
      edges: [
        { u: 0, v: 1, w: 2 },
        { u: 0, v: 1, w: 3 },
      ],
    };
    expect(byId("edmonds-karp").run(g, 0).at(-1)!.vars?.flow).toBe(5);
  });

  test("a start that reaches nothing gives zero flow", () => {
    const g = buildGraph("mesh", "acyclic");
    expect(byId("edmonds-karp").run(g, 9).at(-1)!.vars?.flow).toBe(0);
  });

  test("an undirected run draws no edge labels", () => {
    for (const a of ALGORITHMS) if (a.kind === "graph" && !a.directed) expect(a.run(buildGraph("mesh"), 0).some((f) => f.edgeLabels)).toBe(false);
  });
});
