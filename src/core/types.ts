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

/** Every algorithm documents itself in the same fixed structure. */
export type About = {
  summary: string;
  invariants: string[];
  useCases: string[];
};

export type Complexity = { best: string; average: string; worst: string; space: string };

export const TOPIC_LABELS = { sorting: "Sorting", graph: "Graph" } as const;
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
  run: (graph: Graph, start: number) => GraphFrame[];
};

export type Algorithm = SortingAlgorithm | GraphAlgorithm;

export const edgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);
