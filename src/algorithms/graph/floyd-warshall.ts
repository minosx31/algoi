import { GridTracer } from "../../core/trace";
import type { CellMark, Coord, Graph, GridAlgorithm } from "../../core/types";

const weight = () => 1 + Math.floor(Math.random() * 9);

function randomGraph(n: number): Graph {
  const nodes = Array.from({ length: n }, (_, id) => ({ id, name: "ABCDEFGH"[id], x: 0, y: 0 }));
  const edges: Graph["edges"] = [];
  for (let v = 1; v < n; v++) edges.push({ u: Math.floor(Math.random() * v), v, w: weight() });
  for (let extra = 1 + Math.floor(Math.random() * (n - 2)); extra > 0; ) {
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    if (u === v || edges.some((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u))) continue;
    edges.push({ u, v, w: weight() });
    extra--;
  }
  return { nodes, edges };
}

function farthest(d: number[][]) {
  let best: [number, number] = [0, 1];
  for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) if (d[i][j] > d[best[0]][best[1]]) best = [i, j];
  return best;
}

export const floydWarshall: GridAlgorithm<Graph> = {
  id: "floyd-warshall",
  name: "Floyd-Warshall",
  kind: "grid",
  topic: "graph",
  size: { label: "Nodes", min: 4, max: 6, initial: 5 },
  legend: [
    ["current", "Pair being checked"],
    ["read", "The two legs through k"],
    ["frontier", "Row and column of k"],
    ["result", "Farthest pair"],
  ],
  about: {
    summary:
      "Fills a matrix of distances between every pair of nodes, then lets each node in turn act as a stop in the middle and keeps any route through it that is shorter.",
    invariants: [
      "After round k, dist[i][j] is the shortest path from i to j whose middle stops all come from the first k nodes.",
      "Row k and column k cannot change in round k, because a detour from k back to k adds nothing.",
      "With no negative cycle the diagonal stays 0, and on an undirected graph the matrix stays symmetric.",
    ],
    useCases: [
      "All-pairs latency or hop-count tables for small networks.",
      "Transitive closure (which nodes can reach which), by replacing + with AND and min with OR.",
      "Precomputing travel times between every pair of a few dozen places.",
    ],
  },
  complexity: { best: "O(V³)", average: "O(V³)", worst: "O(V³)", space: "O(V²)" },
  code: {
    pseudo: `
procedure FloydWarshall(n, edges)
  dist[i][j] ← 0 if i = j, else ∞                     @@init
  for each edge (u, v, w) do                           @@init
    dist[u][v] ← w; dist[v][u] ← w                     @@init
  for k ← 0 to n − 1 do                                @@pivot
    for i ← 0 to n − 1 do
      for j ← 0 to n − 1 do
        if dist[i][k] + dist[k][j] < dist[i][j] then   @@check
          dist[i][j] ← dist[i][k] + dist[k][j]         @@relax
  return dist                                          @@done
`,
    python: `
def floyd_warshall(n, edges):
    INF = float("inf")
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]  @@init
    for u, v, w in edges:                              @@init
        d[u][v] = d[v][u] = w                          @@init
    for k in range(n):                                 @@pivot
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]:        @@check
                    d[i][j] = d[i][k] + d[k][j]        @@relax
    return d                                           @@done
`,
    cpp: `
std::vector<std::vector<int>> floydWarshall(int n, const std::vector<std::array<int, 3>>& edges) {
    const int INF = 1e9;                               @@init
    std::vector<std::vector<int>> d(n, std::vector<int>(n, INF));  @@init
    for (int i = 0; i < n; i++) d[i][i] = 0;           @@init
    for (auto [u, v, w] : edges) d[u][v] = d[v][u] = w;  @@init
    for (int k = 0; k < n; k++)                        @@pivot
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (d[i][k] + d[k][j] < d[i][j])       @@check
                    d[i][j] = d[i][k] + d[k][j];       @@relax
    return d;                                          @@done
}
`,
    java: `
static int[][] floydWarshall(int n, int[][] edges) {
    final int INF = 1_000_000_000;                     @@init
    int[][] d = new int[n][n];                         @@init
    for (int i = 0; i < n; i++) {                      @@init
        Arrays.fill(d[i], INF);                        @@init
        d[i][i] = 0;                                   @@init
    }
    for (int[] e : edges) d[e[0]][e[1]] = d[e[1]][e[0]] = e[2];  @@init
    for (int k = 0; k < n; k++)                        @@pivot
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (d[i][k] + d[k][j] < d[i][j])       @@check
                    d[i][j] = d[i][k] + d[k][j];       @@relax
    return d;                                          @@done
}
`,
    javascript: `
function floydWarshall(n, edges) {
  const d = Array.from({ length: n }, (_, i) =>       @@init
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));  @@init
  for (const [u, v, w] of edges) d[u][v] = d[v][u] = w;  @@init
  for (let k = 0; k < n; k++)                          @@pivot
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (d[i][k] + d[k][j] < d[i][j])               @@check
          d[i][j] = d[i][k] + d[k][j];                 @@relax
  return d;                                            @@done
}
`,
  },
  makeInput: randomGraph,
  run(graph) {
    const n = graph.nodes.length;
    const names = graph.nodes.map((v) => v.name);
    const show = (x: number) => (x === Infinity ? "∞" : String(x));
    const t = new GridTracer(n, n, { rowHeaders: names, colHeaders: names });
    t.aux = { title: "Edges", items: graph.edges.map(({ u, v, w }) => `${names[u]}–${names[v]} ${w}`) };
    const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
    for (const { u, v, w } of graph.edges) d[u][v] = d[v][u] = w;
    d.forEach((row, i) => row.forEach((x, j) => t.set(i, j, show(x))));
    t.step("init", "Start from the direct edges: 0 on the diagonal, the edge weight between neighbours, and ∞ where there is no edge.");

    for (let k = 0; k < n; k++) {
      const K = names[k];
      const via: [Coord, CellMark][] = [];
      for (let x = 0; x < n; x++) via.push([[k, x], "frontier"], [[x, k], "frontier"]);
      t.step("pivot", `Round ${k + 1}: allow paths that stop at ${K} on the way. Row and column ${K} cannot change, so only the other cells are checked.`, {
        marks: via,
        vars: { k: K },
      });
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j || i === k || j === k) continue;
          const I = names[i];
          const J = names[j];
          const through = d[i][k] + d[k][j];
          const route = `${I}→${K}→${J}`;
          const current: Coord = [i, j];
          const reads: Coord[] = [[i, k], [k, j]];
          const extra = { current, reads, marks: via, vars: { k: K, i: I, j: J } };
          if (through < d[i][j]) {
            const old = d[i][j];
            d[i][j] = through;
            t.set(i, j, through);
            t.step("relax", `${route}: ${d[i][k]} + ${d[k][j]} = ${through} < ${show(old)}, so dist[${I}][${J}] = ${through}.`, extra);
          } else if (through === Infinity) {
            const gap = d[i][k] === Infinity ? `${I} to ${K}` : `${K} to ${J}`;
            t.step("check", `${route}: there is no path from ${gap} yet, so ${K} cannot help.`, extra);
          } else {
            t.step("check", `${route}: ${d[i][k]} + ${d[k][j]} = ${through} is not shorter than ${d[i][j]}.`, extra);
          }
        }
      }
    }

    const [fi, fj] = farthest(d);
    t.answer = `${names[fi]}↔${names[fj]} = ${d[fi][fj]}`;
    t.mark(fi, fj, "result");
    t.mark(fj, fi, "result");
    t.step("done", `Every cell holds a shortest distance. The farthest pair, ${names[fi]}↔${names[fj]} at ${d[fi][fj]}, is the graph's diameter.`);
    return t.frames;
  },
  solve(graph) {
    const n = graph.nodes.length;
    const d = graph.nodes.map((source) => {
      const dist = new Array<number>(n).fill(Infinity);
      const done = new Array<boolean>(n).fill(false);
      dist[source.id] = 0;
      for (let round = 0; round < n; round++) {
        let u = -1;
        for (let v = 0; v < n; v++) if (!done[v] && (u === -1 || dist[v] < dist[u])) u = v;
        done[u] = true;
        for (const { u: a, v: b, w } of graph.edges) {
          if (a === u) dist[b] = Math.min(dist[b], dist[u] + w);
          if (b === u) dist[a] = Math.min(dist[a], dist[u] + w);
        }
      }
      return dist;
    });
    const [fi, fj] = farthest(d);
    return `${graph.nodes[fi].name}↔${graph.nodes[fj].name} = ${d[fi][fj]}`;
  },
};
