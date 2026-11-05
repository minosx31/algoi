import { useEffect, useMemo, useState } from "react";
import type { Algorithm, ArrayFrame, Graph, GraphFrame, LangId } from "../core/types";
import { randomArray, sampleGraph } from "../core/inputs";
import { usePlayer } from "./usePlayer";
import { ArrayView } from "./ArrayView";
import { GraphView } from "./GraphView";
import { CodePanel } from "./CodePanel";

type Input = { kind: "sorting"; values: number[] } | { kind: "graph"; graph: Graph; start: number };

function freshInput(algo: Algorithm, size: number): Input {
  return algo.kind === "sorting"
    ? { kind: "sorting", values: randomArray(size) }
    : { kind: "graph", graph: sampleGraph(), start: 0 };
}

function runAlgorithm(algo: Algorithm, input: Input): (ArrayFrame | GraphFrame)[] {
  if (algo.kind === "sorting" && input.kind === "sorting") return algo.run(input.values);
  if (algo.kind === "graph" && input.kind === "graph") return algo.run(input.graph, input.start);
  throw new Error(`Input kind ${input.kind} does not match ${algo.id}`);
}

const SPEEDS = [
  { label: "0.25×", ms: 1200 },
  { label: "0.5×", ms: 600 },
  { label: "1×", ms: 300 },
  { label: "2×", ms: 150 },
  { label: "4×", ms: 60 },
  { label: "10×", ms: 20 },
];

export function Visualizer({ algo, lang, onLang }: { algo: Algorithm; lang: LangId; onLang: (l: LangId) => void }) {
  const [size, setSize] = useState(16);
  const [{ input, version }, setState] = useState(() => ({ input: freshInput(algo, size), version: 0 }));
  const setInput = (next: Input) => setState({ input: next, version: version + 1 });
  const frames = useMemo(() => runAlgorithm(algo, input), [algo, input]);
  // Keyed by input version so a new trace starts a fresh player at frame 0.
  return <Player key={version} {...{ algo, lang, onLang, input, setInput, size, setSize, frames }} />;
}

type PlayerProps = {
  algo: Algorithm;
  lang: LangId;
  onLang: (l: LangId) => void;
  input: Input;
  setInput: (i: Input) => void;
  size: number;
  setSize: (n: number) => void;
  frames: (ArrayFrame | GraphFrame)[];
};

function Player({ algo, lang, onLang, input, setInput, size, setSize, frames }: PlayerProps) {
  const [speed, setSpeed] = useState(2);
  const { index, playing, last, dispatch } = usePlayer(frames.length, SPEEDS[speed].ms);
  const frame = frames[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === " ") dispatch({ type: "toggle" });
      else if (e.key === "ArrowRight") dispatch({ type: "step", delta: 1 });
      else if (e.key === "ArrowLeft") dispatch({ type: "step", delta: -1 });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  return (
    <div className="workspace">
      <section className="stage">
        <header className="stage-head">
          <div>
            <h1>{algo.name}</h1>
            <p className="summary">{algo.summary}</p>
          </div>
          <dl className="complexity" aria-label="Complexity">
            <div>
              <dt>Time</dt>
              <dd>{algo.complexity.time}</dd>
            </div>
            <div>
              <dt>Space</dt>
              <dd>{algo.complexity.space}</dd>
            </div>
          </dl>
        </header>

        <div className="input-bar">
          {input.kind === "sorting" ? (
            <>
              <label>
                Size <strong>{size}</strong>
                <input type="range" min={4} max={48} value={size} onChange={(e) => {
                    setSize(+e.target.value);
                    setInput({ kind: "sorting", values: randomArray(+e.target.value) });
                  }}
                />
              </label>
              <button onClick={() => setInput({ kind: "sorting", values: randomArray(size) })}>New array</button>
            </>
          ) : (
            <>
              <span className="hint">Click a node to start from it.</span>
              {algo.kind === "graph" && algo.weighted && (
                <button onClick={() => setInput({ ...input, graph: sampleGraph(true) })}>Random weights</button>
              )}
            </>
          )}
        </div>

        <div className="canvas">
          {input.kind === "sorting" ? (
            <ArrayView frame={frame as ArrayFrame} max={100} />
          ) : (
            <GraphView
              graph={input.graph}
              frame={frame as GraphFrame}
              start={input.start}
              weighted={algo.kind === "graph" && algo.weighted}
              onPickStart={(start) => setInput({ ...input, start })}
            />
          )}
        </div>

        <Legend kind={algo.kind} />

        <div className="controls">
          <div className="buttons">
            <button aria-label="First step" onClick={() => dispatch({ type: "seek", index: 0 })}>
              <Icon d="M6 5v14M18 6l-9 6 9 6z" />
            </button>
            <button aria-label="Previous step" onClick={() => dispatch({ type: "step", delta: -1 })}>
              <Icon d="M15 6l-6 6 6 6" />
            </button>
            <button className="primary" aria-label={playing ? "Pause" : "Play"} onClick={() => dispatch({ type: "toggle" })}>
              {playing ? <Icon d="M8 5v14M16 5v14" /> : <Icon d="M7 5l12 7-12 7z" fill />}
            </button>
            <button aria-label="Next step" onClick={() => dispatch({ type: "step", delta: 1 })}>
              <Icon d="M9 6l6 6-6 6" />
            </button>
            <button aria-label="Last step" onClick={() => dispatch({ type: "seek", index: last })}>
              <Icon d="M18 5v14M6 6l9 6-9 6z" />
            </button>
          </div>
          <input
            className="scrub"
            type="range"
            min={0}
            max={last}
            value={index}
            aria-label="Step"
            onChange={(e) => dispatch({ type: "seek", index: +e.target.value })}
          />
          <span className="counter">
            {index + 1} / {last + 1}
          </span>
          <select aria-label="Speed" value={speed} onChange={(e) => setSpeed(+e.target.value)}>
            {SPEEDS.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="narration">
          <p className="note" aria-live="polite">{frame.note}</p>
          <div className="state">
            {frame.vars &&
              Object.entries(frame.vars).map(([k, v]) => (
                <span key={k} className="var">
                  {k} = <b>{v}</b>
                </span>
              ))}
            {"aux" in frame && (
              <span className="aux">
                {frame.aux.title}: <b>[{frame.aux.items.join(", ")}]</b>
              </span>
            )}
          </div>
        </div>
      </section>

      <CodePanel code={algo.code} lang={lang} onLang={onLang} activeLabel={frame.line} />
    </div>
  );
}

const LEGENDS = {
  sorting: [
    ["compare", "Comparing"],
    ["swap", "Moved"],
    ["pivot", "Pivot"],
    ["active", "Active"],
    ["sorted", "Final position"],
  ],
  graph: [
    ["current", "Current"],
    ["frontier", "Discovered"],
    ["visited", "Done"],
    ["tree", "Tree edge"],
  ],
} as const;

function Legend({ kind }: { kind: Algorithm["kind"] }) {
  return (
    <ul className="legend">
      {LEGENDS[kind].map(([mark, label]) => (
        <li key={mark}>
          <i data-mark={mark} /> {label}
        </li>
      ))}
    </ul>
  );
}

function Icon({ d, fill = false }: { d: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d={d} fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
