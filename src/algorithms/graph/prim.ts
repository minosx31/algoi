import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const prim: GraphAlgorithm = {
  id: "prim",
  name: "Prim's Algorithm",
  kind: "graph",
  topic: "graph",
  weighted: true,
  about: {
    summary: "Grows one tree from the start node. Each step adds the lightest edge that leaves the tree, found with a priority queue.",
    invariants: [
      "The tree is always a subset of some minimum spanning tree.",
      "The lightest edge crossing the cut between the tree and the rest is safe to add (the cut property).",
      "An edge popped with both ends already in the tree would close a cycle, so it is skipped.",
    ],
    useCases: [
      "Laying cable, pipe, or road for the least total length.",
      "Network design where every site must be reachable.",
      "Clustering and image segmentation built on a minimum spanning tree.",
    ],
  },
  complexity: { best: "O(E log V)", average: "O(E log V)", worst: "O(E log V)", space: "O(E)" },
  code: {
    pseudo: `
procedure Prim(G, s)
  tree ← {s}; total ← 0                          @@init
  PQ ← min-heap of the edges (w, s, v) at s      @@init
  while PQ is not empty and tree is not all of V do   @@loop
    (w, u, v) ← PQ.extractMin()                  @@pop
    if v ∈ tree then continue                    @@stale
    tree ← tree ∪ {v}; total ← total + w         @@add
    for each edge (v, x, wx) with x ∉ tree do    @@push
      PQ.insert((wx, v, x))                      @@push
  return total                                   @@done
`,
    python: `
import heapq

def prim(adj, s):
    seen, total = {s}, 0                         @@init
    pq = [(w, s, v) for v, w in adj[s]]          @@init
    heapq.heapify(pq)                            @@init
    while pq and len(seen) < len(adj):           @@loop
        w, u, v = heapq.heappop(pq)              @@pop
        if v in seen:                            @@stale
            continue                             @@stale
        seen.add(v); total += w                  @@add
        for x, wx in adj[v]:                     @@push
            if x not in seen:                    @@push
                heapq.heappush(pq, (wx, v, x))   @@push
    return total                                 @@done
`,
    cpp: `
int prim(const std::vector<std::vector<std::pair<int, int>>>& adj, int s) {
    using E = std::tuple<int, int, int>;
    std::priority_queue<E, std::vector<E>, std::greater<>> pq;
    std::vector<bool> seen(adj.size());
    seen[s] = true; int total = 0, count = 1;    @@init
    for (auto [v, w] : adj[s]) pq.push({w, s, v});   @@init
    while (!pq.empty() && count < (int)adj.size()) {   @@loop
        auto [w, u, v] = pq.top(); pq.pop();     @@pop
        if (seen[v]) continue;                   @@stale
        seen[v] = true; count++; total += w;     @@add
        for (auto [x, wx] : adj[v])              @@push
            if (!seen[x]) pq.push({wx, v, x});   @@push
    }
    return total;                                @@done
}
`,
    java: `
static int prim(List<List<int[]>> adj, int s) {
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    boolean[] seen = new boolean[adj.size()];
    seen[s] = true; int total = 0, count = 1;    @@init
    for (int[] e : adj.get(s)) pq.add(new int[]{e[1], s, e[0]});   @@init
    while (!pq.isEmpty() && count < adj.size()) {   @@loop
        int[] top = pq.poll();                   @@pop
        int w = top[0], v = top[2];              @@pop
        if (seen[v]) continue;                   @@stale
        seen[v] = true; count++; total += w;     @@add
        for (int[] e : adj.get(v))               @@push
            if (!seen[e[0]]) pq.add(new int[]{e[1], v, e[0]});   @@push
    }
    return total;                                @@done
}
`,
    javascript: `
// pq is a sorted array standing in for a binary heap.
function prim(adj, s) {
  const seen = new Set([s]);                     @@init
  let total = 0;                                 @@init
  const pq = adj[s].map(([v, w]) => [w, s, v]);  @@init
  pq.sort((a, b) => a[0] - b[0]);                @@init
  while (pq.length > 0 && seen.size < adj.length) {   @@loop
    const [w, u, v] = pq.shift();                @@pop
    if (seen.has(v)) continue;                   @@stale
    seen.add(v); total += w;                     @@add
    for (const [x, wx] of adj[v]) {              @@push
      if (!seen.has(x)) pq.push([wx, v, x]);     @@push
    }
    pq.sort((a, b) => a[0] - b[0]);              @@push
  }
  return total;                                  @@done
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph);
    const n = graph.nodes.length;
    const inTree = new Set<number>([start]);
    const pq: { w: number; u: number; v: number }[] = [];
    let total = 0;
    const aux = () => ({
      title: "Priority queue (lightest edge first)",
      items: pq.map(({ w, u, v }) => `${t.name(u)}–${t.name(v)}:${w}`),
    });
    const pushEdges = (from: number) => {
      let pushed = 0;
      for (const { to, w } of t.adj[from]) {
        if (inTree.has(to)) continue;
        pq.push({ w, u: from, v: to });
        t.edge(from, to, "considered");
        t.nodes[to] = "frontier";
        pushed++;
      }
      pq.sort((a, b) => a.w - b.w || a.u - b.u || a.v - b.v);
      return pushed;
    };

    t.nodes[start] = "visited";
    const first = pushEdges(start);
    t.step("init", `Start the tree at ${t.name(start)} and push its ${first} edge${first === 1 ? "" : "s"}.`, aux(), { vars: { total } });

    while (pq.length > 0 && inTree.size < n) {
      const { w, u, v } = pq.shift()!;
      const uName = t.name(u);
      const vName = t.name(v);
      t.edge(u, v, undefined);
      t.step("pop", `Pop ${uName}–${vName}, weight ${w}, the lightest edge in the queue.`, aux(), { current: u, considered: [u, v], vars: { w, total } });
      if (inTree.has(v)) {
        t.step("stale", `${vName} is already in the tree, so ${uName}–${vName} would close a cycle. Skip it.`, aux(), { current: u, vars: { w, total } });
        continue;
      }
      inTree.add(v);
      total += w;
      t.edge(u, v, "tree");
      t.nodes[v] = "visited";
      t.labels[v] = String(w);
      t.step("add", `Add ${uName}–${vName}: ${vName} joins the tree and the total weight is ${total}.`, aux(), { current: v, vars: { w, total } });
      const pushed = pushEdges(v);
      const note = pushed === 0 ? `${vName} has no edge to a node outside the tree.` : `Push ${vName}'s ${pushed} edge${pushed === 1 ? "" : "s"} to nodes outside the tree.`;
      t.step("push", note, aux(), { current: v, vars: { total } });
    }
    for (const { u, v } of pq) t.edge(u, v, undefined);
    const left = pq.length === 0 ? "" : ` The ${pq.length} edge${pq.length === 1 ? "" : "s"} left in the queue would all close cycles.`;
    t.step("done", `The tree spans all ${n} nodes with ${n - 1} edges and total weight ${total}.${left}`, aux(), { vars: { total } });
    return t.frames;
  },
};
