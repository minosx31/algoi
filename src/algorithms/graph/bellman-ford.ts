import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const bellmanFord: GraphAlgorithm = {
  id: "bellman-ford",
  name: "Bellman-Ford",
  kind: "graph",
  topic: "graph",
  weighted: true,
  about: {
    summary: "Relaxes every edge, again and again. After round k, every shortest path of at most k edges is correct, and a shortest path never needs more than V − 1 edges.",
    invariants: [
      "After round k, dist[v] is no larger than the cheapest path to v that uses at most k edges.",
      "dist[v] is always the length of some real path to v, so it only ever decreases.",
    ],
    useCases: [
      "Shortest paths when some edges have negative weights, which Dijkstra cannot handle.",
      "Distance-vector routing such as RIP, where each router relaxes the costs its neighbours report.",
      "Detecting negative cycles: one more round that still improves proves one exists.",
    ],
  },
  complexity: { best: "O(E)", average: "O(V · E)", worst: "O(V · E)", space: "O(V)" },
  code: {
    pseudo: `
procedure BellmanFord(G, s)
  dist[v] ← ∞ for all v; dist[s] ← 0             @@init
  for round ← 1 to V − 1 do                      @@round
    changed ← false
    for each edge (u, v, w), both directions do  @@check
      if dist[u] + w < dist[v] then              @@check
        dist[v] ← dist[u] + w                    @@relax
        changed ← true                           @@relax
    if not changed then break                    @@stop
  return dist                                    @@done
`,
    python: `
def bellman_ford(n, edges, s):
    dist = [float("inf")] * n                    @@init
    dist[s] = 0                                  @@init
    for rnd in range(1, n):                      @@round
        changed = False
        for u, v, w in edges:                    @@check
            for a, b in ((u, v), (v, u)):        @@check
                if dist[a] + w < dist[b]:        @@check
                    dist[b] = dist[a] + w        @@relax
                    changed = True               @@relax
        if not changed:                          @@stop
            break                                @@stop
    return dist                                  @@done
`,
    cpp: `
std::vector<int> bellmanFord(int n, const std::vector<std::array<int, 3>>& edges, int s) {
    std::vector<int> dist(n, INT_MAX);           @@init
    dist[s] = 0;                                 @@init
    for (int round = 1; round < n; round++) {    @@round
        bool changed = false;
        for (auto [u, v, w] : edges) {           @@check
            for (auto [a, b] : {std::pair{u, v}, std::pair{v, u}}) {   @@check
                if (dist[a] != INT_MAX && dist[a] + w < dist[b]) {     @@check
                    dist[b] = dist[a] + w;       @@relax
                    changed = true;              @@relax
                }
            }
        }
        if (!changed) break;                     @@stop
    }
    return dist;                                 @@done
}
`,
    java: `
static int[] bellmanFord(int n, int[][] edges, int s) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);        @@init
    dist[s] = 0;                                 @@init
    for (int round = 1; round < n; round++) {    @@round
        boolean changed = false;
        for (int[] e : edges) {                  @@check
            for (int[] d : new int[][]{{e[0], e[1]}, {e[1], e[0]}}) {   @@check
                int a = d[0], b = d[1], w = e[2];                       @@check
                if (dist[a] != Integer.MAX_VALUE && dist[a] + w < dist[b]) {   @@check
                    dist[b] = dist[a] + w;       @@relax
                    changed = true;              @@relax
                }
            }
        }
        if (!changed) break;                     @@stop
    }
    return dist;                                 @@done
}
`,
    javascript: `
function bellmanFord(n, edges, s) {
  const dist = Array(n).fill(Infinity);          @@init
  dist[s] = 0;                                   @@init
  for (let round = 1; round < n; round++) {      @@round
    let changed = false;
    for (const [u, v, w] of edges) {             @@check
      for (const [a, b] of [[u, v], [v, u]]) {   @@check
        if (dist[a] + w < dist[b]) {             @@check
          dist[b] = dist[a] + w;                 @@relax
          changed = true;                        @@relax
        }
      }
    }
    if (!changed) break;                         @@stop
  }
  return dist;                                   @@done
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph);
    const n = graph.nodes.length;
    const dist = new Map<number, number>([[start, 0]]);
    const parent = new Map<number, number>();
    let round = 0;
    const show = (d: number | undefined) => (d === undefined ? "∞" : String(d));
    const aux = () => ({
      title: `Round ${round} of ${n - 1}`,
      items: graph.nodes.map(({ id, name }) => `${name}=${show(dist.get(id))}`),
    });
    const settleAll = () => {
      for (const { id } of graph.nodes) if (dist.has(id)) t.nodes[id] = "visited";
    };

    t.nodes[start] = "frontier";
    t.labels[start] = "0";
    t.step("init", `Start at ${t.name(start)}: dist[${t.name(start)}] = 0 and every other distance is ∞.`, aux());

    let stopped = false;
    for (round = 1; round < n && !stopped; round++) {
      t.step("round", `Round ${round} of ${n - 1}: look at every edge once and relax each one that helps.`, aux());
      let changed = false;
      for (const { u, v, w } of graph.edges) {
        const dU = dist.get(u);
        const dV = dist.get(v);
        let from = -1;
        let to = -1;
        if (dU !== undefined && (dV === undefined || dU + w < dV)) [from, to] = [u, v];
        else if (dV !== undefined && (dU === undefined || dV + w < dU)) [from, to] = [v, u];
        const uName = t.name(u);
        const vName = t.name(v);
        const vars = { u: uName, v: vName, w };
        if (from < 0) {
          t.step("check", `Edge ${uName}–${vName}, weight ${w}: neither end gets shorter (dist[${uName}] = ${show(dU)}, dist[${vName}] = ${show(dV)}).`, aux(), {
            current: u,
            considered: [u, v],
            vars,
          });
          continue;
        }
        const fromName = t.name(from);
        const toName = t.name(to);
        const cand = dist.get(from)! + w;
        t.step("check", `Edge ${fromName}→${toName}, weight ${w}: ${dist.get(from)} + ${w} = ${cand} < ${show(dist.get(to))}.`, aux(), {
          current: from,
          considered: [u, v],
          vars,
        });
        const oldParent = parent.get(to);
        if (oldParent !== undefined) t.edge(oldParent, to, undefined);
        parent.set(to, from);
        t.edge(from, to, "tree");
        dist.set(to, cand);
        t.nodes[to] = "frontier";
        t.labels[to] = String(cand);
        changed = true;
        t.step("relax", `Set dist[${toName}] = ${cand}; the shortest-path tree now reaches ${toName} through ${fromName}.`, aux(), { current: from, vars });
      }
      if (!changed) {
        settleAll();
        t.step("stop", `Round ${round} changed nothing, so every distance is final.`, aux());
        stopped = true;
      }
    }
    if (!stopped) {
      round = n - 1;
      settleAll();
      t.step("done", `All ${n - 1} rounds are done. A shortest path has at most ${n - 1} edges, so every distance is final.`, aux());
    }
    return t.frames;
  },
};
