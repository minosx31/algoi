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

/** Every algorithm documents itself in the same fixed structure. */
export type About = {
  summary: string;
  invariants: string[];
  useCases: string[];
};

export type Complexity = { best: string; average: string; worst: string; space: string };

export const TOPIC_LABELS = { sorting: "Sorting", graph: "Graph", arrays: "Arrays" } as const;
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

export type Algorithm = SortingAlgorithm | GraphAlgorithm | ScanAlgorithm;

export const edgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);
