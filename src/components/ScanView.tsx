import { useLayoutEffect, useRef, useState } from "react";
import type { ScanAlgorithm, ScanAnswer, ScanFrame } from "../core/types";

type Props = { algo: ScanAlgorithm; frame: ScanFrame };

const format = (answer: ScanAnswer) => (Array.isArray(answer) ? `[${answer.join(", ")}]` : String(answer));

const FONTS = [12, 10, 9];
const GLYPH_EM = 0.62;
const GAP_PX = 2;
const LANE_PX = 16;
const MIN_LABEL_CHARS = 4;

const fits = (chars: number, room: number) => FONTS.find((px) => chars * GLYPH_EM * px + GAP_PX <= room);

/** Labels that are too wide for one slot alternate between two lanes; wider than two slots, they are hidden. */
function labelLayout(chars: number, slot: number) {
  for (const lanes of [1, 2]) {
    const px = fits(chars, slot * lanes);
    if (px) return { px, lanes };
  }
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current!;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export function ScanView({ algo, frame }: Props) {
  const [plot, width] = useWidth();
  const n = frame.items.length;
  const slot = width / n;
  const values = frame.items.map((item) => item.value);
  const top = Math.max(0, ...values);
  const span = top - Math.min(0, ...values) || 1;
  const y = (value: number) => ((top - value) / span) * 100;
  const center = (i: number) => `clamp(14px, ${((i + 0.5) / n) * 100}%, calc(100% - 14px))`;
  const valuePx = fits(Math.max(...values.map((v) => String(v).length)), slot);
  const labelChars = Math.max(MIN_LABEL_CHARS, ...Object.values(frame.labels).map((text) => text!.length));
  const labelRow = labelLayout(labelChars, slot);
  const slots = frame.items.map((item, i) => ({ item, i }));
  // Render in id order so React keeps each bar's DOM node; position comes from the slot index.
  slots.sort((a, b) => a.item.id - b.item.id);

  return (
    <div className="scan-view">
      <div className="scan-strip">
        {frame.aux && (
          <div className="aux-list">
            {frame.aux.title}
            <ol>
              {frame.aux.indices.map((i) => (
                <li key={i} data-value={frame.items[i].value}>
                  {frame.items[i].value}
                  <sub>{i}</sub>
                </li>
              ))}
            </ol>
          </div>
        )}
        {frame.answer !== undefined && (
          <output className="answer" title={format(frame.answer)}>
            Returns <b>{format(frame.answer)}</b>
          </output>
        )}
      </div>

      <div className="scan-plot" ref={plot}>
        {frame.bands.map((band, k) => {
          const high = band.high === undefined ? 0 : y(band.high);
          const low = band.low === undefined ? 100 : y(band.low);
          const left = (band.from / n) * 100;
          const w = ((band.to - band.from + 1) / n) * 100;
          return <div key={k} className="band" style={{ left: `${left}%`, width: `${w}%`, top: `${high}%`, height: `${low - high}%` }} />;
        })}
        <div className="baseline" style={{ top: `${y(0)}%` }} />
        {slots.map(({ item, i }) => (
          <div
            key={item.id}
            className="bar"
            data-mark={frame.marks[i] ?? "idle"}
            data-sign={item.value < 0 ? "neg" : item.value > 0 ? "pos" : "zero"}
            style={{
              width: `${100 / n}%`,
              transform: `translateX(${i * 100}%)`,
              top: `${y(Math.max(0, item.value))}%`,
              height: `${(Math.abs(item.value) / span) * 100}%`,
            }}
          >
            {valuePx && <span style={{ fontSize: valuePx }}>{item.value}</span>}
          </div>
        ))}
      </div>

      {algo.labelTitle && (
        <>
          <p className="scan-caption">
            {algo.labelTitle}
            {!labelRow && " (hidden at this width)"}
          </p>
          <ol className="scan-labels" style={{ height: (labelRow?.lanes ?? 0) * LANE_PX, fontSize: labelRow?.px }}>
            {labelRow &&
              Object.entries(frame.labels).map(([i, text]) => (
                <li key={i} data-index={i} style={{ left: `${((+i + 0.5) / n) * 100}%`, top: (+i % labelRow.lanes) * LANE_PX }}>
                  {text}
                </li>
              ))}
          </ol>
        </>
      )}

      {algo.pointers.map((name) => {
        const at = frame.pointers[name];
        return (
          <div key={name} className="pointer-row">
            {at !== undefined && (
              <span className="chip" data-index={at} style={{ left: center(at) }}>
                {name}
              </span>
            )}
          </div>
        );
      })}

      <ul className="legend">
        {algo.legend.map(([mark, label]) => (
          <li key={mark}>
            <i data-mark={mark} /> {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
