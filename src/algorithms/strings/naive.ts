import { StringTracer } from "../../core/trace";
import type { StringAlgorithm } from "../../core/types";

export const naiveSearch: StringAlgorithm = {
  id: "naive-search",
  name: "Naive String Search",
  kind: "string",
  topic: "strings",
  about: {
    summary: "Tries the pattern at every text position and compares characters left to right until one differs or the whole pattern matches.",
    invariants: [
      "Before alignment s is tried, every match that starts before s has been reported.",
      "At alignment s, the first j pattern characters equal the text characters under them.",
      "After a mismatch the pattern always moves exactly one position, whatever was already matched.",
    ],
    useCases: [
      "Short patterns, where its zero setup cost beats smarter algorithms.",
      "The baseline that shows what KMP, Z-function, and Horspool save.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n·m)", space: "O(1)" },
  code: {
    pseudo: `
procedure naiveSearch(T, P)
  n ← |T|; m ← |P|
  matches ← empty list
  for s ← 0 to n − m do                         @@shift
    j ← 0
    while j < m and T[s + j] = P[j] do          @@compare
      j ← j + 1
    if j = m then                               @@found
      append s to matches                       @@found
  return matches                                @@done
`,
    python: `
def naive_search(text, pattern):
    n, m = len(text), len(pattern)
    matches = []
    for s in range(n - m + 1):                          @@shift
        j = 0
        while j < m and text[s + j] == pattern[j]:      @@compare
            j += 1
        if j == m:                                      @@found
            matches.append(s)                           @@found
    return matches                                      @@done
`,
    cpp: `
std::vector<int> naiveSearch(const std::string& text, const std::string& pattern) {
    int n = text.size(), m = pattern.size();
    std::vector<int> matches;
    for (int s = 0; s <= n - m; s++) {                      @@shift
        int j = 0;
        while (j < m && text[s + j] == pattern[j]) j++;     @@compare
        if (j == m) matches.push_back(s);                   @@found
    }
    return matches;                                         @@done
}
`,
    java: `
static List<Integer> naiveSearch(String text, String pattern) {
    int n = text.length(), m = pattern.length();
    List<Integer> matches = new ArrayList<>();
    for (int s = 0; s <= n - m; s++) {                                      @@shift
        int j = 0;
        while (j < m && text.charAt(s + j) == pattern.charAt(j)) j++;       @@compare
        if (j == m) matches.add(s);                                         @@found
    }
    return matches;                                                         @@done
}
`,
    javascript: `
function naiveSearch(text, pattern) {
  const n = text.length, m = pattern.length;
  const matches = [];
  for (let s = 0; s <= n - m; s++) {                        @@shift
    let j = 0;
    while (j < m && text[s + j] === pattern[j]) j++;        @@compare
    if (j === m) matches.push(s);                           @@found
  }
  return matches;                                           @@done
}
`,
  },
  run(text, pattern) {
    const t = new StringTracer(text, pattern);
    const n = text.length;
    const m = pattern.length;
    for (let s = 0; s <= n - m; s++) {
      t.slide(s);
      t.step("shift", s === 0 ? "Line the pattern up with the start of the text." : `Move the pattern one place right, to text index ${s}.`, { vars: { s } });
      let j = 0;
      while (j < m) {
        const same = t.compare(j);
        t.step(
          "compare",
          same
            ? `T[${s + j}] = P[${j}] = '${pattern[j]}', so ${j + 1} of ${m} characters match.`
            : `T[${s + j}] = '${text[s + j]}' differs from P[${j}] = '${pattern[j]}', so this alignment fails.`,
          { vars: { s, j } },
        );
        if (!same) break;
        j++;
      }
      if (j === m) {
        t.matches.push(s);
        t.step("found", `All ${m} characters match, so the pattern occurs at index ${s}.`, { vars: { s } });
      }
    }
    t.finish("done", `Tried all ${n - m + 1} alignments with ${t.compares} character comparisons and found ${t.matches.length} match(es).`);
    return t.frames;
  },
};
