import type { ArrayFrame, ArrayItem, BarMark, Graph, GraphFrame, TreeFrame, TreeMark, TreeNode, Vars } from "./types";
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

/** A node as an algorithm holds it; `TreeTracer` flattens these into `TreeNode`s with child ids. */
export type TreeShape = { id: number; value: number | string; children: readonly (TreeShape | null)[] };

type BinaryNode = { id: number; value: number | string; left: BinaryNode | null; right: BinaryNode | null };

export const binaryShape = (n: BinaryNode | null): TreeShape | null =>
  n && { id: n.id, value: n.value, children: [binaryShape(n.left), binaryShape(n.right)] };

type TreeMarks = Partial<Record<number, TreeMark>>;
type TreeSnapshot = () => { roots: readonly (TreeShape | null)[]; array?: number[] };

/** Records full-snapshot frames of a tree or forest the algorithm owns, read through `snapshot` at every step. */
export class TreeTracer {
  readonly frames: TreeFrame[] = [];
  readonly marks: TreeMarks = {};
  aux: TreeFrame["aux"];
  answer?: string;
  private readonly snapshot: TreeSnapshot;

  constructor(auxTitle: string, snapshot: TreeSnapshot) {
    this.aux = { title: auxTitle, items: [] };
    this.snapshot = snapshot;
  }

  step(line: string, note: string, extra: { marks?: TreeMarks; vars?: Vars } = {}) {
    const { roots, array } = this.snapshot();
    const marks = { ...this.marks, ...extra.marks };
    const nodes: TreeNode[] = [];
    const flatten = (shape: TreeShape | null): number | null => {
      if (!shape) return null;
      const node: TreeNode = { id: shape.id, value: shape.value, children: [], mark: marks[shape.id] };
      nodes.push(node);
      node.children = shape.children.map(flatten);
      return shape.id;
    };
    const rootIds = roots.flatMap((r) => (r ? [flatten(r)!] : []));
    this.frames.push({
      line,
      note,
      vars: extra.vars,
      nodes,
      roots: rootIds,
      array: array?.slice(),
      aux: { title: this.aux.title, items: this.aux.items.slice() },
      answer: this.answer,
    });
  }
}
