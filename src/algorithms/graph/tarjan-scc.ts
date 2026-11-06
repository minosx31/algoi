import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const tarjanScc: GraphAlgorithm = {
  id: "tarjan-scc",
  name: "Strongly Connected Components (Tarjan)",
  kind: "graph",
  topic: "graph",
  weighted: false,
  directed: "cyclic",
  about: {
    summary: "Runs one depth-first search and tracks, for each node, the earliest discovered node it can reach (its low-link). A node whose low-link equals its own discovery time is the root of a component.",
    invariants: [
      "The stack holds the nodes that are discovered but not yet assigned to a component.",
      "low[u] is the smallest discovery time reachable from u's subtree using at most one edge back into the stack.",
      "When low[u] = disc[u], everything above u on the stack is exactly one strongly connected component.",
    ],
    useCases: [
      "Collapsing a dependency or call graph into its cycles, which leaves a DAG you can sort.",
      "Finding groups of mutually recursive functions or packages that import each other.",
      "2-SAT solvers and model checkers use the components to decide satisfiability.",
    ],
  },
  complexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)", space: "O(V)" },
  code: {
    pseudo: `
procedure Tarjan(G, s)
  disc[v] ← unset for every v; stack ← [ ]; time ← 0   @@init
  for each node u, starting with s do              @@done
    if disc[u] is unset then VISIT(u)              @@done

procedure VISIT(u)
  disc[u] ← low[u] ← time; time ← time + 1         @@visit
  push u on the stack                              @@visit
  for each edge (u, v) do                          @@edge
    if disc[v] is unset then                       @@edge
      VISIT(v)                                     @@edge
      low[u] ← min(low[u], low[v])                 @@lowlink
    else if v is on the stack then                 @@edge
      low[u] ← min(low[u], disc[v])                @@lowlink
  if low[u] = disc[u] then                         @@root
    pop the stack down to u                        @@pop
    those nodes are one component                  @@pop
`,
    python: `
def tarjan(adj, start):
    disc, low, stack, comps = {}, {}, [], []       @@init

    def visit(u):
        disc[u] = low[u] = len(disc)               @@visit
        stack.append(u)                            @@visit
        for v in adj[u]:                           @@edge
            if v not in disc:                      @@edge
                visit(v)                           @@edge
                low[u] = min(low[u], low[v])       @@lowlink
            elif v in stack:                       @@edge
                low[u] = min(low[u], disc[v])      @@lowlink
        if low[u] == disc[u]:                      @@root
            comp = []                              @@pop
            while not comp or comp[-1] != u:       @@pop
                comp.append(stack.pop())           @@pop
            comps.append(comp)                     @@pop

    for u in [start, *adj]:                        @@done
        if u not in disc:                          @@done
            visit(u)                               @@done
    return comps                                   @@done
`,
    cpp: `
std::vector<std::vector<int>> tarjan(const std::vector<std::vector<int>>& adj, int s) {
    int n = adj.size(), timer = 0;
    std::vector<int> disc(n, -1), low(n), stack;   @@init
    std::vector<std::vector<int>> comps;
    std::function<void(int)> visit = [&](int u) {
        disc[u] = low[u] = timer++;                @@visit
        stack.push_back(u);                        @@visit
        for (int v : adj[u]) {                     @@edge
            if (disc[v] < 0) {                     @@edge
                visit(v);                          @@edge
                low[u] = std::min(low[u], low[v]); @@lowlink
            } else if (std::count(stack.begin(), stack.end(), v)) {   @@edge
                low[u] = std::min(low[u], disc[v]);   @@lowlink
            }
        }
        if (low[u] == disc[u]) {                   @@root
            std::vector<int> comp;                 @@pop
            int w;                                 @@pop
            do { w = stack.back(); stack.pop_back(); comp.push_back(w); } while (w != u);   @@pop
            comps.push_back(comp);                 @@pop
        }
    };
    visit(s);                                      @@done
    for (int u = 0; u < n; u++) if (disc[u] < 0) visit(u);   @@done
    return comps;                                  @@done
}
`,
    java: `
static int timer;
static int[] disc, low;
static Deque<Integer> stack = new ArrayDeque<>();
static List<List<Integer>> comps = new ArrayList<>();
static void visit(List<List<Integer>> adj, int u) {
    disc[u] = low[u] = timer++;                    @@visit
    stack.push(u);                                 @@visit
    for (int v : adj.get(u)) {                     @@edge
        if (disc[v] < 0) {                         @@edge
            visit(adj, v);                         @@edge
            low[u] = Math.min(low[u], low[v]);     @@lowlink
        } else if (stack.contains(v)) {            @@edge
            low[u] = Math.min(low[u], disc[v]);    @@lowlink
        }
    }
    if (low[u] == disc[u]) {                       @@root
        List<Integer> comp = new ArrayList<>();    @@pop
        int w;                                     @@pop
        do { w = stack.pop(); comp.add(w); } while (w != u);   @@pop
        comps.add(comp);                           @@pop
    }
}

static List<List<Integer>> tarjan(List<List<Integer>> adj, int s) {
    disc = new int[adj.size()]; low = new int[adj.size()]; Arrays.fill(disc, -1);   @@init
    visit(adj, s);                                 @@done
    for (int u = 0; u < adj.size(); u++) if (disc[u] < 0) visit(adj, u);   @@done
    return comps;                                  @@done
}
`,
    javascript: `
function tarjan(adj, start) {
  const disc = new Array(adj.length).fill(-1), low = [], stack = [], comps = [];   @@init
  let timer = 0;

  function visit(u) {
    disc[u] = low[u] = timer++;                    @@visit
    stack.push(u);                                 @@visit
    for (const v of adj[u]) {                      @@edge
      if (disc[v] < 0) {                           @@edge
        visit(v);                                  @@edge
        low[u] = Math.min(low[u], low[v]);         @@lowlink
      } else if (stack.includes(v)) {              @@edge
        low[u] = Math.min(low[u], disc[v]);        @@lowlink
      }
    }
    if (low[u] === disc[u]) {                      @@root
      const comp = [];                             @@pop
      let w;                                       @@pop
      do { w = stack.pop(); comp.push(w); } while (w !== u);   @@pop
      comps.push(comp);                            @@pop
    }
  }

  for (const u of [start, ...adj.keys()]) if (disc[u] < 0) visit(u);   @@done
  return comps;                                    @@done
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph, true);
    const disc = graph.nodes.map(() => -1);
    const low = graph.nodes.map(() => -1);
    const comp = graph.nodes.map(() => 0);
    const stack: number[] = [];
    const comps: number[][] = [];
    let timer = 0;
    const aux = () => ({ title: "Stack (bottom → top)", items: stack.map((i) => t.name(i)) });
    const show = (ids: number[]) => ids.map((i) => t.name(i)).join(", ");
    const vars = (u: number) => ({ u: t.name(u), disc: disc[u], low: low[u] });

    t.step("init", "Nothing is discovered yet. Once a node is, the label under it reads disc/low.", aux());

    const visit = (u: number) => {
      disc[u] = low[u] = timer++;
      stack.push(u);
      t.nodes[u] = "frontier";
      t.labels[u] = `${disc[u]}/${low[u]}`;
      t.step("visit", `Discover ${t.name(u)} as number ${disc[u]}: disc = low = ${disc[u]}. Push it on the stack.`, aux(), { current: u, vars: vars(u) });
      for (const { to: v } of t.adj[u]) {
        const edge = `Edge ${t.name(u)}→${t.name(v)}`;
        if (disc[v] < 0) {
          t.step("edge", `${edge}: ${t.name(v)} is new, so go deeper.`, aux(), { current: u, considered: [u, v], vars: vars(u) });
          t.edge(u, v, "tree");
          visit(v);
          const was = low[u];
          low[u] = Math.min(was, low[v]);
          t.labels[u] = `${disc[u]}/${low[u]}`;
          t.step("lowlink", `Back from ${t.name(v)}: low[${t.name(u)}] = min(${was}, low[${t.name(v)}] = ${low[v]}) = ${low[u]}.`, aux(), { current: u, vars: vars(u) });
        } else if (comp[v] === 0) {
          t.step("edge", `${edge}: ${t.name(v)} is still on the stack, so it can reach ${t.name(u)} and they share a component.`, aux(), {
            current: u,
            considered: [u, v],
            vars: vars(u),
          });
          const was = low[u];
          low[u] = Math.min(was, disc[v]);
          t.labels[u] = `${disc[u]}/${low[u]}`;
          t.step("lowlink", `low[${t.name(u)}] = min(${was}, disc[${t.name(v)}] = ${disc[v]}) = ${low[u]}.`, aux(), { current: u, vars: vars(u) });
        } else {
          t.step("edge", `${edge}: ${t.name(v)} already belongs to component C${comp[v]}, which cannot reach back here. Skip it.`, aux(), {
            current: u,
            considered: [u, v],
            vars: vars(u),
          });
        }
      }
      const isRoot = low[u] === disc[u];
      const why = isRoot ? `low = disc = ${disc[u]}, so ${t.name(u)} is the root of a component.` : `low ${low[u]} < disc ${disc[u]}, so ${t.name(u)} reaches an earlier node and stays on the stack.`;
      t.step("root", why, aux(), { current: u, vars: vars(u) });
      if (!isRoot) return;
      const members = stack.splice(stack.indexOf(u)).reverse();
      comps.push(members);
      for (const m of members) {
        comp[m] = comps.length;
        t.nodes[m] = "visited";
        t.labels[m] = `C${comps.length}`;
      }
      for (const e of graph.edges) if (comp[e.u] && comp[e.v]) t.edge(e.u, e.v, comp[e.u] === comp[e.v] ? "tree" : undefined);
      t.step("pop", `Pop the stack down to ${t.name(u)}. {${show(members)}} is component C${comps.length}.`, aux(), { current: u, vars: vars(u) });
    };

    for (const u of [start, ...graph.nodes.map((nd) => nd.id)]) if (disc[u] < 0) visit(u);
    t.step("done", `Found ${comps.length} strongly connected components: ${comps.map((c, i) => `C${i + 1} = {${show(c)}}`).join(", ")}.`, aux());
    return t.frames;
  },
};
