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
  /** Text drawn on an edge in place of its weight, keyed by `edgeKey`. */
  edgeLabels?: Partial<Record<string, string>>;
  aux: { title: string; items: string[] };
};

/** How a directed input derives from a layout: forward edges only, or forward edges plus back edges that close cycles. */
export type Directed = "acyclic" | "cyclic";
export type TreeMark = "compare" | "path" | "swap" | "target" | "done";

/**
 * A binary node lists `[left, right]` with `null` for a missing side; an n-ary node lists only real children.
 * A `caption` is drawn under the node, so give it only to leaves.
 */
export type TreeNode = { id: number; value: number | string; children: (number | null)[]; mark?: TreeMark; caption?: string };

export type TreeFrame = FrameBase & {
  nodes: TreeNode[];
  roots: number[];
  /** Node ids in backing-array order, for structures stored in an array such as a binary heap. */
  array?: number[];
  aux: { title: string; items: string[] };
  answer?: string;
};

export type Graph = {
  nodes: { id: number; name: string; x: number; y: number }[];
  edges: { u: number; v: number; w: number }[];
};

export type ScanMark = "compare" | "active" | "pivot" | "swap" | "found" | "muted";

/** A highlighted rectangle over items `from..to`, between values `low` and `high` (the full plot height when omitted). */
export type ScanBand = { from: number; to: number; low?: number; high?: number };

/** A band swatch is not a bar mark, so the legend names it separately. */
export type ScanLegendMark = ScanMark | "band";

export type ScanAnswer = number | number[];

export type ScanFrame = FrameBase & {
  items: ArrayItem[];
  marks: Partial<Record<number, ScanMark>>;
  pointers: Partial<Record<string, number>>;
  bands: ScanBand[];
  labels: Partial<Record<number, string>>;
  aux?: { title: string; indices: number[] };
  /** The function's return value, present only once it returns. */
  answer?: ScanAnswer;
};

/** `target` is a value to find or a sum to reach; `k` is a window size or a rank. */
export type ScanInput = { values: number[]; target?: number; k?: number };

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
export type StringMark = "match" | "mismatch" | "known" | "window" | "active";

type AuxValues = { title: string; values: (number | null)[]; marks: Partial<Record<number, StringMark>> };

export type StringAux = AuxValues & ({ under: "text" | "pattern" } | { under: "table"; keys: string[] });

/** "prepare" builds tables before the pattern meets the text. */
type StringPhase = { phase: "prepare" } | { phase: "search"; offset: number } | { phase: "done" };

export type StringFrame = FrameBase &
  StringPhase & {
    text: string;
    pattern: string;
    /** Scanned ahead of the text: Z-function search scans pattern + "$" + text. */
    prefix: string;
    /** By pattern index. During the search each mark also colours the text cell above it. */
    marks: Partial<Record<number, StringMark>>;
    aux?: StringAux;
    matches: number[];
  };

export type OpsMark = "probe" | "hit" | "miss" | "new" | "moved" | "tomb" | "empty" | "link";

/** `id` keeps a cell's DOM node across frames, so a cell that changes position slides there. */
export type Cell = { id: string; text: string; sub?: string; mark?: OpsMark };

/** A point on a hash ring, `angle` degrees clockwise from the top. `tone` picks the owning server's colour. */
export type RingPoint = { id: string; text: string; angle: number; tone: number; mark?: OpsMark };

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

export const TOPIC_LABELS = { sorting: "Sorting", graph: "Graph", arrays: "Arrays", dp: "Dynamic programming", backtracking: "Backtracking", grids: "Grids", tree: "Trees", strings: "Strings", systems: "System design" } as const;
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
  /** The trace ends when a goal node settles, so nodes it never reached stay idle. */
  stopsAtGoal?: boolean;
  /** The trace ends when a cycle closes, so nodes outside the cycle are not all finished. */
  stopsAtCycle?: boolean;
  /** Edges point from `u` to `v`. The input is an acyclic orientation of a layout, plus back edges when "cyclic". */
  directed?: Directed;
  /** The answer does not depend on the start node, so the page neither asks for one nor draws it. */
  ignoresStart?: boolean;
  run: (graph: Graph, start: number) => GraphFrame[];
};

export type ScanAlgorithm = AlgorithmBase & {
  kind: "scan";
  /** Pointer names in chip-row order, top to bottom. */
  pointers: readonly string[];
  /** One entry per mark or band this algorithm draws, and no others. */
  legend: readonly (readonly [mark: ScanLegendMark, label: string])[];
  /** Heading for the per-index label row. Set exactly when the algorithm writes labels. */
  labelTitle?: string;
  makeInput: (size: number) => ScanInput;
  run: (input: ScanInput) => ScanFrame[];
  /** A direct computation of the answer, used as the test oracle. */
  solve: (input: ScanInput) => ScanAnswer;
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

export type TreeAlgorithm = AlgorithmBase & {
  kind: "tree";
  run: (keys: number[]) => TreeFrame[];
};

export type StringAlgorithm = AlgorithmBase & {
  kind: "string";
  run: (text: string, pattern: string) => StringFrame[];
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

export type Algorithm = SortingAlgorithm | GraphAlgorithm | ScanAlgorithm | GridAlgorithm | TreeAlgorithm | StringAlgorithm | OpsAlgorithm;

export const edgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);
