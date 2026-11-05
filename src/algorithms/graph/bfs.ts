import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const bfs: GraphAlgorithm = {
  id: "bfs",
  name: "Breadth-First Search",
  kind: "graph",
  weighted: false,
  summary:
    "Explores the graph in rings: every node one edge away, then two, and so on. A FIFO queue holds the frontier, so the first time a node is reached is along a shortest (fewest-edges) path.",
  complexity: { time: "O(V + E)", space: "O(V)" },
  code: {
    pseudo: `
procedure BFS(G, s)
  visited ← {s}; dist[s] ← 0               @@init
  Q ← queue containing s                    @@init
  while Q is not empty do                   @@loop
    u ← Q.dequeue()                         @@dequeue
    for each neighbor v of u do             @@neighbor
      if v ∉ visited then                   @@check
        visited ← visited ∪ {v}             @@enqueue
        dist[v] ← dist[u] + 1               @@enqueue
        Q.enqueue(v)                        @@enqueue
`,
    python: `
from collections import deque

def bfs(adj, s):
    dist = {s: 0}                           @@init
    q = deque([s])                          @@init
    while q:                                @@loop
        u = q.popleft()                     @@dequeue
        for v in adj[u]:                    @@neighbor
            if v not in dist:               @@check
                dist[v] = dist[u] + 1       @@enqueue
                q.append(v)                 @@enqueue
    return dist
`,
    cpp: `
std::vector<int> bfs(const std::vector<std::vector<int>>& adj, int s) {
    std::vector<int> dist(adj.size(), -1);
    std::queue<int> q;
    dist[s] = 0; q.push(s);                     @@init
    while (!q.empty()) {                        @@loop
        int u = q.front(); q.pop();             @@dequeue
        for (int v : adj[u]) {                  @@neighbor
            if (dist[v] == -1) {                @@check
                dist[v] = dist[u] + 1;          @@enqueue
                q.push(v);                      @@enqueue
            }
        }
    }
    return dist;
}
`,
    java: `
static int[] bfs(List<List<Integer>> adj, int s) {
    int[] dist = new int[adj.size()];
    Arrays.fill(dist, -1);
    Deque<Integer> q = new ArrayDeque<>();
    dist[s] = 0; q.add(s);                      @@init
    while (!q.isEmpty()) {                      @@loop
        int u = q.poll();                       @@dequeue
        for (int v : adj.get(u)) {              @@neighbor
            if (dist[v] == -1) {                @@check
                dist[v] = dist[u] + 1;          @@enqueue
                q.add(v);                       @@enqueue
            }
        }
    }
    return dist;
}
`,
    javascript: `
function bfs(adj, s) {
  const dist = new Map([[s, 0]]);               @@init
  const q = [s];                                @@init
  while (q.length > 0) {                        @@loop
    const u = q.shift();                        @@dequeue
    for (const v of adj[u]) {                   @@neighbor
      if (!dist.has(v)) {                       @@check
        dist.set(v, dist.get(u) + 1);           @@enqueue
        q.push(v);                              @@enqueue
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
    const queue = [start];
    const aux = () => ({ title: "Queue (front → back)", items: queue.map((i) => t.name(i)) });

    t.nodes[start] = "frontier";
    t.labels[start] = "0";
    t.step("init", `Start at ${t.name(start)} with distance 0 and put it in the queue.`, aux());

    while (queue.length > 0) {
      t.step("loop", `Queue has ${queue.length} node(s); keep going.`, aux());
      const u = queue.shift()!;
      t.nodes[u] = "visited";
      t.step("dequeue", `Dequeue ${t.name(u)} (distance ${dist.get(u)}).`, aux(), { current: u, vars: { u: t.name(u) } });
      for (const { to: v } of t.adj[u]) {
        t.step("check", `Look at edge ${t.name(u)}–${t.name(v)}.`, aux(), { current: u, considered: [u, v], vars: { u: t.name(u), v: t.name(v) } });
        if (!dist.has(v)) {
          dist.set(v, dist.get(u)! + 1);
          queue.push(v);
          t.nodes[v] = "frontier";
          t.labels[v] = String(dist.get(v));
          t.edge(u, v, "tree");
          t.step("enqueue", `${t.name(v)} is new: distance ${dist.get(v)}, enqueue it.`, aux(), { current: u, vars: { u: t.name(u), v: t.name(v) } });
        }
      }
    }
    t.step("loop", "Queue is empty. Every reachable node has its fewest-edges distance.", aux());
    return t.frames;
  },
};
