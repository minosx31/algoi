import type { ArrayFrame, ArrayItem, BarMark, CellMark, Coord, Graph, GraphFrame, GridCell, GridFrame, ScanAnswer, ScanFrame, Vars } from "./types";
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

type GridLayout = Pick<GridFrame, "rowHeaders" | "colHeaders" | "box">;

/** Records full-snapshot frames for tables and boards. Every cell starts pending; cells are replaced, never mutated. */
export class GridTracer {
  readonly frames: GridFrame[] = [];
  readonly cells: GridCell[][];
  readonly layout: GridLayout;
  aux?: GridFrame["aux"];
  answer?: string;

  constructor(rows: number, cols: number, layout: GridLayout = {}) {
    this.cells = Array.from({ length: rows }, () => Array.from({ length: cols }, (): GridCell => ({ text: "", mark: "pending" })));
    this.layout = layout;
  }

  set(r: number, c: number, text: string | number, mark?: CellMark) {
    this.cells[r][c] = { text: String(text), mark };
  }

  mark(r: number, c: number, mark?: CellMark) {
    this.cells[r][c] = { text: this.cells[r][c].text, mark };
  }

  /** Overlays apply for this frame only, in order: marks, then reads, then current. */
  step(line: string, note: string, extra: { current?: Coord; reads?: Coord[]; marks?: [Coord, CellMark][]; vars?: Vars } = {}) {
    const cells = this.cells.map((row) => row.slice());
    const paint = ([r, c]: Coord, mark: CellMark) => (cells[r][c] = { text: cells[r][c].text, mark });
    for (const [at, mark] of extra.marks ?? []) paint(at, mark);
    for (const at of extra.reads ?? []) paint(at, "read");
    if (extra.current) paint(extra.current, "current");
    const aux = this.aux && { title: this.aux.title, items: this.aux.items.slice() };
    this.frames.push({ line, note, vars: extra.vars, cells, ...this.layout, aux, answer: this.answer });
  }
}
