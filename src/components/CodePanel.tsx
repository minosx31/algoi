import { useEffect, useMemo, useRef } from "react";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import cpp from "highlight.js/lib/languages/cpp";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import { parseListing } from "../core/code";
import { LANGUAGES, type CodeListings, type LangId } from "../core/types";

hljs.registerLanguage("python", python);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);

type Props = { code: CodeListings; lang: LangId; onLang: (l: LangId) => void; activeLabel: string };

export function CodePanel({ code, lang, onLang, activeLabel }: Props) {
  const grammar = LANGUAGES.find((l) => l.id === lang)!.hljs;
  const lines = useMemo(
    () =>
      parseListing(code[lang]).map((l) => ({
        label: l.label,
        html: grammar ? hljs.highlight(l.text, { language: grammar }).value : escape(l.text),
      })),
    [code, lang, grammar],
  );
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    listRef.current?.querySelector(".active")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeLabel, lang]);

  return (
    <section className="code-panel">
      <div className="tabs" role="tablist">
        {LANGUAGES.map((l) => (
          <button key={l.id} role="tab" aria-selected={l.id === lang} onClick={() => onLang(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
      <ol ref={listRef} className={`code hljs lang-${lang}`}>
        {lines.map((l, i) => (
          <li key={i} className={l.label === activeLabel ? "active" : undefined}>
            <code dangerouslySetInnerHTML={{ __html: l.html || " " }} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
