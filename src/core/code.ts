const TAG = /\s*@@([\w-]+)\s*$/;

export type CodeLine = { text: string; label: string | null };

export function parseListing(source: string): CodeLine[] {
  const lines = source.replace(/^\n+|\s+$/g, "").split("\n");
  return lines.map((raw) => {
    const m = raw.match(TAG);
    return m ? { text: raw.slice(0, m.index), label: m[1] } : { text: raw, label: null };
  });
}

export function labelsOf(source: string): Set<string> {
  return new Set(parseListing(source).flatMap((l) => (l.label ? [l.label] : [])));
}
