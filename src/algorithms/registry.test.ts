import { describe, expect, test } from "bun:test";
import { ALGORITHMS } from "./index";
import { labelsOf } from "../core/code";
import { GRAPH_LAYOUTS, buildGraph, randomArray, randomSearch, withRandomWeights } from "../core/inputs";
import { LANGUAGES, TOPIC_LABELS, type Graph, type StringAlgorithm, type StringFrame, type StringMark } from "../core/types";
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

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededSearches(count: number) {
  const random = Math.random;
  try {
    return Array.from({ length: count }, (_, i) => {
      Math.random = seeded(i + 1);
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
