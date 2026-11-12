import type { ComponentType } from "react";
import { ArrayView } from "../components/ArrayView";
import { GraphView } from "../components/GraphView";
import { ScanView } from "../components/ScanView";
import { buildGraph, layoutsOf, randomArray, withRandomWeights, type LayoutId } from "./inputs";
import type { Algorithm, Graph, ScanInput } from "./types";

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
  endState: (algo: AlgoOf<K>) => { all: string; done: string; label: string };
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
  endState: () => ({ all: ".bar", done: '.bar[data-mark="sorted"]', label: "every bar ends sorted" }),
};

type GraphInput = { layout: LayoutId; graph: Graph; start: number };

const graphInput = (algo: AlgoOf<"graph">, layout: LayoutId): GraphInput => {
  const offered = layoutsOf(!!algo.directed).some((l) => l.id === layout) ? layout : "mesh";
  return { layout: offered, graph: buildGraph(offered, algo.directed), start: 0 };
};

const graph: ViewRow<"graph", GraphInput> = {
  makeInput: graphInput,
  largestInput: (algo) => graphInput(algo, "grid"),
  run: (algo, { graph, start }) => algo.run(graph, start),
  Canvas: ({ algo, input, frame, setInput }) => (
    <GraphView
      graph={input.graph}
      frame={frame}
      start={algo.ignoresStart ? undefined : input.start}
      weighted={algo.weighted}
      goal={frame.vars?.goal}
      directed={!!algo.directed}
      onPickStart={algo.ignoresStart ? undefined : (start) => setInput({ ...input, start })}
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
            setInput(graphInput(algo, layout));
          }}
        >
          {layoutsOf(!!algo.directed).map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      {input.layout === "random" && <button onClick={() => setInput(graphInput(algo, "random"))}>New graph</button>}
      {algo.weighted && <button onClick={() => setInput({ ...input, graph: withRandomWeights(input.graph) })}>Random weights</button>}
      {!algo.ignoresStart && <span className="hint">Click a node to start there.</span>}
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
  endState: (algo) =>
    algo.stopsAtCycle
      ? { all: '.edge[data-mark="tree"]', done: '.node[data-mark="visited"]', label: "the cycle is closed: as many drawn nodes as drawn edges" }
      : algo.stopsAtGoal
        ? {
            all: ".node[data-goal]",
            done: 'svg:has(.edge[data-mark="tree"]) .node[data-goal][data-mark="visited"]',
            label: "the goal ends visited with a tree edge drawn",
          }
        : { all: ".node", done: '.node[data-mark="visited"]', label: "every node ends visited" },
};

const SCAN_SIZE = { initial: 16, min: 4, max: 48 };

const scan: ViewRow<"scan", ScanInput> = {
  makeInput: (algo) => algo.makeInput(SCAN_SIZE.initial),
  largestInput: (algo) => algo.makeInput(SCAN_SIZE.max),
  run: (algo, input) => algo.run(input),
  Canvas: ({ algo, frame }) => <ScanView algo={algo} frame={frame} />,
  Controls: ({ algo, input, setInput }) => (
    <>
      <label>
        Size <strong>{input.values.length}</strong>
        <input
          type="range"
          min={SCAN_SIZE.min}
          max={SCAN_SIZE.max}
          value={input.values.length}
          onChange={(e) => setInput(algo.makeInput(+e.target.value))}
        />
      </label>
      <button onClick={() => setInput(algo.makeInput(input.values.length))}>New input</button>
    </>
  ),
  legend: [],
  endState: () => ({ all: ".scan-view", done: ".scan-view .answer", label: "the answer shows at the last step" }),
};

export const VIEWS = { sorting, graph, scan } satisfies { [K in Kind]: ViewRow<K, any> };

export type Input = ReturnType<(typeof VIEWS)[Kind]["makeInput"]>;
export type Frame = FrameOf<Kind>;
export type View = ViewRow<Kind, Input>;

export const viewOf = (algo: Algorithm) => VIEWS[algo.kind] as unknown as View;
