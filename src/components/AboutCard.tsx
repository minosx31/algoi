import type { About, Complexity } from "../core/types";

const CASES = [
  ["best", "Best time"],
  ["average", "Average time"],
  ["worst", "Worst time"],
  ["space", "Space"],
] as const;

export function AboutCard({ about, complexity }: { about: About; complexity: Complexity }) {
  return (
    <section className="about" aria-label="About this algorithm">
      <h2>Summary</h2>
      <p className="lead">{about.summary}</p>

      <h2>Invariants</h2>
      <ul>
        {about.invariants.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <h2>Complexity</h2>
      <dl className="complexity">
        {CASES.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{complexity[key]}</dd>
          </div>
        ))}
      </dl>

      <h2>Use cases</h2>
      <ul>
        {about.useCases.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  );
}
