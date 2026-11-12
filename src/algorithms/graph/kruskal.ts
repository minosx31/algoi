import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const kruskal: GraphAlgorithm = {
  id: "kruskal",
  name: "Kruskal's Algorithm",
  kind: "graph",
  topic: "graph",
  weighted: true,
  about: {
    summary: "Sorts every edge by weight and keeps each one that joins two separate components, tracking the components with union-find.",
    invariants: [
      "The kept edges always form a forest that is part of some minimum spanning tree.",
      "An edge whose ends share a root would close a cycle, so it is rejected.",
      "Path halving in find keeps the union-find trees shallow.",
    ],
    useCases: [
      "Minimum spanning trees for network and road design.",
      "Union-find is the standard answer to dynamic connectivity and cycle questions.",
      "Single-linkage clustering: stop early to get k clusters.",
    ],
  },
  complexity: { best: "O(E log E)", average: "O(E log E)", worst: "O(E log E)", space: "O(V + E)" },
  code: {
    pseudo: `
procedure Kruskal(G)
  parent[i] ← i for every node i                 @@init
  sort the edges by weight                       @@sort
  for each edge (u, v, w) in that order do       @@sort
    ru ← Find(u); rv ← Find(v)                   @@find
    if ru = rv then continue                     @@reject
    parent[ru] ← rv                              @@union
    add (u, v, w) to the tree                    @@union
  return the tree                                @@done

procedure Find(x)
  while parent[x] ≠ x do                         @@find
    parent[x] ← parent[parent[x]]; x ← parent[x] @@find
  return x                                       @@find
`,
    python: `
def kruskal(n, edges):
    parent = list(range(n))                      @@init
    def find(x):
        while parent[x] != x:                    @@find
            parent[x] = parent[parent[x]]        @@find
            x = parent[x]                        @@find
        return x                                 @@find
    tree = []
    for u, v, w in sorted(edges, key=lambda e: e[2]):   @@sort
        ru, rv = find(u), find(v)                @@find
        if ru == rv:                             @@reject
            continue                             @@reject
        parent[ru] = rv                          @@union
        tree.append((u, v, w))                   @@union
    return tree                                  @@done
`,
    cpp: `
std::vector<std::array<int, 3>> kruskal(int n, std::vector<std::array<int, 3>> edges) {
    std::vector<int> parent(n);
    std::iota(parent.begin(), parent.end(), 0);  @@init
    auto find = [&](int x) {
        while (parent[x] != x) {                 @@find
            parent[x] = parent[parent[x]];       @@find
            x = parent[x];                       @@find
        }
        return x;                                @@find
    };
    std::sort(edges.begin(), edges.end(),
              [](auto& a, auto& b) { return a[2] < b[2]; });   @@sort
    std::vector<std::array<int, 3>> tree;
    for (auto& e : edges) {                      @@sort
        int ru = find(e[0]), rv = find(e[1]);    @@find
        if (ru == rv) continue;                  @@reject
        parent[ru] = rv;                         @@union
        tree.push_back(e);                       @@union
    }
    return tree;                                 @@done
}
`,
    java: `
static int find(int[] parent, int x) {
    while (parent[x] != x) {                     @@find
        parent[x] = parent[parent[x]];           @@find
        x = parent[x];                           @@find
    }
    return x;                                    @@find
}

static List<int[]> kruskal(int n, int[][] edges) {
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;   @@init
    Arrays.sort(edges, (a, b) -> Integer.compare(a[2], b[2]));   @@sort
    List<int[]> tree = new ArrayList<>();
    for (int[] e : edges) {                      @@sort
        int ru = find(parent, e[0]), rv = find(parent, e[1]);    @@find
        if (ru == rv) continue;                  @@reject
        parent[ru] = rv;                         @@union
        tree.add(e);                             @@union
    }
    return tree;                                 @@done
}
`,
    javascript: `
function kruskal(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);   @@init
  const find = (x) => {
    while (parent[x] !== x) {                    @@find
      parent[x] = parent[parent[x]];             @@find
      x = parent[x];                             @@find
    }
    return x;                                    @@find
  };
  const tree = [];
  for (const [u, v, w] of [...edges].sort((a, b) => a[2] - b[2])) {   @@sort
    const ru = find(u), rv = find(v);            @@find
    if (ru === rv) continue;                     @@reject
    parent[ru] = rv;                             @@union
    tree.push([u, v, w]);                        @@union
  }
  return tree;                                   @@done
}
`,
  },
  run(graph) {
    const t = new GraphTracer(graph);
    const n = graph.nodes.length;
    const parent = graph.nodes.map((_, i) => i);
    const find = (x: number) => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    };
    const root = (x: number): number => (parent[x] === x ? x : root(parent[x]));
    const aux = () => ({ title: "Union-find parent[]", items: parent.map((p, i) => `${t.name(i)}→${t.name(p)}`) });
    const relabel = () => graph.nodes.forEach(({ id }) => (t.labels[id] = t.name(root(id))));
    const sorted = graph.edges.slice().sort((a, b) => a.w - b.w || Math.min(a.u, a.v) - Math.min(b.u, b.v) || Math.max(a.u, a.v) - Math.max(b.u, b.v));
    let kept = 0;
    let total = 0;

    relabel();
    t.step("init", "Every node starts as its own set: parent[i] = i. The label under each node is its root.", aux());
    t.step("sort", `Sort the ${sorted.length} edges by weight, lightest first, and visit them in that order.`, aux());

    sorted.forEach(({ u, v, w }, i) => {
      const uName = t.name(u);
      const vName = t.name(v);
      const ru = find(u);
      const rv = find(v);
      const vars = { u: uName, v: vName, w };
      t.step(
        "find",
        `Edge ${i + 1} of ${sorted.length}: ${uName}–${vName}, weight ${w}. ${uName} has root ${t.name(ru)} and ${vName} has root ${t.name(rv)}.`,
        aux(),
        { current: u, considered: [u, v], vars },
      );
      if (ru === rv) {
        t.step("reject", `${uName} and ${vName} share root ${t.name(ru)}, so ${uName}–${vName} would close a cycle. Reject it.`, aux(), {
          current: u,
          considered: [u, v],
          vars,
        });
        return;
      }
      parent[ru] = rv;
      kept++;
      total += w;
      t.edge(u, v, "tree");
      t.nodes[u] = "visited";
      t.nodes[v] = "visited";
      relabel();
      t.step("union", `Roots differ, so hang root ${t.name(ru)} under ${t.name(rv)} and keep ${uName}–${vName}. ${kept} of ${n - 1} edges kept, weight ${total}.`, aux(), {
        current: u,
        vars: { ...vars, total },
      });
    });
    t.step("done", `Kept ${kept} edges, one fewer than the ${n} nodes, with total weight ${total}.`, aux(), { vars: { total } });
    return t.frames;
  },
};
