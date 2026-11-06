import { useEffect, useMemo, useState } from "react";
import type { Algorithm, LangId } from "../core/types";
import type { LayoutId } from "../core/inputs";
import { viewOf, type Frame, type Input, type View } from "../core/views";
import { usePlayer } from "./usePlayer";
import { CodePanel } from "./CodePanel";
import { AboutCard } from "./AboutCard";

const SPEEDS = [
  { label: "0.25×", ms: 1200 },
  { label: "0.5×", ms: 600 },
  { label: "1×", ms: 300 },
  { label: "2×", ms: 150 },
  { label: "4×", ms: 60 },
  { label: "10×", ms: 20 },
];

type VisualizerProps = {
  algo: Algorithm;
  lang: LangId;
  onLang: (l: LangId) => void;
  layout: LayoutId;
  onLayout: (l: LayoutId) => void;
};

export function Visualizer({ algo, lang, onLang, layout, onLayout }: VisualizerProps) {
  const view = viewOf(algo);
  const [input, setInput] = useState(() => view.makeInput(algo, layout));
  const frames = useMemo(() => view.run(algo, input), [view, algo, input]);
  return <Player {...{ algo, view, lang, onLang, onLayout, input, setInput, frames }} />;
}

type PlayerProps = {
  algo: Algorithm;
  view: View;
  lang: LangId;
  onLang: (l: LangId) => void;
  onLayout: (l: LayoutId) => void;
  input: Input;
  setInput: (i: Input) => void;
  frames: Frame[];
};

function Player({ algo, view: { Controls, Canvas, Status, legend }, lang, onLang, onLayout, input, setInput, frames }: PlayerProps) {
  const [speed, setSpeed] = useState(2);
  const { index, playing, last, dispatch } = usePlayer(frames, SPEEDS[speed].ms);
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
        <h1>{algo.name}</h1>

        <div className="input-bar">
          <Controls algo={algo} input={input} setInput={setInput} onLayout={onLayout} />
        </div>

        <div className="canvas">
          <Canvas algo={algo} input={input} frame={frame} setInput={setInput} />
        </div>

        <Legend legend={legend} />

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
            {Status && <Status frame={frame} />}
          </div>
        </div>
      </section>

      <CodePanel code={algo.code} lang={lang} onLang={onLang} activeLabel={frame.line} />
      <AboutCard about={algo.about} complexity={algo.complexity} />
    </div>
  );
}

function Legend({ legend }: { legend: View["legend"] }) {
  return (
    <ul className="legend">
      {legend.map(([mark, label]) => (
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
