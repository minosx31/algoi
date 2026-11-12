import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";
import { edgeKey } from "../../core/types";

export const bipartite: GraphAlgorithm = {
  id: "bipartite",
  name: "Bipartite Check",
  kind: "graph",
  topic: "graph",
  weighted: false,
  about: {
    summary: "Two-colours the graph with a BFS: every neighbour gets the opposite side. An edge whose ends land on the same side proves an odd cycle.",
    invariants: [
      "Each node's side is set once, from the node that discovered it, and never changes.",
      "A graph is bipartite exactly when it has no odd cycle, and BFS levels alternate sides.",
      "Any edge that joins two nodes on the same side, plus the BFS tree paths between them, forms an odd cycle.",
    ],
    useCases: [
      "Scheduling that must avoid conflicts, such as splitting exams into two slots.",
      "Matching problems, which start from a bipartite graph of jobs and workers.",
      "Quick test of whether a conflict graph can be solved with two colours.",
    ],
  },
  complexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)", space: "O(V)" },
  code: {
    pseudo: `
procedure IsBipartite(G, s)
  side[s] ← L; ok ← true                         @@init
  Q ← queue containing s                         @@init
  while Q is not empty do                        @@loop
    u ← Q.dequeue()                              @@dequeue
    for each neighbor v of u do                  @@neighbor
      if v has no side yet then                  @@check
        side[v] ← opposite of side[u]            @@paint
        Q.enqueue(v)                             @@paint
      else if side[v] = side[u] then             @@conflict
        ok ← false                               @@conflict
  return ok                                      @@done
`,
    python: `
from collections import deque

def is_bipartite(adj, s):
    side = {s: 0}                                @@init
    q, ok = deque([s]), True                     @@init
    while q:                                     @@loop
        u = q.popleft()                          @@dequeue
        for v in adj[u]:                         @@neighbor
            if v not in side:                    @@check
                side[v] = 1 - side[u]            @@paint
                q.append(v)                      @@paint
            elif side[v] == side[u]:             @@conflict
                ok = False                       @@conflict
    return ok                                    @@done
`,
    cpp: `
bool isBipartite(const std::vector<std::vector<int>>& adj, int s) {
    std::vector<int> side(adj.size(), -1);
    std::queue<int> q;
    side[s] = 0; q.push(s);                      @@init
    bool ok = true;                              @@init
    while (!q.empty()) {                         @@loop
        int u = q.front(); q.pop();              @@dequeue
        for (int v : adj[u]) {                   @@neighbor
            if (side[v] == -1) {                 @@check
                side[v] = 1 - side[u];           @@paint
                q.push(v);                       @@paint
            } else if (side[v] == side[u]) {     @@conflict
                ok = false;                      @@conflict
            }
        }
    }
    return ok;                                   @@done
}
`,
    java: `
static boolean isBipartite(List<List<Integer>> adj, int s) {
    int[] side = new int[adj.size()];
    Arrays.fill(side, -1);
    Deque<Integer> q = new ArrayDeque<>();
    side[s] = 0; q.add(s);                       @@init
    boolean ok = true;                           @@init
    while (!q.isEmpty()) {                       @@loop
        int u = q.poll();                        @@dequeue
        for (int v : adj.get(u)) {               @@neighbor
            if (side[v] == -1) {                 @@check
                side[v] = 1 - side[u];           @@paint
                q.add(v);                        @@paint
            } else if (side[v] == side[u]) {     @@conflict
                ok = false;                      @@conflict
            }
        }
    }
    return ok;                                   @@done
}
`,
    javascript: `
function isBipartite(adj, s) {
  const side = new Map([[s, 0]]);                @@init
  const q = [s];                                 @@init
  let ok = true;                                 @@init
  while (q.length > 0) {                         @@loop
    const u = q.shift();                         @@dequeue
    for (const v of adj[u]) {                    @@neighbor
      if (!side.has(v)) {                        @@check
        side.set(v, 1 - side.get(u));            @@paint
        q.push(v);                               @@paint
      } else if (side.get(v) === side.get(u)) {  @@conflict
        ok = false;                              @@conflict
      }
    }
  }
  return ok;                                     @@done
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph);
    const side = new Map<number, "L" | "R">([[start, "L"]]);
    const queue = [start];
    const conflicts = new Set<string>();
    const aux = () => ({ title: "Queue (front → back)", items: queue.map((i) => t.name(i)) });

    t.nodes[start] = "frontier";
    t.labels[start] = "L";
    t.step("init", `Put ${t.name(start)} on side L and in the queue. Every neighbour will go on the opposite side.`, aux());

    while (queue.length > 0) {
      t.step("loop", `Queue has ${queue.length} node(s); keep going.`, aux());
      const u = queue.shift()!;
      const uName = t.name(u);
      t.nodes[u] = "visited";
      t.step("dequeue", `Dequeue ${uName} (side ${side.get(u)}).`, aux(), { current: u, vars: { u: uName } });
      for (const { to: v } of t.adj[u]) {
        const vName = t.name(v);
        const vars = { u: uName, v: vName };
        const key = edgeKey(u, v);
        if (!side.has(v)) {
          const opposite = side.get(u) === "L" ? "R" : "L";
          side.set(v, opposite);
          queue.push(v);
          t.nodes[v] = "frontier";
          t.labels[v] = opposite;
          t.edge(u, v, "tree");
          t.step("paint", `${vName} is new, so it goes on side ${opposite}, opposite ${uName}'s ${side.get(u)}. Enqueue it.`, aux(), { current: u, considered: [u, v], vars });
        } else if (side.get(v) === side.get(u)) {
          t.step("check", `${vName} is already on side ${side.get(v)}, the same as ${uName}.`, aux(), { current: u, considered: [u, v], vars });
          if (!conflicts.has(key)) {
            conflicts.add(key);
            t.edge(u, v, "considered");
            t.step("conflict", `${uName}–${vName} joins two nodes on side ${side.get(u)}, so the graph has an odd cycle and is not bipartite.`, aux(), {
              current: u,
              considered: [u, v],
              vars,
            });
          }
        } else {
          t.step("check", `${vName} is already on side ${side.get(v)}, opposite ${uName}'s ${side.get(u)}. Fine.`, aux(), { current: u, considered: [u, v], vars });
        }
      }
    }
    const ok = conflicts.size === 0;
    const verdict = ok
      ? "No edge joins two nodes on the same side, so the graph is bipartite."
      : `${conflicts.size} edge${conflicts.size === 1 ? "" : "s"} join${conflicts.size === 1 ? "s" : ""} two nodes on the same side, so the graph has an odd cycle and is not bipartite.`;
    t.step("done", verdict, aux(), { vars: { bipartite: ok ? "yes" : "no" } });
    return t.frames;
  },
};
