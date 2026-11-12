import { StringTracer } from "../../core/trace";
import type { StringAlgorithm, StringAux } from "../../core/types";

export const horspool: StringAlgorithm = {
  id: "horspool",
  name: "Boyer–Moore–Horspool",
  kind: "string",
  topic: "strings",
  about: {
    summary:
      "Compares the pattern right to left at each alignment, then skips ahead by a precomputed distance looked up for the text character under the pattern's last cell.",
    invariants: [
      "shift[c] is the distance from the last occurrence of c in P[0..m−2] to the end of the pattern, or m when c does not occur there.",
      "No skip passes over a match: a shorter skip would put an earlier copy of the same character under that text position, and the table already picks the nearest one.",
    ],
    useCases: [
      "General text search over a large alphabet, where most skips are close to the full pattern length.",
      "The Boyer–Moore family behind fast search in tools such as GNU grep.",
    ],
  },
  complexity: { best: "O(n / m)", average: "O(n)", worst: "O(n·m)", space: "O(σ)" },
  code: {
    pseudo: `
procedure horspool(T, P)
  n ← |T|; m ← |P|
  for j ← 0 to m − 2 do shift[P[j]] ← m − 1 − j         @@table
  matches ← empty list; s ← 0
  while s ≤ n − m do                                    @@align
    j ← m − 1
    while j ≥ 0 and T[s + j] = P[j] do j ← j − 1        @@compare
    if j < 0 then append s to matches                   @@found
    s ← s + shift[T[s + m − 1]], or m if it is absent   @@skip
  return matches                                        @@done
`,
    python: `
def horspool(text, pattern):
    n, m = len(text), len(pattern)
    shift = {}                                          @@table
    for j in range(m - 1):                              @@table
        shift[pattern[j]] = m - 1 - j                   @@table
    matches, s = [], 0
    while s <= n - m:                                   @@align
        j = m - 1
        while j >= 0 and text[s + j] == pattern[j]:     @@compare
            j -= 1
        if j < 0:                                       @@found
            matches.append(s)                           @@found
        s += shift.get(text[s + m - 1], m)              @@skip
    return matches                                      @@done
`,
    cpp: `
std::vector<int> horspool(const std::string& text, const std::string& pattern) {
    int n = text.size(), m = pattern.size();
    std::unordered_map<char, int> shift;                    @@table
    for (int j = 0; j < m - 1; j++) shift[pattern[j]] = m - 1 - j;   @@table
    std::vector<int> matches;
    for (int s = 0; s <= n - m;) {                          @@align
        int j = m - 1;
        while (j >= 0 && text[s + j] == pattern[j]) j--;    @@compare
        if (j < 0) matches.push_back(s);                    @@found
        auto it = shift.find(text[s + m - 1]);              @@skip
        s += it == shift.end() ? m : it->second;            @@skip
    }
    return matches;                                         @@done
}
`,
    java: `
static List<Integer> horspool(String text, String pattern) {
    int n = text.length(), m = pattern.length();
    Map<Character, Integer> shift = new HashMap<>();        @@table
    for (int j = 0; j < m - 1; j++) shift.put(pattern.charAt(j), m - 1 - j);   @@table
    List<Integer> matches = new ArrayList<>();
    for (int s = 0; s <= n - m;) {                          @@align
        int j = m - 1;
        while (j >= 0 && text.charAt(s + j) == pattern.charAt(j)) j--;    @@compare
        if (j < 0) matches.add(s);                          @@found
        s += shift.getOrDefault(text.charAt(s + m - 1), m); @@skip
    }
    return matches;                                         @@done
}
`,
    javascript: `
function horspool(text, pattern) {
  const n = text.length, m = pattern.length;
  const shift = new Map();                                  @@table
  for (let j = 0; j < m - 1; j++) shift.set(pattern[j], m - 1 - j);   @@table
  const matches = [];
  for (let s = 0; s <= n - m; ) {                           @@align
    let j = m - 1;
    while (j >= 0 && text[s + j] === pattern[j]) j--;       @@compare
    if (j < 0) matches.push(s);                             @@found
    s += shift.get(text[s + m - 1]) ?? m;                   @@skip
  }
  return matches;                                           @@done
}
`,
  },
  run(text, pattern) {
    const t = new StringTracer(text, pattern);
    const n = text.length;
    const m = pattern.length;
    const keys = [...new Set(pattern.slice(0, -1)), "other"];
    const values: (number | null)[] = keys.map((k) => (k === "other" ? m : null));
    const aux: StringAux = { title: "shift", under: "table", keys, values, marks: {} };
    t.aux = aux;
    t.phase = "prepare";
    t.step("table", `A character that is not in "${pattern.slice(0, -1)}" lets the pattern skip its full length, ${m}.`, { active: keys.length - 1 });
    for (let j = 0; j < m - 1; j++) {
      const key = keys.indexOf(pattern[j]);
      values[key] = m - 1 - j;
      t.marks = { [j]: "active" };
      t.step("table", `P[${j}] = '${pattern[j]}' is ${m - 1 - j} place(s) from the last cell, so shift['${pattern[j]}'] = ${m - 1 - j}.`, { vars: { j }, active: key });
    }

    for (let s = 0; s <= n - m; ) {
      t.slide(s);
      t.step("align", s === 0 ? "Line the pattern up with the start of the text." : `The pattern now starts at text index ${s}.`, { vars: { s } });
      let j = m - 1;
      while (j >= 0) {
        const same = t.compare(j);
        t.step(
          "compare",
          same ? `T[${s + j}] = P[${j}] = '${pattern[j]}', matching right to left.` : `T[${s + j}] = '${text[s + j]}' differs from P[${j}] = '${pattern[j]}'.`,
          { vars: { s, j } },
        );
        if (!same) break;
        j--;
      }
      if (j < 0) {
        t.matches.push(s);
        t.step("found", `All ${m} characters match, so the pattern occurs at index ${s}.`, { vars: { s } });
      }
      const c = text[s + m - 1];
      const key = keys.includes(c) ? keys.indexOf(c) : keys.length - 1;
      const skip = values[key]!;
      t.marks = { [m - 1]: "active" };
      t.step(
        "skip",
        key === keys.length - 1
          ? `T[${s + m - 1}] = '${c}' sits under the last cell and is not in the table, so skip the full ${m}.`
          : `T[${s + m - 1}] = '${c}' sits under the last cell and shift['${c}'] = ${skip}, so skip ${skip}.`,
        { vars: { s }, active: key },
      );
      s += skip;
    }
    t.finish("done", `Made ${t.compares} comparisons and found ${t.matches.length} match(es).`);
    return t.frames;
  },
};
