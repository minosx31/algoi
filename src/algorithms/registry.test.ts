import { describe, expect, test } from "bun:test";
import { ALGORITHMS } from "./index";
import { labelsOf } from "../core/code";
import { GRAPH_LAYOUTS, buildGraph, randomArray, randomKeys, withRandomWeights } from "../core/inputs";
import { LANGUAGES, TOPIC_LABELS, type Graph, type TreeFrame } from "../core/types";
import { VIEWS, viewOf } from "../core/views";
import { MIN_NODE_DISTANCE, layoutTree } from "../components/TreeView";

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
