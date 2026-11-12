import type { ComponentType } from "react";
import { ArrayView } from "../components/ArrayView";
import { GraphView } from "../components/GraphView";
import { GridView } from "../components/GridView";
import { ScanView } from "../components/ScanView";
import { TreeView } from "../components/TreeView";
import { buildGraph, layoutsOf, randomArray, randomKeys, withRandomWeights, type LayoutId } from "./inputs";
import type { Algorithm, Graph, GridAlgorithm, ScanInput } from "./types";

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

type GridInput = { size: number; data: unknown };

const gridInput = (algo: GridAlgorithm, size: number): GridInput => ({ size, data: algo.makeInput(size) });

const grid: ViewRow<"grid", GridInput> = {
  makeInput: (algo) => gridInput(algo, algo.size.initial),
  largestInput: (algo) => gridInput(algo, algo.size.max),
  run: (algo, { data }) => algo.run(data),
  Canvas: ({ algo, frame }) => <GridView frame={frame} legend={algo.legend} />,
  Controls: ({ algo, input, setInput }) => (
    <>
      <label>
        {algo.size.label} <strong>{input.size}</strong>
        <input
          type="range"
          min={algo.size.min}
          max={algo.size.max}
          value={input.size}
          onChange={(e) => setInput(gridInput(algo, +e.target.value))}
        />
      </label>
      <button onClick={() => setInput(gridInput(algo, input.size))}>New input</button>
    </>
  ),
  Status: ({ frame }) => (
    <>
      {frame.aux && (
        <span className="aux">
          {frame.aux.title}: <b>[{frame.aux.items.join(", ")}]</b>
        </span>
      )}
      {frame.answer !== undefined && (
        <span className="aux answer">
          Answer: <b>{frame.answer}</b>
        </span>
      )}
    </>
  ),
  legend: [],
  endState: () => ({ all: ".grid-view td", done: '.grid-view td:not([data-mark="pending"])', label: "every cell ends filled" }),
};

const TREE_SIZE = { initial: 9, min: 3, max: 15 };

type TreeInput = { keys: number[] };

const tree: ViewRow<"tree", TreeInput> = {
  makeInput: () => ({ keys: randomKeys(TREE_SIZE.initial) }),
  largestInput: () => ({ keys: randomKeys(TREE_SIZE.max) }),
  run: (algo, { keys }) => algo.run(keys),
  Canvas: ({ frame }) => <TreeView frame={frame} />,
  Controls: ({ input, setInput }) => (
    <>
      <label>
        Size <strong>{input.keys.length}</strong>
        <input
          type="range"
          min={TREE_SIZE.min}
          max={TREE_SIZE.max}
          value={input.keys.length}
          onChange={(e) => setInput({ keys: randomKeys(+e.target.value) })}
        />
      </label>
      <button onClick={() => setInput({ keys: randomKeys(input.keys.length) })}>New keys</button>
    </>
  ),
  Status: ({ frame }) => (
    <>
      <span className="aux">
        {frame.aux.title}: <b>[{frame.aux.items.join(", ")}]</b>
      </span>
      {frame.answer && <span className="aux answer">{frame.answer}</span>}
    </>
  ),
  legend: [
    ["compare", "Comparing"],
    ["path", "Path from the root"],
    ["swap", "Moved or replaced"],
    ["target", "Target"],
    ["done", "Done"],
  ],
  endState: () => ({ all: ".tree-node", done: '.workspace:has(.answer) .tree-node[data-mark="done"]', label: "every node ends done and the answer shows" }),
};

export const VIEWS = { sorting, graph, scan, grid, tree } satisfies { [K in Kind]: ViewRow<K, any> };

export type Input = ReturnType<(typeof VIEWS)[Kind]["makeInput"]>;
export type Frame = FrameOf<Kind>;
export type View = ViewRow<Kind, Input>;

export const viewOf = (algo: Algorithm) => VIEWS[algo.kind] as unknown as View;
