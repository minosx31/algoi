import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const dijkstra: GraphAlgorithm = {
  id: "dijkstra",
  name: "Dijkstra's Algorithm",
  kind: "graph",
  topic: "graph",
  weighted: true,
  about: {
    summary: "Repeatedly settles the closest unsettled node, then relaxes its edges to see if they offer a shorter route.",
    invariants: [
      "Once a node is popped (settled), its distance is final, as long as all weights are non-negative.",
      "dist[v] is always the length of some real path to v, so it only ever decreases.",
    ],
    useCases: [
      "Road navigation and routing with non-negative travel costs.",
      "Network routing protocols such as OSPF.",
      "The foundation for A*, which adds a heuristic to aim the search.",
    ],
  },
  complexity: { best: "O((V + E) log V)", average: "O((V + E) log V)", worst: "O((V + E) log V)", space: "O(V + E)" },
  code: {
    pseudo: `
procedure Dijkstra(G, s)
  dist[v] ← ∞ for all v; dist[s] ← 0       @@init
  PQ ← min-heap containing (0, s)           @@init
  while PQ is not empty do                  @@loop
    (d, u) ← PQ.extractMin()                @@pop
    if d > dist[u] then continue            @@stale
    for each edge (u, v, w) do              @@neighbor
      if d + w < dist[v] then               @@check
        dist[v] ← d + w                     @@relax
        PQ.insert((dist[v], v))             @@relax
`,
    python: `
import heapq

def dijkstra(adj, s):
    dist = {s: 0}                               @@init
    pq = [(0, s)]                               @@init
    while pq:                                   @@loop
        d, u = heapq.heappop(pq)                @@pop
        if d > dist[u]:                         @@stale
            continue                            @@stale
        for v, w in adj[u]:                     @@neighbor
            if d + w < dist.get(v, float("inf")):   @@check
                dist[v] = d + w                 @@relax
                heapq.heappush(pq, (d + w, v))  @@relax
    return dist
`,
    cpp: `
std::vector<int> dijkstra(const std::vector<std::vector<std::pair<int, int>>>& adj, int s) {
    using P = std::pair<int, int>;
    std::vector<int> dist(adj.size(), INT_MAX);
    std::priority_queue<P, std::vector<P>, std::greater<>> pq;
    dist[s] = 0; pq.push({0, s});               @@init
    while (!pq.empty()) {                       @@loop
        auto [d, u] = pq.top(); pq.pop();       @@pop
        if (d > dist[u]) continue;              @@stale
        for (auto [v, w] : adj[u]) {            @@neighbor
            if (d + w < dist[v]) {              @@check
                dist[v] = d + w;                @@relax
                pq.push({dist[v], v});          @@relax
            }
        }
    }
    return dist;
}
`,
    java: `
static int[] dijkstra(List<List<int[]>> adj, int s) {
    int[] dist = new int[adj.size()];
    Arrays.fill(dist, Integer.MAX_VALUE);
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    dist[s] = 0; pq.add(new int[]{0, s});       @@init
    while (!pq.isEmpty()) {                     @@loop
        int[] top = pq.poll();                  @@pop
        int d = top[0], u = top[1];             @@pop
        if (d > dist[u]) continue;              @@stale
        for (int[] e : adj.get(u)) {            @@neighbor
            int v = e[0], w = e[1];             @@neighbor
            if (d + w < dist[v]) {              @@check
                dist[v] = d + w;                @@relax
                pq.add(new int[]{dist[v], v});  @@relax
            }
        }
    }
    return dist;
}
`,
    javascript: `
// pq is a sorted array standing in for a binary heap.
function dijkstra(adj, s) {
  const dist = new Map([[s, 0]]);               @@init
  const pq = [[0, s]];                          @@init
  while (pq.length > 0) {                       @@loop
    const [d, u] = pq.shift();                  @@pop
    if (d > dist.get(u)) continue;              @@stale
    for (const [v, w] of adj[u]) {              @@neighbor
      if (d + w < (dist.get(v) ?? Infinity)) {  @@check
        dist.set(v, d + w);                     @@relax
        pq.push([d + w, v]);                    @@relax
        pq.sort((a, b) => a[0] - b[0]);         @@relax
      }
    }
  }
  return dist;
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph);
    const dist = new Map<number, number>([[start, 0]]);
    const parent = new Map<number, number>();
    const pq: [number, number][] = [[0, start]];
    const aux = () => ({ title: "Priority queue (smallest first)", items: pq.map(([d, v]) => `${t.name(v)}:${d}`) });
    const show = (d: number | undefined) => (d === undefined ? "∞" : String(d));

    t.nodes[start] = "frontier";
    t.labels[start] = "0";
    t.step("init", `Start at ${t.name(start)}: dist[${t.name(start)}] = 0, every other distance is ∞. Push ${t.name(start)}:0.`, aux());

    while (pq.length > 0) {
      t.step("loop", `Priority queue has ${pq.length} entr${pq.length === 1 ? "y" : "ies"}; keep going.`, aux());
      const [d, u] = pq.shift()!;
      const uName = t.name(u);
      if (d > dist.get(u)!) {
        t.step("pop", `Pop ${uName}:${d}.`, aux(), { vars: { u: uName, d } });
        t.step("stale", `Stale entry: dist[${uName}] is already ${dist.get(u)}, which beats ${d}. Skip it.`, aux(), { vars: { u: uName, d } });
        continue;
      }
      t.nodes[u] = "visited";
      t.step("pop", `Pop ${uName}:${d}, the smallest. ${uName} is settled at distance ${d}.`, aux(), { current: u, vars: { u: uName, d } });
      for (const { to: v, w } of t.adj[u]) {
        const vName = t.name(v);
        const cand = d + w;
        const old = dist.get(v);
        const vars = { u: uName, v: vName, d, w };
        const improves = old === undefined || cand < old;
        const verdict = improves ? `${cand} < ${show(old)}.` : `${cand} ≥ ${old}, no improvement.`;
        t.step("check", `Edge ${uName}→${vName}, weight ${w}: ${d} + ${w} = ${verdict}`, aux(), { current: u, considered: [u, v], vars });
        if (!improves) continue;
        const oldParent = parent.get(v);
        if (oldParent !== undefined) t.edge(oldParent, v, undefined);
        parent.set(v, u);
        t.edge(u, v, "tree");
        dist.set(v, cand);
        pq.push([cand, v]);
        pq.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        t.nodes[v] = "frontier";
        t.labels[v] = String(cand);
        const was = old === undefined ? `set dist[${vName}] = ${cand}` : `update dist[${vName}] from ${old} to ${cand}`;
        t.step("relax", `Relax ${uName}→${vName}: ${d} + ${w} = ${cand} < ${show(old)}, ${was} and push ${vName}:${cand}.`, aux(), { current: u, vars });
      }
    }
    t.step("loop", "Priority queue is empty. Every reachable node holds its shortest distance.", aux());
    return t.frames;
  },
};
