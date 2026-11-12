import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const bridges: GraphAlgorithm = {
  id: "bridges",
  name: "Bridges and Articulation Points",
  kind: "graph",
  topic: "graph",
  weighted: false,
  about: {
    summary: "One DFS (Tarjan's lowlink pass) finds every edge and node whose removal disconnects the graph. Each node keeps disc, the time it was found, and low, the oldest node its subtree can reach.",
    invariants: [
      "low[v] is the smallest disc reachable from v's subtree using tree edges down and at most one back edge up.",
      "A tree edge (u, v) is a bridge exactly when low[v] > disc[u]: nothing under v climbs back above u.",
      "A non-root u is a cut node when some child has low[v] ≥ disc[u]. The root is one when it has two or more children.",
    ],
    useCases: [
      "Finding single points of failure in a network or power grid.",
      "Deciding where to add a redundant link so no one cable cut splits the network.",
      "Splitting a graph into 2-edge-connected or biconnected components.",
    ],
  },
  complexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)", space: "O(V)" },
  code: {
    pseudo: `
procedure Cuts(G, s)
  disc, low ← empty maps; timer ← 0              @@init
  DFS(s, none)                                   @@init
  return the bridges and cut nodes               @@done

procedure DFS(u, parent)
  disc[u] ← low[u] ← timer; timer ← timer + 1    @@visit
  kids ← 0
  for each neighbor v of u do                    @@neighbor
    if v = parent then continue                  @@skip
    if v already has a disc then                 @@back
      low[u] ← min(low[u], disc[v])              @@back
    else
      kids ← kids + 1; DFS(v, u)                 @@descend
      low[u] ← min(low[u], low[v])               @@lowlink
      if low[v] > disc[u] then report bridge (u, v)   @@bridge
      if u is not the root and low[v] ≥ disc[u] then mark u as cut   @@cut
  if u is the root and kids > 1 then mark u as cut   @@cut
`,
    python: `
def find_cuts(adj, s):
    disc, low = {}, {}                           @@init
    bridges, cuts = [], set()                    @@init
    def dfs(u, parent):
        disc[u] = low[u] = len(disc)             @@visit
        kids = 0
        for v in adj[u]:                         @@neighbor
            if v == parent:                      @@skip
                continue                         @@skip
            if v in disc:                        @@back
                low[u] = min(low[u], disc[v])    @@back
            else:
                kids += 1                        @@descend
                dfs(v, u)                        @@descend
                low[u] = min(low[u], low[v])     @@lowlink
                if low[v] > disc[u]:             @@bridge
                    bridges.append((u, v))       @@bridge
                if parent is not None and low[v] >= disc[u]:   @@cut
                    cuts.add(u)                  @@cut
        if parent is None and kids > 1:          @@cut
            cuts.add(u)                          @@cut
    dfs(s, None)                                 @@init
    return bridges, cuts                         @@done
`,
    cpp: `
auto findCuts(const std::vector<std::vector<int>>& adj, int s) {
    std::vector<int> disc(adj.size(), -1), low(adj.size());   @@init
    std::vector<std::pair<int, int>> bridges; std::set<int> cuts;   @@init
    int timer = 0;                               @@init
    std::function<void(int, int)> dfs = [&](int u, int parent) {
        disc[u] = low[u] = timer++;              @@visit
        int kids = 0;
        for (int v : adj[u]) {                   @@neighbor
            if (v == parent) continue;           @@skip
            if (disc[v] != -1) {                 @@back
                low[u] = std::min(low[u], disc[v]);   @@back
            } else {
                kids++;                          @@descend
                dfs(v, u);                       @@descend
                low[u] = std::min(low[u], low[v]);    @@lowlink
                if (low[v] > disc[u]) bridges.push_back({u, v});   @@bridge
                if (parent != -1 && low[v] >= disc[u]) cuts.insert(u);   @@cut
            }
        }
        if (parent == -1 && kids > 1) cuts.insert(u);   @@cut
    };
    dfs(s, -1);                                  @@init
    return std::make_pair(bridges, cuts);        @@done
}
`,
    java: `
static int[] disc, low; static int timer;

static void dfs(List<List<Integer>> adj, int u, int parent, List<int[]> bridges, Set<Integer> cuts) {
    disc[u] = low[u] = timer++;                  @@visit
    int kids = 0;
    for (int v : adj.get(u)) {                   @@neighbor
        if (v == parent) continue;               @@skip
        if (disc[v] != -1) {                     @@back
            low[u] = Math.min(low[u], disc[v]);  @@back
        } else {
            kids++;                              @@descend
            dfs(adj, v, u, bridges, cuts);       @@descend
            low[u] = Math.min(low[u], low[v]);   @@lowlink
            if (low[v] > disc[u]) bridges.add(new int[]{u, v});   @@bridge
            if (parent != -1 && low[v] >= disc[u]) cuts.add(u);   @@cut
        }
    }
    if (parent == -1 && kids > 1) cuts.add(u);   @@cut
}

static Map.Entry<List<int[]>, Set<Integer>> findCuts(List<List<Integer>> adj, int s) {
    disc = new int[adj.size()]; low = new int[adj.size()];   @@init
    Arrays.fill(disc, -1); timer = 0;            @@init
    List<int[]> bridges = new ArrayList<>(); Set<Integer> cuts = new HashSet<>();   @@init
    dfs(adj, s, -1, bridges, cuts);              @@init
    return Map.entry(bridges, cuts);             @@done
}
`,
    javascript: `
function findCuts(adj, s) {
  const disc = new Map(), low = new Map();       @@init
  const bridges = [], cuts = new Set();          @@init
  function dfs(u, parent) {
    disc.set(u, disc.size); low.set(u, disc.get(u));   @@visit
    let kids = 0;
    for (const v of adj[u]) {                    @@neighbor
      if (v === parent) continue;                @@skip
      if (disc.has(v)) {                         @@back
        low.set(u, Math.min(low.get(u), disc.get(v)));   @@back
      } else {
        kids++;                                  @@descend
        dfs(v, u);                               @@descend
        low.set(u, Math.min(low.get(u), low.get(v)));    @@lowlink
        if (low.get(v) > disc.get(u)) bridges.push([u, v]);   @@bridge
        if (parent !== null && low.get(v) >= disc.get(u)) cuts.add(u);   @@cut
      }
    }
    if (parent === null && kids > 1) cuts.add(u);   @@cut
  }
  dfs(s, null);                                  @@init
  return { bridges, cuts };                      @@done
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph);
    const disc = new Map<number, number>();
    const low = new Map<number, number>();
    const found: string[] = [];
    const cutNodes = new Set<number>();
    const aux = () => ({ title: "Bridges and cut nodes", items: found.slice() });
    const tag = (id: number) => `${disc.get(id)}/${low.get(id)}${cutNodes.has(id) ? " AP" : ""}`;
    const relabel = (id: number) => (t.labels[id] = tag(id));
    const pair = (a: number, b: number) => `${t.name(a)}–${t.name(b)}`;

    const dfs = (u: number, parent: number | null) => {
      const uName = t.name(u);
      disc.set(u, disc.size);
      low.set(u, disc.get(u)!);
      t.nodes[u] = "frontier";
      relabel(u);
      t.step("visit", `Visit ${uName}: disc = low = ${disc.get(u)}.`, aux(), { current: u, vars: { u: uName, disc: disc.get(u)! } });
      let kids = 0;
      for (const { to: v } of t.adj[u]) {
        const vName = t.name(v);
        const vars = { u: uName, v: vName };
        if (v === parent) {
          t.step("skip", `${pair(u, v)} is the edge ${uName} came in on. Ignore it.`, aux(), { current: u, considered: [u, v], vars });
          continue;
        }
        if (disc.has(v)) {
          const was = low.get(u)!;
          low.set(u, Math.min(was, disc.get(v)!));
          relabel(u);
          const effect = low.get(u)! < was ? `low[${uName}] drops from ${was} to ${low.get(u)}.` : `low[${uName}] stays ${was}.`;
          t.step("back", `${vName} is already found (disc ${disc.get(v)}), so ${pair(u, v)} is a back edge. ${effect}`, aux(), { current: u, considered: [u, v], vars });
          continue;
        }
        kids++;
        t.edge(u, v, "considered");
        t.step("descend", `${vName} is new: go down ${pair(u, v)}.`, aux(), { current: u, vars });
        dfs(v, u);
        const was = low.get(u)!;
        low.set(u, Math.min(was, low.get(v)!));
        relabel(u);
        t.step("lowlink", `Back at ${uName}: low[${uName}] = min(${was}, low[${vName}] = ${low.get(v)}) = ${low.get(u)}.`, aux(), { current: u, vars });
        if (low.get(v)! > disc.get(u)!) {
          t.edge(u, v, "tree");
          found.push(`bridge ${pair(u, v)}`);
          t.step("bridge", `low[${vName}] = ${low.get(v)} > disc[${uName}] = ${disc.get(u)}: nothing under ${vName} reaches above ${uName}, so ${pair(u, v)} is a bridge.`, aux(), { current: u, vars });
        } else {
          t.edge(u, v, undefined);
        }
        if (parent !== null && low.get(v)! >= disc.get(u)! && !cutNodes.has(u)) {
          cutNodes.add(u);
          relabel(u);
          found.push(`cut ${uName}`);
          t.step("cut", `low[${vName}] = ${low.get(v)} ≥ disc[${uName}] = ${disc.get(u)}: removing ${uName} cuts ${vName}'s subtree off. ${uName} is a cut node.`, aux(), { current: u, vars });
        }
      }
      if (parent === null && kids > 1) {
        cutNodes.add(u);
        relabel(u);
        found.push(`cut ${uName}`);
        t.step("cut", `${uName} is the root with ${kids} children that cannot reach each other, so it is a cut node.`, aux(), { current: u, vars: { u: uName, kids } });
      }
      t.nodes[u] = "visited";
    };

    t.step("init", `Start the DFS at ${t.name(start)}. Each node will show disc/low.`, aux());
    dfs(start, null);
    const bridgeCount = found.filter((f) => f.startsWith("bridge")).length;
    t.step("done", `Done: ${bridgeCount} bridge${bridgeCount === 1 ? "" : "s"} and ${cutNodes.size} cut node${cutNodes.size === 1 ? "" : "s"}.`, aux(), {
      vars: { bridges: bridgeCount, cuts: cutNodes.size },
    });
    return t.frames;
  },
};
