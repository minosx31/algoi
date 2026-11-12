import { useEffect, useRef, type CSSProperties } from "react";
import type { StringAux, StringFrame } from "../core/types";

export function StringView({ frame }: { frame: StringFrame }) {
  const { text, pattern, prefix, marks, aux, matches } = frame;
  const row = [...(prefix + text)];
  const offset = frame.phase === "search" ? frame.offset : 0;
  const found = new Set(matches.flatMap((pos) => [...pattern].map((_, k) => prefix.length + pos + k)));
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    const first = el?.querySelector<HTMLElement>(".text .cell");
    if (!el || !first || frame.phase === "done") return;
    const left = first.offsetLeft + offset * first.offsetWidth;
    const width = pattern.length * first.offsetWidth;
    if (left < el.scrollLeft || left + width > el.scrollLeft + el.clientWidth) el.scrollTo({ left: left - (el.clientWidth - width) / 2 });
  }, [offset, pattern.length, frame.phase]);

  return (
    <div className="string-view" data-phase={frame.phase} ref={scroller}>
      <div className="rows" style={{ "--n": row.length, "--over": Math.max(0, offset + pattern.length - row.length) } as CSSProperties}>
        <div className="line index" aria-hidden="true">
          <span className="row-label" />
          {row.map((_, i) => (
            <span key={i}>{i >= prefix.length ? i - prefix.length : ""}</span>
          ))}
        </div>
        <div className="line text">
          <span className="row-label">{prefix ? "S" : "T"}</span>
          {row.map((c, i) => (
            <span
              key={i}
              className="cell"
              data-mark={frame.phase === "search" ? marks[i - offset] : undefined}
              data-found={found.has(i) || undefined}
              data-prefix={i < prefix.length || undefined}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="line">
          <span className="row-label">
            P{aux?.under === "pattern" && <small>{aux.title}</small>}
          </span>
          <div className="track">
            <div className="slide" style={{ "--offset": offset } as CSSProperties}>
              <div className="pattern">
                {[...pattern].map((c, j) => (
                  <span key={j} className="cell" data-mark={marks[j]}>
                    {c}
                  </span>
                ))}
              </div>
              {aux?.under === "pattern" && <AuxCells aux={aux} />}
            </div>
          </div>
        </div>
        {aux?.under === "text" && (
          <div className="line">
            <span className="row-label">{aux.title}</span>
            <AuxCells aux={aux} />
          </div>
        )}
      </div>
      {aux?.under === "table" && (
        <div className="aux-table">
          <span>{aux.title}</span>
          <dl>
            {aux.keys.map((key, i) => (
              <div key={key} data-mark={aux.marks[i]}>
                <dt>{key}</dt>
                <dd>{aux.values[i] ?? ""}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <div className="matches-line">
        Matches
        <ol className="matches">
          {matches.map((pos) => (
            <li key={pos}>{pos}</li>
          ))}
        </ol>
        {matches.length === 0 && <span>none yet</span>}
      </div>
    </div>
  );
}

function AuxCells({ aux }: { aux: StringAux }) {
  return (
    <div className="aux-row">
      {aux.values.map((v, i) => (
        <span key={i} className="cell" data-mark={aux.marks[i]}>
          {v ?? ""}
        </span>
      ))}
    </div>
  );
}
