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

/** "pending" cells are not filled yet. A "read" cell gets an arrow to the frame's single "current" cell. */
export type CellMark = "pending" | "current" | "read" | "frontier" | "result" | "blocked" | "conflict";
export type GridCell = { text: string; mark?: CellMark };
export type Coord = readonly [row: number, col: number];

export type GridFrame = FrameBase & {
  cells: GridCell[][];
  rowHeaders?: string[];
  colHeaders?: string[];
  /** Draws a heavier rule between boxes of this size, as on a Sudoku board. */
  box?: { rows: number; cols: number };
  aux?: { title: string; items: string[] };
  answer?: string;
};

/** Every algorithm documents itself in the same fixed structure. */
export type About = {
  summary: string;
  invariants: string[];
  useCases: string[];
};

export type Complexity = { best: string; average: string; worst: string; space: string };

export const TOPIC_LABELS = { sorting: "Sorting", graph: "Graph", dp: "Dynamic programming", backtracking: "Backtracking" } as const;
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
 * run and solve use method syntax so their parameters are bivariant: a GridAlgorithm<LcsInput> then fits the
 * Algorithm union as GridAlgorithm<unknown>. The grid view only ever hands an algorithm its own makeInput result.
 */
export type GridAlgorithm<I = unknown> = AlgorithmBase & {
  kind: "grid";
  size: { label: string; min: number; max: number; initial: number };
  legend: readonly (readonly [mark: CellMark, label: string])[];
  makeInput(size: number): I;
  run(input: I): GridFrame[];
  /** The final frame's answer, computed without the traced table. */
  solve(input: I): string;
};

export type Algorithm = SortingAlgorithm | GraphAlgorithm | GridAlgorithm;

export const edgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);
