import { useEffect, useState } from "react";
import { ALGORITHMS, findAlgorithm } from "./algorithms";
import { LANGUAGES, TOPIC_LABELS, type LangId, type Topic } from "./core/types";
import { Visualizer } from "./components/Visualizer";
import type { LayoutId } from "./core/inputs";

const routeId = () => window.location.hash.replace(/^#\/?/, "");

function storedLang(): LangId {
  try {
    const v = localStorage.getItem("lang");
    if (LANGUAGES.some((l) => l.id === v)) return v as LangId;
  } catch {
    /* storage unavailable */
  }
  return "python";
}

export function App() {
  const [id, setId] = useState(routeId);
  const [lang, setLang] = useState<LangId>(storedLang);
  const [layout, setLayout] = useState<LayoutId>("mesh");
  const algo = findAlgorithm(id) ?? ALGORITHMS[0];

  useEffect(() => {
    const onHash = () => setId(routeId());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const chooseLang = (l: LangId) => {
    setLang(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* storage unavailable */
    }
  };

  const topics = Object.keys(TOPIC_LABELS) as Topic[];

  return (
    <div className="app">
      <nav className="sidebar" aria-label="Algorithms">
        <a className="brand" href="#/" aria-label="algoi home">
          algoi<span>!</span>
          <small>algorithms, but すごい</small>
        </a>
        <select
          className="algo-picker"
          aria-label="Algorithm"
          value={algo.id}
          onChange={(e) => (window.location.hash = `#/${e.target.value}`)}
        >
          {topics.map((topic) => (
            <optgroup key={topic} label={TOPIC_LABELS[topic]}>
              {ALGORITHMS.filter((a) => a.topic === topic).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {topics.map((topic) => (
          <div key={topic} className="group">
            <h2>{TOPIC_LABELS[topic]}</h2>
            <ul>
              {ALGORITHMS.filter((a) => a.topic === topic).map((a) => (
                <li key={a.id}>
                  <a href={`#/${a.id}`} aria-current={a.id === algo.id ? "page" : undefined}>
                    {a.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="keys">Space play/pause · ← → step</p>
      </nav>
      <main>
        <Visualizer key={algo.id} algo={algo} lang={lang} onLang={chooseLang} layout={layout} onLayout={setLayout} />
      </main>
    </div>
  );
}
