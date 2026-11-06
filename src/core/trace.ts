import type { ArrayFrame, ArrayItem, BarMark, Graph, GraphFrame, StringAux, StringFrame, StringMark, Vars } from "./types";
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
  readonly adj: { to: number; w: number }[][];
  readonly graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
    this.adj = graph.nodes.map(() => []);
    for (const { u, v, w } of graph.edges) {
      this.adj[u].push({ to: v, w });
      this.adj[v].push({ to: u, w });
    }
    for (const list of this.adj) list.sort((a, b) => a.to - b.to);
  }

  name(i: number) {
    return this.graph.nodes[i].name;
  }

  edge(u: number, v: number, mark: GraphFrame["edges"][string] | undefined) {
    this.edges[edgeKey(u, v)] = mark;
  }

  step(line: string, note: string, aux: GraphFrame["aux"], extra: { current?: number; considered?: [number, number]; vars?: Vars } = {}) {
    const nodes = { ...this.nodes };
    const edges = { ...this.edges };
    if (extra.current !== undefined) nodes[extra.current] = "current";
    if (extra.considered) {
      const k = edgeKey(...extra.considered);
      if (edges[k] !== "tree") edges[k] = "considered";
    }
    this.frames.push({ line, note, vars: extra.vars, nodes, edges, labels: { ...this.labels }, aux: { title: aux.title, items: aux.items.slice() } });
  }
}

/** Records full-snapshot frames while a pattern slides along a text. */
export class StringTracer {
  readonly frames: StringFrame[] = [];
  readonly matches: number[] = [];
  readonly text: string;
  readonly pattern: string;
  readonly prefix: string;
  readonly row: string;
  phase: StringFrame["phase"] = "search";
  offset = 0;
  marks: Partial<Record<number, StringMark>> = {};
  aux: StringAux | undefined;
  compares = 0;

  constructor(text: string, pattern: string, prefix = "") {
    this.text = text;
    this.pattern = pattern;
    this.prefix = prefix;
    this.row = prefix + text;
  }

  /** Puts pattern[0] under row[offset]; the first `known` characters already match. */
  slide(offset: number, known = 0) {
    this.phase = "search";
    this.offset = offset;
    this.marks = {};
    for (let j = 0; j < known; j++) this.marks[j] = "known";
  }

  compare(j: number) {
    this.compares++;
    const same = this.row[this.offset + j] === this.pattern[j];
    this.marks[j] = same ? "match" : "mismatch";
    return same;
  }

  step(line: string, note: string, extra: { vars?: Vars; active?: number } = {}) {
    let aux: StringAux | undefined;
    if (this.aux) {
      aux = { ...this.aux, values: this.aux.values.slice(), marks: { ...this.aux.marks } };
      if (extra.active !== undefined) aux.marks[extra.active] = "active";
    }
    const at = this.phase === "search" ? { phase: this.phase, offset: this.offset } : { phase: this.phase };
    const { text, pattern, prefix } = this;
    const vars = { ...extra.vars, compares: this.compares };
    this.frames.push({ line, note, vars, ...at, text, pattern, prefix, marks: { ...this.marks }, aux, matches: this.matches.slice() });
  }

  finish(line: string, note: string) {
    this.phase = "done";
    this.marks = {};
    this.step(line, note);
  }
}
