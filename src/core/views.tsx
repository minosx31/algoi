import type { ComponentType } from "react";
import { ArrayView } from "../components/ArrayView";
import { GraphView } from "../components/GraphView";
import { StringView } from "../components/StringView";
import { GRAPH_LAYOUTS, buildGraph, randomArray, randomSearch, withRandomWeights, type LayoutId } from "./inputs";
import type { Algorithm, Graph } from "./types";

type Kind = Algorithm["kind"];
type AlgoOf<K extends Kind> = Extract<Algorithm, { kind: K }>;
type FrameOf<K extends Kind> = ReturnType<AlgoOf<K>["run"]>[number];

type ViewRow<K extends Kind, I> = {
  makeInput: (algo: AlgoOf<K>, layout: LayoutId) => I;
  largestInput: (algo: AlgoOf<K>) => I;
  run: (algo: AlgoOf<K>, input: I) => FrameOf<K>[];
  Canvas: ComponentType<{ algo: AlgoOf<K>; input: I; frame: FrameOf<K>; setInput: (input: I) => void }>;
  Controls: ComponentType<{ algo: AlgoOf<K>; input: I; setInput: (input: I) => void; onLayout: (layout: LayoutId) => void }>;
  Status?: ComponentType<{ frame: FrameOf<K> }>;
  legend: readonly (readonly [mark: string, label: string])[];
  endState: { all: string; done: string; label: string };
};

const SORT_SIZE = { initial: 16, min: 4, max: 48 };

type SortingInput = { values: number[] };

const sorting: ViewRow<"sorting", SortingInput> = {
  makeInput: () => ({ values: randomArray(SORT_SIZE.initial) }),
  largestInput: () => ({ values: randomArray(SORT_SIZE.max) }),
  run: (algo, { values }) => algo.run(values),
  Canvas: ({ frame }) => <ArrayView frame={frame} max={100} />,
  Controls: ({ input, setInput }) => (
    <>
      <label>
        Size <strong>{input.values.length}</strong>
        <input
          type="range"
          min={SORT_SIZE.min}
          max={SORT_SIZE.max}
          value={input.values.length}
          onChange={(e) => setInput({ values: randomArray(+e.target.value) })}
        />
      </label>
      <button onClick={() => setInput({ values: randomArray(input.values.length) })}>New array</button>
    </>
  ),
  legend: [
    ["compare", "Comparing"],
    ["swap", "Moved"],
    ["pivot", "Pivot"],
    ["active", "Active"],
    ["sorted", "Final position"],
  ],
  endState: { all: ".bar", done: '.bar[data-mark="sorted"]', label: "every bar ends sorted" },
};

type GraphInput = { layout: LayoutId; graph: Graph; start: number };

const graphInput = (layout: LayoutId): GraphInput => ({ layout, graph: buildGraph(layout), start: 0 });

const graph: ViewRow<"graph", GraphInput> = {
  makeInput: (_, layout) => graphInput(layout),
  largestInput: () => graphInput("grid"),
  run: (algo, { graph, start }) => algo.run(graph, start),
  Canvas: ({ algo, input, frame, setInput }) => (
    <GraphView
      graph={input.graph}
      frame={frame}
      start={input.start}
      weighted={algo.weighted}
      onPickStart={(start) => setInput({ ...input, start })}
    />
  ),
  Controls: ({ algo, input, setInput, onLayout }) => (
    <>
      <label>
        Layout
        <select
          value={input.layout}
          onChange={(e) => {
            const layout = e.target.value as LayoutId;
            onLayout(layout);
            setInput(graphInput(layout));
          }}
        >
          {GRAPH_LAYOUTS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      {input.layout === "random" && <button onClick={() => setInput(graphInput("random"))}>New graph</button>}
      {algo.weighted && <button onClick={() => setInput({ ...input, graph: withRandomWeights(input.graph) })}>Random weights</button>}
      <span className="hint">Click a node to start there.</span>
    </>
  ),
  Status: ({ frame }) => (
    <span className="aux">
      {frame.aux.title}: <b>[{frame.aux.items.join(", ")}]</b>
    </span>
  ),
  legend: [
    ["current", "Current"],
    ["frontier", "Discovered"],
    ["visited", "Done"],
    ["tree", "Tree edge"],
  ],
  endState: { all: ".node", done: '.node[data-mark="visited"]', label: "every node ends visited" },
};

const TEXT_SIZE = { initial: 16, min: 8, max: 32 };

type StringInput = { text: string; pattern: string };

const string: ViewRow<"string", StringInput> = {
  makeInput: () => randomSearch(TEXT_SIZE.initial),
  largestInput: () => randomSearch(TEXT_SIZE.max),
  run: (algo, { text, pattern }) => algo.run(text, pattern),
  Canvas: ({ frame }) => <StringView frame={frame} />,
  Controls: ({ input, setInput }) => (
    <>
      <label>
        Text length <strong>{input.text.length}</strong>
        <input
          type="range"
          min={TEXT_SIZE.min}
          max={TEXT_SIZE.max}
          value={input.text.length}
          onChange={(e) => setInput(randomSearch(+e.target.value))}
        />
      </label>
      <button onClick={() => setInput(randomSearch(input.text.length))}>New text</button>
    </>
  ),
  legend: [
    ["match", "Match"],
    ["mismatch", "Mismatch"],
    ["known", "Known without comparing"],
    ["window", "Hash window"],
    ["found", "Occurrence"],
  ],
  endState: { all: ".string-view .matches li", done: '.string-view[data-phase="done"] .matches li', label: "the search ends with its match list shown" },
};

export const VIEWS = { sorting, graph, string } satisfies { [K in Kind]: ViewRow<K, any> };

export type Input = ReturnType<(typeof VIEWS)[Kind]["makeInput"]>;
export type Frame = FrameOf<Kind>;
export type View = ViewRow<Kind, Input>;

export const viewOf = (algo: Algorithm) => VIEWS[algo.kind] as unknown as View;
