import type { ArrayFrame, ArrayItem, BarMark, Graph, GraphFrame, ScanAnswer, ScanFrame, Vars } from "./types";
import { edgeKey } from "./types";

/** Records full-snapshot frames while a sorting algorithm mutates `items`. */
export class ArrayTracer {
  readonly frames: ArrayFrame[] = [];
  readonly items: ArrayItem[];
  readonly sorted = new Set<number>();

  constructor(values: number[]) {
    this.items = values.map((value, id) => ({ id, value }));
  }

  get length() {
    return this.items.length;
  }

  at(i: number) {
    return this.items[i].value;
  }

  swap(i: number, j: number) {
    [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
  }

  set(i: number, item: ArrayItem) {
    this.items[i] = item;
  }

  markSorted(...indices: number[]) {
    for (const i of indices) this.sorted.add(i);
  }

  step(line: string, note: string, marks: Partial<Record<number, BarMark>> = {}, vars?: Vars) {
    const all: Partial<Record<number, BarMark>> = {};
    for (const i of this.sorted) all[i] = "sorted";
    Object.assign(all, marks);
    this.frames.push({ line, note, vars, items: this.items.slice(), marks: all });
  }
}

/** Records full-snapshot frames for graph traversals. */
export class GraphTracer {
  readonly frames: GraphFrame[] = [];
  readonly nodes: GraphFrame["nodes"] = {};
  readonly edges: GraphFrame["edges"] = {};
  readonly labels: GraphFrame["labels"] = {};
  edgeLabels?: NonNullable<GraphFrame["edgeLabels"]>;
  readonly adj: { to: number; w: number }[][];
  readonly graph: Graph;

  /** A directed tracer lists each edge only under its tail `u`. */
  constructor(graph: Graph, directed = false) {
    this.graph = graph;
    this.adj = graph.nodes.map(() => []);
    for (const { u, v, w } of graph.edges) {
      this.adj[u].push({ to: v, w });
      if (!directed) this.adj[v].push({ to: u, w });
    }
    for (const list of this.adj) list.sort((a, b) => a.to - b.to);
  }

  name(i: number) {
    return this.graph.nodes[i].name;
  }

  edge(u: number, v: number, mark: GraphFrame["edges"][string] | undefined) {
    this.edges[edgeKey(u, v)] = mark;
  }

  labelEdge(u: number, v: number, text: string) {
    (this.edgeLabels ??= {})[edgeKey(u, v)] = text;
  }

  step(line: string, note: string, aux: GraphFrame["aux"], extra: { current?: number; considered?: [number, number]; vars?: Vars } = {}) {
    const nodes = { ...this.nodes };
    const edges = { ...this.edges };
    if (extra.current !== undefined) nodes[extra.current] = "current";
    if (extra.considered) {
      const k = edgeKey(...extra.considered);
      if (edges[k] !== "tree") edges[k] = "considered";
    }
    const frame: GraphFrame = { line, note, vars: extra.vars, nodes, edges, labels: { ...this.labels }, aux: { title: aux.title, items: aux.items.slice() } };
    if (this.edgeLabels) frame.edgeLabels = { ...this.edgeLabels };
    this.frames.push(frame);
  }
}

/**
 * Records full-snapshot frames for array scans. Point `aux` and `answer` at the
 * live structures once; every step copies them.
 */
export class ScanTracer {
  readonly frames: ScanFrame[] = [];
  readonly items: ArrayItem[];
  readonly labels: ScanFrame["labels"] = {};
  aux?: { title: string; indices: number[] };
  answer?: ScanAnswer;

  constructor(values: number[]) {
    this.items = values.map((value, id) => ({ id, value }));
  }

  range(lo: number, hi: number, marks: ScanFrame["marks"] = {}): ScanFrame["marks"] {
    const all: ScanFrame["marks"] = {};
    for (let i = 0; i < this.items.length; i++) all[i] = i < lo || i > hi ? "muted" : "active";
    return Object.assign(all, marks);
  }

  step(line: string, note: string, extra: Partial<Pick<ScanFrame, "marks" | "pointers" | "bands" | "vars">> = {}) {
    this.frames.push({
      line,
      note,
      vars: extra.vars,
      items: this.items.slice(),
      marks: extra.marks ?? {},
      pointers: extra.pointers ?? {},
      bands: extra.bands ?? [],
      labels: { ...this.labels },
      aux: this.aux && { title: this.aux.title, indices: this.aux.indices.slice() },
      answer: Array.isArray(this.answer) ? this.answer.slice() : this.answer,
    });
  }
}
