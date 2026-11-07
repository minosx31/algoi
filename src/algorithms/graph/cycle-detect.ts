import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const cycleDetect: GraphAlgorithm = {
  id: "cycle-detect",
  name: "Cycle Detection (3-colour DFS)",
  kind: "graph",
  topic: "graph",
  weighted: false,
  directed: "cyclic",
  stopsAtCycle: true,
  about: {
    summary: "Runs a depth-first search that colours each node white, grey, or black, and reports a cycle the moment an edge points at a grey node.",
    invariants: [
      "The grey nodes are exactly the nodes on the current recursion stack, in call order.",
      "A black node and everything reachable from it is finished and cannot reach a grey node.",
      "An edge to a grey node closes a cycle made of the stack from that node down to the current one.",
    ],
    useCases: [
      "Deadlock detection: a cycle in a wait-for graph means the lock holders are stuck.",
      "Circular dependencies in imports, build targets, and package managers.",
      "Validating that a workflow or schema graph is a DAG before sorting it topologically.",
    ],
  },
  complexity: { best: "O(1)", average: "O(V + E)", worst: "O(V + E)", space: "O(V)" },
  code: {
    pseudo: `
procedure HasCycle(G, s)
  colour[v] ← white for every node v               @@init
  for each node u, starting with s do              @@done
    if colour[u] = white and VISIT(u) then         @@done
      return true                                  @@done
  return false                                     @@done

procedure VISIT(u)
  colour[u] ← grey                                 @@visit
  for each edge (u, v) do                          @@check
    if colour[v] = grey then return true           @@back
    if colour[v] = white and VISIT(v) then         @@check
      return true
  colour[u] ← black                                @@finish
  return false
`,
    python: `
def has_cycle(adj, start):
    WHITE, GREY, BLACK = 0, 1, 2
    color = {u: WHITE for u in adj}                @@init

    def visit(u):
        color[u] = GREY                            @@visit
        for v in adj[u]:                           @@check
            if color[v] == GREY:                   @@back
                return True                        @@back
            if color[v] == WHITE and visit(v):     @@check
                return True
        color[u] = BLACK                           @@finish
        return False

    for u in [start, *adj]:                        @@done
        if color[u] == WHITE and visit(u):         @@done
            return True                            @@done
    return False                                   @@done
`,
    cpp: `
// color: 0 white, 1 grey, 2 black
bool visit(const std::vector<std::vector<int>>& adj, std::vector<int>& color, int u) {
    color[u] = 1;                                  @@visit
    for (int v : adj[u]) {                         @@check
        if (color[v] == 1) return true;            @@back
        if (color[v] == 0 && visit(adj, color, v)) return true;   @@check
    }
    color[u] = 2;                                  @@finish
    return false;
}

bool hasCycle(const std::vector<std::vector<int>>& adj, int s) {
    int n = adj.size();
    std::vector<int> color(n, 0);                  @@init
    std::vector<int> roots{s};
    for (int i = 0; i < n; i++) roots.push_back(i);
    for (int u : roots)                            @@done
        if (color[u] == 0 && visit(adj, color, u)) return true;   @@done
    return false;                                  @@done
}
`,
    java: `
// color: 0 white, 1 grey, 2 black
static boolean visit(List<List<Integer>> adj, int[] color, int u) {
    color[u] = 1;                                  @@visit
    for (int v : adj.get(u)) {                     @@check
        if (color[v] == 1) return true;            @@back
        if (color[v] == 0 && visit(adj, color, v)) return true;   @@check
    }
    color[u] = 2;                                  @@finish
    return false;
}

static boolean hasCycle(List<List<Integer>> adj, int s) {
    int n = adj.size();
    int[] color = new int[n];                      @@init
    List<Integer> roots = new ArrayList<>(List.of(s));
    for (int i = 0; i < n; i++) roots.add(i);
    for (int u : roots)                            @@done
        if (color[u] == 0 && visit(adj, color, u)) return true;   @@done
    return false;                                  @@done
}
`,
    javascript: `
// color: 0 white, 1 grey, 2 black
function hasCycle(adj, start) {
  const color = new Array(adj.length).fill(0);     @@init

  function visit(u) {
    color[u] = 1;                                  @@visit
    for (const v of adj[u]) {                      @@check
      if (color[v] === 1) return true;             @@back
      if (color[v] === 0 && visit(v)) return true; @@check
    }
    color[u] = 2;                                  @@finish
    return false;
  }

  for (const u of [start, ...adj.keys()])          @@done
    if (color[u] === 0 && visit(u)) return true;   @@done
  return false;                                    @@done
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph, true);
    const color = graph.nodes.map(() => "white");
    const stack: number[] = [];
    const aux = () => ({ title: "Grey stack (bottom → top)", items: stack.map((i) => t.name(i)) });

    t.step("init", `Every node starts white, meaning not seen yet. Start the search at ${t.name(start)}.`, aux());

    const visit = (u: number): boolean => {
      color[u] = "grey";
      stack.push(u);
      t.nodes[u] = "frontier";
      t.labels[u] = "grey";
      t.step("visit", `Visit ${t.name(u)}: colour it grey and push it on the stack.`, aux(), { current: u, vars: { u: t.name(u) } });
      for (const { to: v } of t.adj[u]) {
        const vars = { u: t.name(u), v: t.name(v), colour: color[v] };
        if (color[v] === "grey") {
          const loop = [...stack.slice(stack.indexOf(v)), v];
          t.step("back", `Edge ${t.name(u)}→${t.name(v)} points at ${t.name(v)}, which is grey and still on the stack. That closes the cycle ${loop.map((i) => t.name(i)).join("→")}.`, aux(), {
            current: v,
            considered: [u, v],
            vars,
          });
          for (const key of Object.keys(t.edges)) delete t.edges[key];
          loop.slice(1).forEach((to, i) => t.edge(loop[i], to, "tree"));
          graph.nodes.forEach(({ id }) => (t.nodes[id] = loop.includes(id) ? "visited" : undefined));
          return true;
        }
        const verdict =
          color[v] === "white"
            ? `${t.name(v)} is white, so go deeper.`
            : `${t.name(v)} is black: it and everything below it finished without reaching a grey node. Skip it.`;
        t.step("check", `Edge ${t.name(u)}→${t.name(v)}: ${verdict}`, aux(), { current: u, considered: [u, v], vars });
        if (color[v] === "white") {
          t.edge(u, v, "tree");
          if (visit(v)) return true;
        }
      }
      color[u] = "black";
      stack.pop();
      t.nodes[u] = "visited";
      t.labels[u] = "black";
      const caller = stack[stack.length - 1];
      const back = caller === undefined ? "the stack is empty" : `return to ${t.name(caller)}`;
      t.step("finish", `All edges out of ${t.name(u)} are checked. Colour it black, pop it, and ${back}.`, aux(), { current: caller, vars: { u: t.name(u) } });
      return false;
    };

    for (const u of [start, ...graph.nodes.map((n) => n.id)]) {
      if (color[u] !== "white") continue;
      if (visit(u)) {
        t.step("done", "Cycle found, so this graph is not a DAG. The cycle is drawn in green.", aux(), { vars: { cycle: "yes" } });
        return t.frames;
      }
    }
    t.step("done", "Every node is black and no edge pointed at a grey node, so there is no cycle.", aux(), { vars: { cycle: "no" } });
    return t.frames;
  },
};
