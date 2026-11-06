import { GraphTracer } from "../../core/trace";
import type { GraphAlgorithm } from "../../core/types";

export const aStar: GraphAlgorithm = {
  id: "a-star",
  name: "A* Search",
  kind: "graph",
  topic: "graph",
  weighted: true,
  stopsAtGoal: true,
  about: {
    summary: "Dijkstra with a compass: it settles the node with the smallest cost so far plus a straight-line guess to the goal, so the search leans toward the goal.",
    invariants: [
      "The guess h never overestimates the real cost to the goal, so the first time the goal is popped its cost g is the shortest.",
      "h obeys the triangle inequality along every edge, so a settled node is never improved later.",
    ],
    useCases: [
      "Pathfinding for game characters and robots on maps.",
      "Route planning that has coordinates for every place.",
      "Any search where a cheap lower bound on the remaining cost exists.",
    ],
  },
  complexity: { best: "O(d)", average: "O((V + E) log V)", worst: "O((V + E) log V)", space: "O(V)" },
  code: {
    pseudo: `
procedure AStar(G, s, goal)
  g[s] ← 0; PQ ← min-heap containing (h(s), s)   @@init
  while PQ is not empty do                       @@loop
    (f, u) ← PQ.extractMin()                     @@pop
    if f > g[u] + h(u) then continue             @@stale
    if u = goal then break                       @@goal
    for each edge (u, v, w) do                   @@neighbor
      if g[u] + w < g[v] then                    @@check
        g[v] ← g[u] + w; parent[v] ← u           @@relax
        PQ.insert((g[v] + h(v), v))              @@relax
  walk parent[] back from goal to s              @@path
  return that path                               @@path
`,
    python: `
import heapq, math

# scale: the smallest w / length over all edges, so h never overestimates.
def a_star(adj, pos, s, goal, scale):
    h = lambda v: scale * math.dist(pos[v], pos[goal])   @@init
    g, parent = {s: 0}, {}                       @@init
    pq = [(h(s), s)]                             @@init
    while pq:                                    @@loop
        f, u = heapq.heappop(pq)                 @@pop
        if f > g[u] + h(u):                      @@stale
            continue                             @@stale
        if u == goal:                            @@goal
            break                                @@goal
        for v, w in adj[u]:                      @@neighbor
            if g[u] + w < g.get(v, math.inf):    @@check
                g[v] = g[u] + w; parent[v] = u   @@relax
                heapq.heappush(pq, (g[v] + h(v), v))   @@relax
    path = [goal]                                @@path
    while path[-1] != s: path.append(parent[path[-1]])   @@path
    return path[::-1]                            @@path
`,
    cpp: `
using Adj = std::vector<std::vector<std::pair<int, int>>>;

std::vector<int> aStar(const Adj& adj, const std::vector<std::complex<double>>& pos,
                       int s, int goal, double scale) {
    auto h = [&](int v) { return scale * std::abs(pos[v] - pos[goal]); };   @@init
    std::vector<int> g(adj.size(), INT_MAX), parent(adj.size(), -1);   @@init
    using P = std::pair<double, int>;
    std::priority_queue<P, std::vector<P>, std::greater<>> pq;   @@init
    g[s] = 0; pq.push({h(s), s});                @@init
    while (!pq.empty()) {                        @@loop
        auto [f, u] = pq.top(); pq.pop();        @@pop
        if (f > g[u] + h(u)) continue;           @@stale
        if (u == goal) break;                    @@goal
        for (auto [v, w] : adj[u]) {             @@neighbor
            if (g[u] + w < g[v]) {               @@check
                g[v] = g[u] + w; parent[v] = u;  @@relax
                pq.push({g[v] + h(v), v});       @@relax
            }
        }
    }
    std::vector<int> path{goal};                 @@path
    while (path.back() != s) path.push_back(parent[path.back()]);   @@path
    std::reverse(path.begin(), path.end());      @@path
    return path;                                 @@path
}
`,
    java: `
static List<Integer> aStar(List<List<int[]>> adj, double[][] pos, int s, int goal, double scale) {
    IntToDoubleFunction h = v ->                 @@init
        scale * Math.hypot(pos[v][0] - pos[goal][0], pos[v][1] - pos[goal][1]);   @@init
    int[] g = new int[adj.size()], parent = new int[adj.size()];   @@init
    Arrays.fill(g, Integer.MAX_VALUE); Arrays.fill(parent, -1);    @@init
    PriorityQueue<double[]> pq = new PriorityQueue<>((a, b) -> Double.compare(a[0], b[0]));   @@init
    g[s] = 0; pq.add(new double[]{h.applyAsDouble(s), s});         @@init
    while (!pq.isEmpty()) {                      @@loop
        double[] top = pq.poll();                @@pop
        int u = (int) top[1];                    @@pop
        if (top[0] > g[u] + h.applyAsDouble(u)) continue;          @@stale
        if (u == goal) break;                    @@goal
        for (int[] e : adj.get(u)) {             @@neighbor
            int v = e[0], w = e[1];              @@neighbor
            if (g[u] + w < g[v]) {               @@check
                g[v] = g[u] + w; parent[v] = u;  @@relax
                pq.add(new double[]{g[v] + h.applyAsDouble(v), v});   @@relax
            }
        }
    }
    LinkedList<Integer> path = new LinkedList<>(List.of(goal));    @@path
    while (path.getFirst() != s) path.addFirst(parent[path.getFirst()]);   @@path
    return path;                                 @@path
}
`,
    javascript: `
// pq is a sorted array standing in for a binary heap.
function aStar(adj, pos, s, goal, scale) {
  const h = (v) => scale * Math.hypot(pos[v].x - pos[goal].x, pos[v].y - pos[goal].y);   @@init
  const g = new Map([[s, 0]]);                   @@init
  const parent = new Map();                      @@init
  const pq = [[h(s), s]];                        @@init
  while (pq.length > 0) {                        @@loop
    const [f, u] = pq.shift();                   @@pop
    if (f > g.get(u) + h(u)) continue;           @@stale
    if (u === goal) break;                       @@goal
    for (const [v, w] of adj[u]) {               @@neighbor
      if (g.get(u) + w < (g.get(v) ?? Infinity)) {   @@check
        g.set(v, g.get(u) + w);                  @@relax
        parent.set(v, u);                        @@relax
        pq.push([g.get(v) + h(v), v]);           @@relax
        pq.sort((a, b) => a[0] - b[0]);          @@relax
      }
    }
  }
  const path = [goal];                           @@path
  while (path[path.length - 1] !== s) path.push(parent.get(path[path.length - 1]));   @@path
  return path.reverse();                         @@path
}
`,
  },
  run(graph, start) {
    const t = new GraphTracer(graph);
    const { nodes } = graph;
    const dist = (a: number, b: number) => Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
    let goal = start;
    for (const n of nodes) if (dist(start, n.id) > dist(start, goal)) goal = n.id;
    const scale = Math.min(...graph.edges.map((e) => e.w / dist(e.u, e.v)));
    const h = (v: number) => scale * dist(v, goal);
    const goalName = t.name(goal);

    const g = new Map<number, number>([[start, 0]]);
    const parent = new Map<number, number>();
    const open: [f: number, v: number, g: number][] = [[h(start), start, 0]];
    const aux = () => ({
      title: `Open set, goal ${goalName} (g+h=f)`,
      items: open.map(([f, v, gv]) => `${t.name(v)}:${gv}+${h(v).toFixed(1)}=${f.toFixed(1)}`),
    });
    const show = (d: number | undefined) => (d === undefined ? "∞" : String(d));
    let settled = 0;

    t.nodes[start] = "frontier";
    t.labels[start] = "0";
    t.labels[goal] = "goal";
    t.step(
      "init",
      `Start at ${t.name(start)} and aim for ${goalName}, the node farthest away. h is ${scale.toFixed(3)} × the straight-line distance to ${goalName}, the largest scale that never beats a real edge.`,
      aux(),
      { vars: { goal: goalName } },
    );

    while (open.length > 0) {
      t.step("loop", `Open set has ${open.length} entr${open.length === 1 ? "y" : "ies"}; keep going.`, aux());
      const [f, u, gu] = open.shift()!;
      const uName = t.name(u);
      if (f > g.get(u)! + h(u)) {
        t.step("pop", `Pop ${uName} with f = ${f.toFixed(1)}.`, aux(), { vars: { u: uName } });
        t.step("stale", `Stale entry: ${uName} is already reached more cheaply, at g = ${g.get(u)}. Skip it.`, aux(), { vars: { u: uName } });
        continue;
      }
      t.nodes[u] = "visited";
      settled++;
      t.step("pop", `Pop ${uName}: g ${gu} + h ${h(u).toFixed(1)} = f ${f.toFixed(1)}, the smallest. ${uName} is settled at cost ${gu}.`, aux(), {
        current: u,
        vars: { u: uName, g: gu },
      });
      if (u === goal) {
        t.step("goal", `${uName} is the goal, so the search stops. Nothing cheaper can still be waiting in the open set.`, aux(), { current: u });
        break;
      }
      for (const { to: v, w } of t.adj[u]) {
        const vName = t.name(v);
        const cand = gu + w;
        const old = g.get(v);
        const improves = old === undefined || cand < old;
        const vars = { u: uName, v: vName, g: gu, w };
        const verdict = improves ? `${cand} < ${show(old)}.` : `${cand} ≥ ${old}, no improvement.`;
        t.step("check", `Edge ${uName}→${vName}, weight ${w}: ${gu} + ${w} = ${verdict}`, aux(), { current: u, considered: [u, v], vars });
        if (!improves) continue;
        const oldParent = parent.get(v);
        if (oldParent !== undefined) t.edge(oldParent, v, undefined);
        parent.set(v, u);
        t.edge(u, v, "tree");
        g.set(v, cand);
        const fv = cand + h(v);
        open.push([fv, v, cand]);
        open.sort((a, b) => (Math.abs(a[0] - b[0]) > 1e-9 ? a[0] - b[0] : h(a[1]) - h(b[1])) || a[1] - b[1]);
        t.nodes[v] = "frontier";
        t.labels[v] = String(cand);
        t.step("relax", `Set g[${vName}] = ${cand}, h = ${h(v).toFixed(1)}, f = ${fv.toFixed(1)}, and push ${vName}.`, aux(), { current: u, vars });
      }
    }

    for (const key of Object.keys(t.edges)) delete t.edges[key];
    const path = [goal];
    while (path[path.length - 1] !== start) path.push(parent.get(path[path.length - 1])!);
    path.reverse();
    for (let i = 1; i < path.length; i++) t.edge(path[i - 1], path[i], "tree");
    t.step(
      "path",
      `Walk the parents back from ${goalName}: ${path.map((i) => t.name(i)).join(" → ")}, cost ${g.get(goal)}. Settled ${settled} of ${nodes.length} nodes.`,
      aux(),
      { vars: { cost: g.get(goal)!, goal: goalName } },
    );
    return t.frames;
  },
};
