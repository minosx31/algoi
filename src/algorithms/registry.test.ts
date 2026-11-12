import { describe, expect, test } from "bun:test";
import { ALGORITHMS } from "./index";
import { floydWarshall } from "./graph/floyd-warshall";
import { labelsOf } from "../core/code";
import { buildGraph, layoutsOf, randomArray, randomKeys, randomSearch, withRandomWeights } from "../core/inputs";
import { LANGUAGES, TOPIC_LABELS, edgeKey, type Graph, type GraphFrame, type ScanFrame, type ScanInput, type StringAlgorithm, type StringFrame, type StringMark, type TreeFrame } from "../core/types";
import { VIEWS, viewOf } from "../core/views";
import { MIN_NODE_DISTANCE, layoutTree } from "../components/TreeView";

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seeded<T>(seed: number, make: () => T): T {
  const random = Math.random;
  Math.random = mulberry32(seed);
  try {
    return make();
  } finally {
    Math.random = random;
  }
}

/** The array-scan batch, whose oracles also hold on all-equal and strictly increasing arrays (binary search and two-sum need distinct values). */
const EDGE_SHAPES: Record<string, (n: number) => number[]> = {
  "all-equal": (n) => Array(n).fill(7),
  "strictly increasing": (n) => Array.from({ length: n }, (_, i) => 5 + 2 * i),
};
const EDGE_ALGORITHMS = ["quickselect", "largest-rectangle", "trapping-rain-water", "min-window-sum", "majority-vote"];

const count = (frames: ScanFrame[], ...lines: string[]) => frames.filter((f) => lines.includes(f.line)).length;

/** The case each scan input should show most of the time, so a reader rarely gets a trace with nothing to see. */
const INTERESTING: Record<string, [label: string, holds: (input: ScanInput, frames: ScanFrame[]) => boolean]> = {
  "binary-search": ["finds the target after at least three probes", (_, frames) => count(frames, "found") === 1 && count(frames, "mid") >= 3],
  "two-sum-sorted": ["finds a pair after at least three pointer moves", (_, frames) => count(frames, "found") === 1 && count(frames, "inc", "dec") >= 3],
  "sliding-window-max": ["evicts a maximum from the front of the deque", (_, frames) => count(frames, "evict") > 0],
  kadane: [
    "mixes signs and the best run is neither one value nor the whole array",
    ({ values }, frames) => {
      const best = Object.values(frames[frames.length - 1].marks).filter((m) => m === "found").length;
      return values.some((v) => v < 0) && best > 1 && best < values.length;
    },
  ],
  "next-greater": [
    "keeps two or more values waiting and leaves an earlier value with -1",
    (_, frames) => {
      const last = frames[frames.length - 1];
      return frames.some((f) => f.aux!.indices.length >= 2) && (last.answer as number[]).slice(0, -1).includes(-1);
    },
  ],
  quickselect: ["needs at least two partition rounds", (_, frames) => count(frames, "place") >= 2],
  "largest-rectangle": [
    "pops bars and the best rectangle spans two or more bars",
    (_, frames) => {
      const best = frames[frames.length - 1].bands[0];
      return count(frames, "pop") > 0 && best !== undefined && best.to > best.from;
    },
  ],
  "trapping-rain-water": ["traps some water", (_, frames) => (frames[frames.length - 1].answer as number) > 0],
  "min-window-sum": ["finds a window and shrinks at least twice", (_, frames) => (frames[frames.length - 1].answer as number) > 0 && count(frames, "shrink") >= 2],
  "majority-vote": ["has a majority and cancels at least two pairs", (_, frames) => frames[frames.length - 1].answer !== -1 && count(frames, "differ") >= 2],
};

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
function inorder(f: TreeFrame) {
  const byId = new Map(f.nodes.map((n) => [n.id, n]));
  const out: number[] = [];
  const walk = (id: number | null) => {
    if (id === null) return;
    const n = byId.get(id)!;
    walk(n.children[0]);
    out.push(n.value as number);
    walk(n.children[1]);
  };
  f.roots.forEach(walk);
  return out;
}

function referenceOrders(keys: number[]) {
  const left = new Map<number, number>();
  const right = new Map<number, number>();
  for (const k of keys.slice(1)) {
    let p = keys[0];
    while ((k < p ? left : right).has(p)) p = (k < p ? left : right).get(p)!;
    (k < p ? left : right).set(p, k);
  }
  const orders: Record<string, number[]> = { Preorder: [], Inorder: [], Postorder: [], "Level-order": [] };
  const dfs = (k: number | undefined) => {
    if (k === undefined) return;
    orders.Preorder.push(k);
    dfs(left.get(k));
    orders.Inorder.push(k);
    dfs(right.get(k));
    orders.Postorder.push(k);
  };
  dfs(keys[0]);
  for (const queue = [keys[0]]; queue.length > 0; ) {
    const k = queue.shift()!;
    orders["Level-order"].push(k);
    for (const c of [left.get(k), right.get(k)]) if (c !== undefined) queue.push(c);
  }
  return orders;
}

const TREE_SIZES = [3, 4, 5, 9, 15];

const ids = ALGORITHMS.map((a) => a.id);

test("every layout is connected and has at most 12 named nodes", () => {
  for (const { id } of layoutsOf(true))
    for (let k = 0; k < 100; k++) {
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

test("kadane does not claim a zero sum would lower the next run", () => {
  const kadane = ALGORITHMS.find((a) => a.id === "kadane")!;
  if (kadane.kind !== "scan") throw new Error("kadane is a scan algorithm");
  const restarts = kadane.run({ values: [2, -2, 0, 4] }).filter((f) => f.line === "restart");
  expect(restarts.map((f) => f.note)).toEqual(["cur = 0 adds nothing to the next value, so start a new run at A[2]: cur = 0.", "cur = 0 adds nothing to the next value, so start a new run at A[3]: cur = 4."]);
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
  } else if (algo.kind === "scan") {
    const inputs = Array.from({ length: 200 }, (_, s) => seeded(s, () => algo.makeInput(1 + (s % 48))));

    test("matches the oracle on 200 seeded inputs, answering only at the last frame", () => {
      for (const input of inputs) {
        const before = JSON.stringify(input);
        const frames = algo.run(input);
        expect(JSON.stringify(input)).toBe(before);
        expect(frames.length).toBeGreaterThan(0);
        expect({ input, answer: frames[frames.length - 1].answer }).toEqual({ input, answer: algo.solve(input) });
        for (const f of frames.slice(0, -1)) expect(f.answer).toBeUndefined();
      }
    });

    if (EDGE_ALGORITHMS.includes(algo.id))
      test.each(Object.entries(EDGE_SHAPES))("matches the oracle on %s arrays of every size", (_, shape) => {
        for (let n = 1; n <= 48; n++)
          for (let s = 0; s < 4; s++) {
            const input = { ...seeded(s, () => algo.makeInput(n)), values: shape(n) };
            const frames = algo.run(input);
            expect({ input, answer: frames[frames.length - 1].answer }).toEqual({ input, answer: algo.solve(input) });
          }
      });

    if (algo.id === "trapping-rain-water")
      test("marks a bar active only while it is unsettled, and every settled bar muted or just settled", () => {
        for (const input of inputs)
          for (const f of algo.run(input)) {
            const { l, r } = f.pointers as { l: number; r: number };
            for (let i = 0; i < input.values.length; i++) {
              if (f.marks[i] === "active") {
                expect(f.labels[i]).toBeUndefined();
                expect(f.bands.some((b) => b.from <= i && i <= b.to)).toBe(false);
                expect(i > l && i < r).toBe(true);
              } else {
                expect(["muted", "compare"]).toContain(f.marks[i]!);
                expect(i <= l || i >= r).toBe(true);
              }
            }
          }
      });

    test("keeps every pointer on a declared name and inside the array", () => {
      for (const input of inputs)
        for (const f of algo.run(input))
          for (const [name, at] of Object.entries(f.pointers)) {
            expect(algo.pointers).toContain(name);
            expect(at! >= 0 && at! < input.values.length).toBe(true);
          }
    });

    test("legend names exactly the marks and bands its frames draw, and the label heading exists exactly when labels do", () => {
      const frames = inputs.flatMap((input) => algo.run(input));
      const drawn = new Set<string>(frames.flatMap((f) => Object.values(f.marks)));
      if (frames.some((f) => f.bands.length)) drawn.add("band");
      expect(algo.legend.map(([mark]) => mark).sort()).toEqual([...drawn].sort());
      for (const [, label] of algo.legend) expect(label.length).toBeGreaterThan(0);
      expect(!!algo.labelTitle).toBe(frames.some((f) => Object.keys(f.labels).length > 0));
    });

    test("tags every line any seeded input traces, in every language", () => {
      const used = new Set(inputs.flatMap((input) => algo.run(input).map((f) => f.line)));
      for (const lang of LANGUAGES) {
        const labels = labelsOf(algo.code[lang.id]);
        expect({ lang: lang.id, missing: [...used].filter((l) => !labels.has(l)) }).toEqual({ lang: lang.id, missing: [] });
      }
    });

    test(`at the initial size, gives at least 10 frames and ${INTERESTING[algo.id]?.[0] ?? "(no oracle entry)"} in 80% of seeds`, () => {
      const [, holds] = INTERESTING[algo.id];
      let hits = 0;
      for (let s = 0; s < 200; s++) {
        const input = seeded(1000 + s, () => viewOf(algo).makeInput(algo, "mesh") as ScanInput);
        const frames = algo.run(input);
        expect(frames.length).toBeGreaterThanOrEqual(10);
        if (holds(input, frames)) hits++;
      }
      expect(hits / 200).toBeGreaterThanOrEqual(0.8);
    });
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
  } else if (algo.kind === "grid") {
    const EMPTY: Record<string, unknown> = {
      lis: [],
      lcs: { a: "", b: "" },
      "edit-distance": { a: "", b: "" },
      knapsack: { weights: [], values: [], cap: 0 },
      "coin-change": { coins: [], amount: 0 },
    };
    if (algo.id in EMPTY) {
      test("run and solve agree on empty input", () => {
        const frames = algo.run(EMPTY[algo.id]);
        expect(frames[frames.length - 1].answer).toBe(algo.solve(EMPTY[algo.id]));
      });
    }

    if (algo.id === "lcs" || algo.id === "edit-distance") {
      test("run and solve agree on strings of 70 characters", () => {
        const rand = mulberry32(70);
        const strand = () => Array.from({ length: 70 }, () => "ACGT"[Math.floor(rand() * 4)]).join("");
        for (let k = 0; k < 100; k++) {
          const input = { a: strand(), b: strand() };
          const frames = algo.run(input);
          expect(frames[frames.length - 1].answer).toBe(algo.solve(input));
        }
      }, 30000);
    }

    test("ends on solve's answer with every cell filled, tracing only listed lines, on 200 seeded inputs", () => {
      const random = Math.random;
      Math.random = mulberry32(2026);
      try {
        const { min, max } = algo.size;
        const used = new Set<string>();
        for (let k = 0; k < 100; k++) {
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
  } else if (algo.kind === "tree") {
    test("every frame is one well-formed tree drawn without overlaps, and the last marks every node done with an answer", () => {
      for (const n of TREE_SIZES)
        for (let seed = 0; seed < 20; seed++) {
          const frames = algo.run(randomKeys(n));
          for (const f of frames) {
            const byId = new Map(f.nodes.map((node) => [node.id, node]));
            expect(byId.size).toBe(f.nodes.length);
            const seen: number[] = [];
            const walk = (id: number | null) => {
              if (id === null) return;
              seen.push(id);
              byId.get(id)!.children.forEach(walk);
            };
            f.roots.forEach(walk);
            expect(seen.sort((a, b) => a - b)).toEqual([...byId.keys()].sort((a, b) => a - b));
            for (const id of f.array ?? []) expect(byId.has(id)).toBe(true);
            const pos = [...layoutTree(f).values()];
            for (let i = 0; i < pos.length; i++)
              for (let j = i + 1; j < pos.length; j++)
                expect(Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y)).toBeGreaterThanOrEqual(MIN_NODE_DISTANCE);
          }
          const last = frames[frames.length - 1];
          expect(last.nodes.length).toBeGreaterThan(0);
          for (const node of last.nodes) expect(node.mark).toBe("done");
          expect(last.answer).toBeTruthy();
        }
    });

    if (algo.id === "bst")
      test("keeps the BST order every frame, marks the successor before replacing, and keeps the right keys", () => {
        for (const n of TREE_SIZES)
          for (let seed = 0; seed < 20; seed++) {
            const keys = randomKeys(n);
            const frames = algo.run(keys);
            for (const f of frames) {
              const order = inorder(f);
              for (let i = 1; i < order.length; i++) expect(order[i - 1]).toBeLessThanOrEqual(order[i]);
            }
            const replace = frames.findIndex((f) => f.line === "del-replace");
            expect(replace).toBeGreaterThan(0);
            const before = frames[replace - 1];
            expect(before.line).toBe("del-successor");
            const successor = before.nodes.find((node) => node.mark === "target")!;
            expect(frames[replace].nodes.find((node) => node.mark === "swap")!.value).toBe(successor.value);
            expect(frames.some((f) => f.line === "del-splice")).toBe(true);
            const found = frames.filter((f) => f.line === "find-done").map((f) => f.nodes.find((node) => node.mark === "target")?.value);
            expect(found).toEqual([keys[n - 1], undefined]);
            const kept = keys.filter((k) => k !== keys[0] && k !== keys[n - 1]).sort((a, b) => a - b);
            expect(inorder(frames[frames.length - 1])).toEqual(kept);
          }
      });

    if (algo.id === "bst")
      test("deleting a root with only a left or only a right child lifts that child", () => {
        for (const [keys, child, kept] of [
          [[5, 3, 1], 3, [3]],
          [[5, 8, 9], 8, [8]],
        ] as const) {
          const frames = algo.run([...keys]);
          const splice = frames.find((f) => f.line === "del-splice" && f.vars?.key === keys[0])!;
          expect(splice.nodes.find((node) => node.mark === "target")?.value).toBe(child);
          expect(inorder(frames[frames.length - 1])).toEqual([...kept]);
        }
      });

    if (algo.id === "binary-heap")
      test("only the key being sifted breaks the heap property, the array is the tree in level order, and pop-min returns the smallest keys", () => {
        for (const n of TREE_SIZES)
          for (let seed = 0; seed < 20; seed++) {
            const keys = randomKeys(n);
            const frames = algo.run(keys);
            for (const f of frames) {
              const byId = new Map(f.nodes.map((node) => [node.id, node]));
              const array = f.array!;
              expect(f.roots).toEqual(array.length ? [array[0]] : []);
              const broken: number[][] = [];
              array.forEach((id, i) => {
                expect(byId.get(id)!.children).toEqual([array[2 * i + 1] ?? null, array[2 * i + 2] ?? null]);
                if (i > 0 && byId.get(array[(i - 1) >> 1])!.value > byId.get(id)!.value) broken.push([array[(i - 1) >> 1], id]);
              });
              if (broken.length > 0) expect(broken.every(([p, c]) => [p, c].some((x) => broken.every((edge) => edge.includes(x))))).toBe(true);
            }
            const pops = Math.max(1, Math.floor(n / 3));
            const sorted = [...keys].sort((a, b) => a - b);
            const last = frames[frames.length - 1];
            expect(last.nodes.map((node) => node.value).sort((a, b) => (a as number) - (b as number))).toEqual(sorted.slice(pops));
            expect(last.answer).toContain(sorted.slice(0, pops).join(", "));
          }
      });

    if (algo.id === "tree-traversals")
      test("each traversal outputs the reference order, and the last output holds every node once", () => {
        for (const n of TREE_SIZES)
          for (let seed = 0; seed < 20; seed++) {
            const keys = randomKeys(n);
            const frames = algo.run(keys);
            for (const [name, want] of Object.entries(referenceOrders(keys))) {
              const outputs = frames.filter((f) => f.aux.title === `${name} output`);
              expect(outputs[outputs.length - 1].aux.items.map(Number)).toEqual(want);
            }
            expect(frames[frames.length - 1].aux.items.map(Number).sort((a, b) => a - b)).toEqual([...keys].sort((a, b) => a - b));
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

function seededSearches(count: number) {
  const random = Math.random;
  try {
    return Array.from({ length: count }, (_, i) => {
      Math.random = mulberry32(i + 1);
      return randomSearch(8 + (i % 25));
    });
  } finally {
    Math.random = random;
  }
}

function occurrences(text: string, pattern: string) {
  const found: number[] = [];
  for (let i = text.indexOf(pattern); i !== -1; i = text.indexOf(pattern, i + 1)) found.push(i);
  return found;
}

const border = (s: string) => {
  for (let k = s.length - 1; k > 0; k--) if (s.startsWith(s.slice(s.length - k))) return k;
  return 0;
};
const commonPrefix = (s: string, i: number) => {
  let k = 0;
  while (i + k < s.length && s[k] === s[i + k]) k++;
  return k;
};

describe("string search", () => {
  const searches = seededSearches(200);
  const strings = ALGORITHMS.filter((a): a is StringAlgorithm => a.kind === "string");
  const byId = (id: string) => strings.find((a) => a.id === id)!;
  const lastOf = (frames: StringFrame[]) => frames[frames.length - 1];
  const compares = (f: StringFrame) => Number(f.vars?.compares);

  test("every seeded input contains its pattern", () => {
    for (const { text, pattern } of searches) expect(occurrences(text, pattern).length).toBeGreaterThan(0);
  });

  test.each(strings.map((a) => [a.id, a] as const))("%s ends with exactly the indexOf matches on 200 seeded inputs", (_, algo) => {
    for (const { text, pattern } of searches) {
      const last = lastOf(algo.run(text, pattern));
      expect({ text, pattern, phase: last.phase, matches: last.matches }).toEqual({ text, pattern, phase: "done", matches: occurrences(text, pattern) });
    }
  });

  test("kmp makes at most 2n comparisons after building π", () => {
    for (const { text, pattern } of searches) {
      const frames = byId("kmp").run(text, pattern);
      const built = lastOf(frames.filter((f) => f.phase === "prepare"));
      expect(compares(lastOf(frames)) - compares(built)).toBeLessThanOrEqual(2 * text.length);
    }
  });

  test("kmp counts each character comparison once, building π and searching", () => {
    const kmpCompares = (text: string, pattern: string) => {
      let count = 0;
      const eq = (a: string, b: string) => (count++, a === b);
      const pi = [0];
      for (let i = 1, k = 0; i < pattern.length; i++) {
        let same = eq(pattern[i], pattern[k]);
        while (k > 0 && !same) (k = pi[k - 1]), (same = eq(pattern[i], pattern[k]));
        pi[i] = same ? ++k : k;
      }
      for (let i = 0, q = 0; i < text.length; i++) {
        let same = eq(text[i], pattern[q]);
        while (q > 0 && !same) (q = pi[q - 1]), (same = eq(text[i], pattern[q]));
        if (same) q++;
        if (q === pattern.length) q = pi[q - 1];
      }
      return count;
    };
    for (const { text, pattern } of searches) expect(compares(lastOf(byId("kmp").run(text, pattern)))).toBe(kmpCompares(text, pattern));
  });

  test("the π, Z, and shift tables end equal to their definitions", () => {
    for (const { text, pattern } of searches) {
      const m = pattern.length;
      expect(lastOf(byId("kmp").run(text, pattern)).aux?.values).toEqual([...pattern].map((_, i) => border(pattern.slice(0, i + 1))));
      const s = `${pattern}$${text}`;
      expect(lastOf(byId("z-function").run(text, pattern)).aux?.values).toEqual([...s].map((_, i) => (i === 0 ? null : commonPrefix(s, i))));
      const table = lastOf(byId("horspool").run(text, pattern)).aux!;
      if (table.under !== "table") throw new Error("horspool shows a keyed table");
      table.keys.forEach((key, i) => expect(table.values[i]).toBe(key === "other" ? m : m - 1 - pattern.slice(0, -1).lastIndexOf(key)));
    }
  });

  test("at least 80% of seeded inputs show each algorithm's key move", () => {
    const rate = (id: string, seen: (frames: StringFrame[]) => boolean) => searches.filter(({ text, pattern }) => seen(byId(id).run(text, pattern))).length / searches.length;
    const marked = (f: StringFrame, mark: StringMark) => Object.values(f.marks).includes(mark);
    const aligns = (frames: StringFrame[]) => frames.flatMap((f) => (f.line === "align" && f.phase === "search" ? [f.offset] : []));
    expect(rate("naive-search", (fs) => fs.some((f) => marked(f, "match") && marked(f, "mismatch")))).toBeGreaterThanOrEqual(0.8);
    expect(rate("kmp", (fs) => fs.some((f) => f.line === "shift" && marked(f, "known")))).toBeGreaterThanOrEqual(0.8);
    expect(rate("z-function", (fs) => fs.some((f) => f.line === "box" && marked(f, "known")))).toBeGreaterThanOrEqual(0.8);
    expect(rate("horspool", (fs) => aligns(fs).some((s, i, all) => i > 0 && s - all[i - 1] > 1))).toBeGreaterThanOrEqual(0.8);
    expect(rate("rabin-karp", (fs) => fs.some((f) => f.aux?.marks && Object.values(f.aux.marks).includes("mismatch")))).toBeGreaterThanOrEqual(0.5);
  });
});
