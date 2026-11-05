import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const dfs: GraphAlgorithm = {
  id: "dfs",
  name: "Depth-First Search",
  kind: "graph",
  weighted: false,
  summary:
    "Goes as deep as possible along one path before backing up. Each recursive call explores one node, so the call stack always holds the path from the start to the node being explored.",
  complexity: { time: "O(V + E)", space: "O(V)" },
  code: {
    pseudo: `
procedure DFS(G, s)
  visited ← ∅; order ← [ ]; post ← [ ]      @@init
  VISIT(s)                                   @@init

procedure VISIT(u)
  visited ← visited ∪ {u}; order.append(u)  @@discover
  for each neighbor v of u do               @@neighbor
    if v ∉ visited then                     @@check
      VISIT(v)                              @@recurse
  post.append(u)                            @@finish
`,
    python: `
def dfs(adj, s):
    seen, order, post = set(), [], []       @@init

    def visit(u):
        seen.add(u); order.append(u)        @@discover
        for v in adj[u]:                    @@neighbor
            if v not in seen:               @@check
                visit(v)                    @@recurse
        post.append(u)                      @@finish

    visit(s)                                @@init
    return order, post
`,
    cpp: `
void visit(const std::vector<std::vector<int>>& adj, int u, std::vector<bool>& seen,
           std::vector<int>& order, std::vector<int>& post) {
    seen[u] = true; order.push_back(u);         @@discover
    for (int v : adj[u]) {                      @@neighbor
        if (!seen[v]) {                         @@check
            visit(adj, v, seen, order, post);   @@recurse
        }
    }
    post.push_back(u);                          @@finish
}

void dfs(const std::vector<std::vector<int>>& adj, int s,
         std::vector<int>& order, std::vector<int>& post) {
    std::vector<bool> seen(adj.size());         @@init
    visit(adj, s, seen, order, post);           @@init
}
`,
    java: `
static void visit(List<List<Integer>> adj, int u, boolean[] seen,
                  List<Integer> order, List<Integer> post) {
    seen[u] = true; order.add(u);               @@discover
    for (int v : adj.get(u)) {                  @@neighbor
        if (!seen[v]) {                         @@check
            visit(adj, v, seen, order, post);   @@recurse
        }
    }
    post.add(u);                                @@finish
}

static void dfs(List<List<Integer>> adj, int s, List<Integer> order, List<Integer> post) {
    boolean[] seen = new boolean[adj.size()];   @@init
    visit(adj, s, seen, order, post);           @@init
}
`,
    javascript: `
function dfs(adj, s) {
  const seen = new Set(), order = [], post = [];  @@init

  function visit(u) {
    seen.add(u); order.push(u);                   @@discover
    for (const v of adj[u]) {                     @@neighbor
      if (!seen.has(v)) {                         @@check
        visit(v);                                 @@recurse
      }
    }
    post.push(u);                                 @@finish
  }

  visit(s);                                       @@init
  return { order, post };
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph);
    const seen = new Set<number>();
    const stack: number[] = [];
    const aux = () => ({ title: "Call stack (bottom → top)", items: stack.map((i) => t.name(i)) });

    t.step("init", `Start DFS from ${t.name(start)}. Nothing is visited yet and the call stack is empty.`, aux());

    const visit = (u: number) => {
      seen.add(u);
      stack.push(u);
      t.nodes[u] = "frontier";
      t.labels[u] = String(seen.size);
      t.step("discover", `Call visit(${t.name(u)}): discovered ${t.name(u)} as node #${seen.size}, push it on the call stack.`, aux(), {
        current: u,
        vars: { u: t.name(u) },
      });
      for (const { to: v } of t.adj[u]) {
        const vars = { u: t.name(u), v: t.name(v) };
        if (seen.has(v)) {
          t.step("check", `Edge ${t.name(u)}–${t.name(v)}: ${t.name(v)} is already discovered, skip it.`, aux(), { current: u, considered: [u, v], vars });
          continue;
        }
        t.step("check", `Edge ${t.name(u)}–${t.name(v)}: ${t.name(v)} is new, go deeper.`, aux(), { current: u, considered: [u, v], vars });
        t.edge(u, v, "tree");
        t.step("recurse", `${t.name(u)} calls visit(${t.name(v)}).`, aux(), { current: u, vars });
        visit(v);
      }
      t.nodes[u] = "visited";
      stack.pop();
      const caller = stack[stack.length - 1];
      const back = caller === undefined ? "the call stack is empty, so DFS is done" : `return to ${t.name(caller)}`;
      t.step("finish", `All neighbors of ${t.name(u)} are explored. Pop ${t.name(u)} and ${back}.`, aux(), { current: caller, vars: { u: t.name(u) } });
    };

    visit(start);
    return t.frames;
  },
};
