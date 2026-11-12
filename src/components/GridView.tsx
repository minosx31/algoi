import { useEffect, useRef, type CSSProperties } from "react";
import type { Coord, GridAlgorithm, GridFrame } from "../core/types";

type Props = { frame: GridFrame; legend: GridAlgorithm["legend"] };

export function GridView({ frame: { cells, rowHeaders, colHeaders, box }, legend }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const current = findCurrent(cells);

  // Scroll only the panel; scrolling the page would move the controls out from under the pointer.
  useEffect(() => {
    const p = panel.current;
    const cell = p?.querySelector<HTMLElement>('td[data-mark="current"]') ?? p?.querySelector<HTMLElement>('td[data-mark="result"]');
    if (!p || !cell) return;
    const view = p.getBoundingClientRect();
    const at = cell.getBoundingClientRect();
    const top = view.top + (p.querySelector("thead")?.offsetHeight ?? 0);
    const left = view.left + (p.querySelector<HTMLElement>("tbody th")?.offsetWidth ?? 0);
    const right = view.left + p.clientWidth;
    const bottom = view.top + p.clientHeight;
    if (at.left < left || at.right > right) p.scrollLeft += at.left - (left + right - at.width) / 2;
    if (at.top < top || at.bottom > bottom) p.scrollTop += at.top - (top + bottom - at.height) / 2;
  }, [cells]);

  const edge = (r: number, c: number) => {
    if (!box) return undefined;
    const sides = [(c + 1) % box.cols === 0 && c + 1 < cells[r].length && "r", (r + 1) % box.rows === 0 && r + 1 < cells.length && "b"];
    return sides.filter(Boolean).join(" ") || undefined;
  };

  return (
    <div className="grid-view">
      <div className="grid-scroll" ref={panel}>
        <table>
          {colHeaders && (
            <thead>
              <tr>
                {rowHeaders && <th />}
                {colHeaders.map((h, c) => (
                  <th key={c} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {cells.map((row, r) => (
              <tr key={r}>
                {rowHeaders && <th scope="row">{rowHeaders[r]}</th>}
                {row.map((cell, c) => (
                  <td key={c} data-mark={cell.mark ?? "idle"} data-box={edge(r, c)}>
                    {cell.text}
                    {cell.mark === "read" && current && <Arrow from={[r, c]} to={current} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="legend">
        {legend.map(([mark, label]) => (
          <li key={mark}>
            <i data-mark={mark} /> {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function findCurrent(cells: GridFrame["cells"]): Coord | undefined {
  const found: Coord[] = [];
  cells.forEach((row, r) => row.forEach((cell, c) => cell.mark === "current" && found.push([r, c])));
  return found.length === 1 ? found[0] : undefined;
}

function Arrow({ from: [r, c], to: [tr, tc] }: { from: Coord; to: Coord }) {
  return <span className="arrow" aria-hidden="true" style={{ "--dx": tc - c, "--dy": tr - r } as CSSProperties} />;
}
