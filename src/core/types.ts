export const LANGUAGES = [
  { id: "pseudo", label: "Pseudocode", hljs: null },
  { id: "python", label: "Python", hljs: "python" },
  { id: "cpp", label: "C++", hljs: "cpp" },
  { id: "java", label: "Java", hljs: "java" },
  { id: "javascript", label: "JavaScript", hljs: "javascript" },
] as const;

export type LangId = (typeof LANGUAGES)[number]["id"];

/**
 * Source listings per language. A line ending in `@@label` is tagged with that
 * label; frames point at labels, so one trace highlights the matching line in
 * every language. The tag is stripped before display.
 */
export type CodeListings = Record<LangId, string>;

export type Vars = Record<string, string | number>;

type FrameBase = {
  line: string;
  note: string;
  vars?: Vars;
};

export type BarMark = "compare" | "swap" | "sorted" | "pivot" | "active" | "muted";
export type ArrayItem = { id: number; value: number };

export type ArrayFrame = FrameBase & {
  items: ArrayItem[];
  marks: Partial<Record<number, BarMark>>;
};

export type NodeMark = "frontier" | "current" | "visited";
export type EdgeMark = "considered" | "tree";

export type GraphFrame = FrameBase & {
  nodes: Partial<Record<number, NodeMark>>;
  edges: Partial<Record<string, EdgeMark>>;
  labels: Partial<Record<number, string>>;
  aux: { title: string; items: string[] };
};

export type Graph = {
  nodes: { id: number; name: string; x: number; y: number }[];
  edges: { u: number; v: number; w: number }[];
};

export type CellMark = "probe" | "hit" | "miss" | "new" | "moved" | "tomb" | "empty" | "link";

/** `id` keeps a cell's DOM node across frames, so a cell that changes position slides there. */
export type Cell = { id: string; text: string; sub?: string; mark?: CellMark };

/** A point on a hash ring, `angle` degrees clockwise from the top. `tone` picks the owning server's colour. */
export type RingPoint = { id: string; text: string; angle: number; tone: number; mark?: CellMark };

/** A ring row draws each node's arc back to the previous node, so the arc shows which keys it owns. */
export type OpsRow = { title: string; cells: Cell[] } | { title: string; ring: { nodes: RingPoint[]; keys: RingPoint[] } };

export type OpsFrame = FrameBase & {
  log: { op: string; result?: string }[];
  at: number;
  rows: OpsRow[];
};

/** Every algorithm documents itself in the same fixed structure. */
export type About = {
  summary: string;
  invariants: string[];
  useCases: string[];
};

export type Complexity = { best: string; average: string; worst: string; space: string };

export const TOPIC_LABELS = { sorting: "Sorting", graph: "Graph", systems: "System design" } as const;
export type Topic = keyof typeof TOPIC_LABELS;

type AlgorithmBase = {
  id: string;
  name: string;
  topic: Topic;
  about: About;
  complexity: Complexity;
  code: CodeListings;
};

export type SortingAlgorithm = AlgorithmBase & {
  kind: "sorting";
  run: (values: number[]) => ArrayFrame[];
};

export type GraphAlgorithm = AlgorithmBase & {
  kind: "graph";
  weighted: boolean;
  run: (graph: Graph, start: number) => GraphFrame[];
};

/**
 * Each structure has its own op type. Method syntax keeps the parameters bivariant,
 * so an `OpsAlgorithm<LruOp>` fits the union; the script always comes from the same algorithm's `makeInput`.
 */
export type OpsAlgorithm<Op = unknown> = AlgorithmBase & {
  kind: "ops";
  makeInput(size: number): Op[];
  solve(script: readonly Op[]): string[];
  run(script: readonly Op[]): OpsFrame[];
};

export type Algorithm = SortingAlgorithm | GraphAlgorithm | OpsAlgorithm;

export const edgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);
