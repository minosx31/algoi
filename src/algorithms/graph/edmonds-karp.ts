import { GraphTracer } from "../../core/trace";
import { edgeKey, type GraphAlgorithm } from "../../core/types";

export const edmondsKarp: GraphAlgorithm = {
  id: "edmonds-karp",
  name: "Max Flow (Edmonds-Karp)",
  kind: "graph",
  topic: "graph",
  weighted: true,
  directed: "acyclic",
  about: {
    summary: "Finds the largest flow from a source to a sink by repeatedly pushing flow along the shortest path that still has spare capacity, found with BFS in the residual graph.",
    invariants: [
      "Flow on an edge never exceeds its capacity, and every node except the source and sink passes on as much as it takes in.",
      "The residual graph offers spare capacity forward and the chance to cancel flow backward.",
      "When no residual path remains, the nodes still reachable from the source form a minimum cut whose capacity equals the flow.",
    ],
    useCases: [
      "Capacity planning: how much traffic a network or pipeline can carry between two points.",
      "Bipartite matching, such as assigning jobs to workers, reduces to max flow.",
      "Min cut finds the cheapest set of links to remove to disconnect two sites.",
    ],
  },
  complexity: { best: "O(V E)", average: "O(V E²)", worst: "O(V E²)", space: "O(V²)" },
  code: {
    pseudo: `
procedure EdmondsKarp(G, s, t)
  residual[u][v] ← capacity of edge (u, v), else 0; flow ← 0   @@init
  loop
    find a shortest path s → t by BFS over residual > 0        @@search
    if there is no such path then return flow                  @@done
    b ← smallest residual along the path                       @@search
    for each edge (u, v) on the path do                        @@augment
      residual[u][v] ← residual[u][v] − b                      @@augment
      residual[v][u] ← residual[v][u] + b                      @@augment
    flow ← flow + b                                            @@augment
`,
    python: `
from collections import deque

def edmonds_karp(cap, s, t):
    n, flow = len(cap), 0                          @@init
    while True:
        parent = [-1] * n; parent[s] = s           @@search
        q = deque([s])                             @@search
        while q and parent[t] < 0:                 @@search
            u = q.popleft()                        @@search
            for v in range(n):                     @@search
                if cap[u][v] > 0 and parent[v] < 0:   @@search
                    parent[v] = u; q.append(v)     @@search
        if parent[t] < 0:                          @@done
            return flow                            @@done
        b, v = float("inf"), t                     @@search
        while v != s:                              @@search
            b, v = min(b, cap[parent[v]][v]), parent[v]   @@search
        v = t                                      @@augment
        while v != s:                              @@augment
            cap[parent[v]][v] -= b                 @@augment
            cap[v][parent[v]] += b                 @@augment
            v = parent[v]                          @@augment
        flow += b                                  @@augment
`,
    cpp: `
int edmondsKarp(std::vector<std::vector<int>> cap, int s, int t) {
    int n = cap.size(), flow = 0;                  @@init
    while (true) {
        std::vector<int> parent(n, -1); parent[s] = s;   @@search
        std::queue<int> q; q.push(s);              @@search
        while (!q.empty() && parent[t] < 0) {      @@search
            int u = q.front(); q.pop();            @@search
            for (int v = 0; v < n; v++)            @@search
                if (cap[u][v] > 0 && parent[v] < 0) { parent[v] = u; q.push(v); }   @@search
        }
        if (parent[t] < 0) return flow;            @@done
        int b = INT_MAX;                           @@search
        for (int v = t; v != s; v = parent[v]) b = std::min(b, cap[parent[v]][v]);   @@search
        for (int v = t; v != s; v = parent[v]) {   @@augment
            cap[parent[v]][v] -= b;                @@augment
            cap[v][parent[v]] += b;                @@augment
        }
        flow += b;                                 @@augment
    }
}
`,
    java: `
static int edmondsKarp(int[][] cap, int s, int t) {
    int n = cap.length, flow = 0;                  @@init
    while (true) {
        int[] parent = new int[n];
        Arrays.fill(parent, -1); parent[s] = s;    @@search
        Deque<Integer> q = new ArrayDeque<>(List.of(s));   @@search
        while (!q.isEmpty() && parent[t] < 0) {    @@search
            int u = q.poll();                      @@search
            for (int v = 0; v < n; v++)            @@search
                if (cap[u][v] > 0 && parent[v] < 0) { parent[v] = u; q.add(v); }   @@search
        }
        if (parent[t] < 0) return flow;            @@done
        int b = Integer.MAX_VALUE;                 @@search
        for (int v = t; v != s; v = parent[v]) b = Math.min(b, cap[parent[v]][v]);   @@search
        for (int v = t; v != s; v = parent[v]) {   @@augment
            cap[parent[v]][v] -= b;                @@augment
            cap[v][parent[v]] += b;                @@augment
        }
        flow += b;                                 @@augment
    }
}
`,
    javascript: `
function edmondsKarp(cap, s, t) {
  const n = cap.length;
  let flow = 0;                                    @@init
  while (true) {
    const parent = new Array(n).fill(-1); parent[s] = s;   @@search
    const q = [s];                                 @@search
    while (q.length > 0 && parent[t] < 0) {        @@search
      const u = q.shift();                         @@search
      for (let v = 0; v < n; v++)                  @@search
        if (cap[u][v] > 0 && parent[v] < 0) { parent[v] = u; q.push(v); }   @@search
    }
    if (parent[t] < 0) return flow;                @@done
    let b = Infinity;                              @@search
    for (let v = t; v !== s; v = parent[v]) b = Math.min(b, cap[parent[v]][v]);   @@search
    for (let v = t; v !== s; v = parent[v]) {      @@augment
      cap[parent[v]][v] -= b;                      @@augment
      cap[v][parent[v]] += b;                      @@augment
    }
    flow += b;                                     @@augment
  }
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph, true);
    const n = graph.nodes.length;
    const cap = graph.nodes.map(() => graph.nodes.map(() => 0));
    for (const { u, v, w } of graph.edges) cap[u][v] = w;
    const res = cap.map((row) => row.slice());
    const flowOn = (u: number, v: number) => cap[u][v] - res[u][v];
    const names = (path: number[]) => path.map((i) => t.name(i)).join("→");

    const search = (from: number, goal?: number) => {
      const parent = graph.nodes.map(() => -1);
      parent[from] = from;
      const queue = [from];
      while (queue.length > 0 && (goal === undefined || parent[goal] < 0)) {
        const u = queue.shift()!;
        for (let v = 0; v < n; v++)
          if (res[u][v] > 0 && parent[v] < 0) {
            parent[v] = u;
            queue.push(v);
          }
      }
      return parent;
    };

    const source = start;
    const reach = search(source);
    const sink = reach.reduce((best, p, i) => (p >= 0 && i !== source ? i : best), -1);

    const paths: string[] = [];
    let total = 0;
    const aux = () => ({ title: "Augmenting paths", items: paths });
    const show = (path: number[]) => {
      const onPath = new Set(path.slice(1).map((v, i) => edgeKey(path[i], v)));
      graph.nodes.forEach(({ id }) => (t.nodes[id] = path.includes(id) ? "frontier" : undefined));
      for (const { u, v } of graph.edges) {
        const key = edgeKey(u, v);
        t.edges[key] = onPath.has(key) ? "considered" : res[u][v] === 0 ? "tree" : undefined;
        t.labelEdge(u, v, `${flowOn(u, v)}/${cap[u][v]}`);
      }
    };

    t.labels[source] = "source";
    if (sink >= 0) t.labels[sink] = "sink";
    show([]);
    const where = sink >= 0 ? `to the sink ${t.name(sink)}` : "to any other node";
    t.step("init", `Push flow from the source ${t.name(source)} ${where}. Each edge reads flow/capacity and starts at 0.`, aux(), { vars: { flow: 0 } });

    let reachable = new Set<number>([source]);
    while (sink >= 0) {
      const parent = search(source, sink);
      reachable = new Set(parent.flatMap((p, i) => (p >= 0 ? [i] : [])));
      if (parent[sink] < 0) {
        t.step("search", `Round ${paths.length + 1}: BFS over edges with spare capacity cannot reach ${t.name(sink)} any more.`, aux(), { vars: { flow: total } });
        break;
      }
      const path = [sink];
      while (path[0] !== source) path.unshift(parent[path[0]]);
      const hops = path.slice(1).map((v, i) => ({ u: path[i], v }));
      const bottleneck = Math.min(...hops.map(({ u, v }) => res[u][v]));
      const tight = hops.find(({ u, v }) => res[u][v] === bottleneck)!;
      const undone = hops.filter(({ u, v }) => cap[u][v] === 0).map(({ u, v }) => `${t.name(u)}→${t.name(v)}`);
      const cancel = undone.length ? ` ${undone.join(", ")} runs backwards, so it cancels flow.` : "";
      show(path);
      t.step(
        "search",
        `Round ${paths.length + 1}: the shortest path with spare capacity is ${names(path)}. Its smallest spare is ${bottleneck} on ${t.name(tight.u)}→${t.name(tight.v)}, so the bottleneck is ${bottleneck}.${cancel}`,
        aux(),
        { vars: { bottleneck, flow: total } },
      );
      for (const { u, v } of hops) {
        res[u][v] -= bottleneck;
        res[v][u] += bottleneck;
      }
      total += bottleneck;
      paths.push(`${names(path)} +${bottleneck}`);
      const full = hops.filter(({ u, v }) => cap[u][v] > 0 && res[u][v] === 0).map(({ u, v }) => `${t.name(u)}→${t.name(v)}`);
      const filled = full.length ? ` Now at capacity: ${full.join(", ")}.` : "";
      show([]);
      graph.nodes.forEach(({ id }) => path.includes(id) && (t.nodes[id] = "frontier"));
      t.step("augment", `Push ${bottleneck} along ${names(path)}. The flow is now ${total}.${filled}`, aux(), { vars: { bottleneck, flow: total } });
    }

    show([]);
    graph.nodes.forEach(({ id }) => (t.nodes[id] = "visited"));
    if (sink < 0) {
      t.step("done", `${t.name(source)} has no edge to follow, so no flow can leave it. The max flow is 0.`, aux(), { vars: { flow: 0 } });
      return t.frames;
    }
    const side = [...reachable].map((i) => t.name(i)).join(", ");
    const cut = graph.edges.filter(({ u, v }) => reachable.has(u) && !reachable.has(v)).reduce((sum, { w }) => sum + w, 0);
    t.step(
      "done",
      `No path is left. The max flow is ${total}, equal to the capacity ${cut} of the cut between {${side}} and the rest.`,
      { title: "Min cut, source side", items: [...reachable].map((i) => t.name(i)) },
      { vars: { flow: total } },
    );
    return t.frames;
  },
};
