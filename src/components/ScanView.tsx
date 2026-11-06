import type { ScanAnswer, ScanFrame } from "../core/types";

type Props = { frame: ScanFrame; pointers: readonly string[] };

const format = (answer: ScanAnswer) => (Array.isArray(answer) ? `[${answer.join(", ")}]` : String(answer));

export function ScanView({ frame, pointers }: Props) {
  const n = frame.items.length;
  const values = frame.items.map((item) => item.value);
  const top = Math.max(0, ...values);
  const span = top - Math.min(0, ...values) || 1;
  const y = (value: number) => ((top - value) / span) * 100;
  const center = (i: number) => `clamp(14px, ${((i + 0.5) / n) * 100}%, calc(100% - 14px))`;
  const density = n <= 16 ? "roomy" : n <= 24 ? "medium" : "dense";
  const slots = frame.items.map((item, i) => ({ item, i }));
  // Render in id order so React keeps each bar's DOM node; position comes from the slot index.
  slots.sort((a, b) => a.item.id - b.item.id);

  return (
    <div className="scan-view" data-density={density}>
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

      <div className="scan-plot">
        {frame.bands.map((band, k) => {
          const high = band.high === undefined ? 0 : y(band.high);
          const low = band.low === undefined ? 100 : y(band.low);
          const left = (band.from / n) * 100;
          const width = ((band.to - band.from + 1) / n) * 100;
          return <div key={k} className="band" style={{ left: `${left}%`, width: `${width}%`, top: `${high}%`, height: `${low - high}%` }} />;
        })}
        <div className="baseline" style={{ top: `${y(0)}%` }} />
        {slots.map(({ item, i }) => (
          <div
            key={item.id}
            className="bar"
            data-mark={frame.marks[i] ?? "idle"}
            data-sign={item.value < 0 ? "neg" : "pos"}
            style={{
              width: `${100 / n}%`,
              transform: `translateX(${i * 100}%)`,
              top: `${y(Math.max(0, item.value))}%`,
              height: `${(Math.abs(item.value) / span) * 100}%`,
            }}
          >
            {density !== "dense" && <span>{item.value}</span>}
          </div>
        ))}
      </div>

      <ol className="scan-labels">
        {density !== "dense" &&
          Object.entries(frame.labels).map(([i, text]) => (
            <li key={i} data-index={i} style={{ left: center(+i) }}>
              {text}
            </li>
          ))}
      </ol>

      {pointers.map((name) => {
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
    </div>
  );
}
