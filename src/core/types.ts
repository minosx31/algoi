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

/** Every algorithm documents itself in the same fixed structure. */
export type About = {
  summary: string;
  invariants: string[];
  useCases: string[];
};

export type Complexity = { best: string; average: string; worst: string; space: string };

export const TOPIC_LABELS = { sorting: "Sorting", graph: "Graph", strings: "Strings" } as const;
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

export type StringAlgorithm = AlgorithmBase & {
  kind: "string";
  run: (text: string, pattern: string) => StringFrame[];
};

export type Algorithm = SortingAlgorithm | GraphAlgorithm | StringAlgorithm;

export const edgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);
