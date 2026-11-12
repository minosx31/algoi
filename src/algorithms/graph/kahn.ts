import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const kahn: GraphAlgorithm = {
  id: "kahn",
  name: "Topological Sort (Kahn)",
  kind: "graph",
  topic: "graph",
  weighted: false,
  directed: "acyclic",
  ignoresStart: true,
  about: {
    summary: "Repeatedly removes a node that has no incoming edges, appends it to the order, and lowers the in-degree of the nodes it points to.",
    invariants: [
      "A node enters the queue only when every node it depends on is already in the order.",
      "The order never places a node after one that depends on it, so every arrow points forward.",
      "If the order ends shorter than the node count, the leftover nodes sit on or behind a cycle.",
    ],
    useCases: [
      "Build systems and package managers order compilation and installs by dependency.",
      "Task schedulers and CI pipelines run each job after the jobs it needs.",
      "Course prerequisites and spreadsheet cell recalculation.",
    ],
  },
  complexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)", space: "O(V)" },
  code: {
    pseudo: `
procedure Kahn(G)
  indeg[v] ← number of edges into v, for every v   @@init
  queue ← every node with indeg[v] = 0             @@seed
  order ← [ ]
  while queue is not empty do
    u ← queue.dequeue(); order.append(u)           @@pop
    for each edge (u, v) do                        @@relax
      indeg[v] ← indeg[v] − 1                      @@relax
      if indeg[v] = 0 then                         @@ready
        queue.enqueue(v)                           @@ready
  if |order| < |V| then return "cycle"             @@done
  return order                                     @@done
`,
    python: `
from collections import deque

def kahn(adj):
    indeg = {v: 0 for v in adj}                    @@init
    for u in adj:                                  @@init
        for v in adj[u]:                           @@init
            indeg[v] += 1                          @@init
    queue = deque(v for v in adj if indeg[v] == 0) @@seed
    order = []
    while queue:
        u = queue.popleft()                        @@pop
        order.append(u)                            @@pop
        for v in adj[u]:                           @@relax
            indeg[v] -= 1                          @@relax
            if indeg[v] == 0:                      @@ready
                queue.append(v)                    @@ready
    return order if len(order) == len(adj) else None   @@done
`,
    cpp: `
std::vector<int> kahn(const std::vector<std::vector<int>>& adj) {
    int n = adj.size();
    std::vector<int> indeg(n, 0);                  @@init
    for (auto& out : adj)                          @@init
        for (int v : out) indeg[v]++;              @@init
    std::queue<int> q;
    for (int v = 0; v < n; v++)                    @@seed
        if (indeg[v] == 0) q.push(v);              @@seed
    std::vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();                @@pop
        order.push_back(u);                        @@pop
        for (int v : adj[u]) {                     @@relax
            indeg[v]--;                            @@relax
            if (indeg[v] == 0) q.push(v);          @@ready
        }
    }
    if ((int)order.size() < n) return {};          @@done
    return order;                                  @@done
}
`,
    java: `
static List<Integer> kahn(List<List<Integer>> adj) {
    int n = adj.size();
    int[] indeg = new int[n];                      @@init
    for (List<Integer> out : adj)                  @@init
        for (int v : out) indeg[v]++;              @@init
    Deque<Integer> queue = new ArrayDeque<>();
    for (int v = 0; v < n; v++)                    @@seed
        if (indeg[v] == 0) queue.add(v);           @@seed
    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int u = queue.poll();                      @@pop
        order.add(u);                              @@pop
        for (int v : adj.get(u)) {                 @@relax
            indeg[v]--;                            @@relax
            if (indeg[v] == 0) queue.add(v);       @@ready
        }
    }
    return order.size() == n ? order : null;       @@done
}
`,
    javascript: `
function kahn(adj) {
  const n = adj.length;
  const indeg = new Array(n).fill(0);              @@init
  for (const out of adj) for (const v of out) indeg[v]++;   @@init
  const queue = [];
  for (let v = 0; v < n; v++) if (indeg[v] === 0) queue.push(v);   @@seed
  const order = [];
  while (queue.length > 0) {
    const u = queue.shift();                       @@pop
    order.push(u);                                 @@pop
    for (const v of adj[u]) {                      @@relax
      indeg[v]--;                                  @@relax
      if (indeg[v] === 0) queue.push(v);           @@ready
    }
  }
  return order.length === n ? order : null;        @@done
}
`,
  },
  run(graph) {
    const t = new GraphTracer(graph, true);
    const n = graph.nodes.length;
    const indeg = graph.nodes.map(() => 0);
    for (const { v } of graph.edges) indeg[v]++;
    const queue: number[] = [];
    const order: number[] = [];
    const names = (ids: number[]) => (ids.length ? ids.map((i) => t.name(i)).join(", ") : "nothing");
    const aux = () => ({ title: "Order so far", items: order.map((i) => t.name(i)) });

    graph.nodes.forEach(({ id }) => (t.labels[id] = String(indeg[id])));
    t.step("init", "Count the edges into each node. The number under a node is its in-degree.", aux());

    graph.nodes.forEach(({ id }) => {
      if (indeg[id] === 0) {
        queue.push(id);
        t.nodes[id] = "frontier";
      }
    });
    t.step("seed", `A node with in-degree 0 depends on nothing, so queue it. Queue: ${names(queue)}.`, aux());

    while (queue.length > 0) {
      const u = queue.shift()!;
      order.push(u);
      t.nodes[u] = "visited";
      t.step("pop", `Pop ${t.name(u)} and place it at position ${order.length} in the order.`, aux(), { current: u, vars: { u: t.name(u) } });
      for (const { to: v } of t.adj[u]) {
        const was = indeg[v]--;
        t.labels[v] = String(indeg[v]);
        const vars = { u: t.name(u), v: t.name(v), indeg: indeg[v] };
        t.step("relax", `Remove edge ${t.name(u)}→${t.name(v)}: the in-degree of ${t.name(v)} drops from ${was} to ${indeg[v]}.`, aux(), {
          current: u,
          considered: [u, v],
          vars,
        });
        t.edge(u, v, "tree");
        if (indeg[v] > 0) continue;
        queue.push(v);
        t.nodes[v] = "frontier";
        t.step("ready", `${t.name(v)} now waits on nothing, so queue it. Queue: ${names(queue)}.`, aux(), { current: v, vars });
      }
    }

    const note =
      order.length === n
        ? `All ${n} nodes are ordered: ${names(order)}. Every arrow points from an earlier node to a later one.`
        : `Only ${order.length} of ${n} nodes could be ordered. The rest wait on each other, so the graph has a cycle.`;
    t.step("done", note, aux());
    return t.frames;
  },
};
