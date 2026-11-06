import { describe, expect, test } from "bun:test";
import { ALGORITHMS } from "./index";
import { labelsOf } from "../core/code";
import { GRAPH_LAYOUTS, buildGraph, randomArray, withRandomWeights } from "../core/inputs";
import { LANGUAGES, TOPIC_LABELS, type Graph, type ScanFrame, type ScanInput } from "../core/types";
import { VIEWS, viewOf } from "../core/views";

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
};

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

    test("keeps every pointer on a declared name and inside the array", () => {
      for (const input of inputs)
        for (const f of algo.run(input))
          for (const [name, at] of Object.entries(f.pointers)) {
            expect(algo.pointers).toContain(name);
            expect(at! >= 0 && at! < input.values.length).toBe(true);
          }
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
  }
});
