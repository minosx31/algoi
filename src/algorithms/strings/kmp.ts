import { StringTracer } from "../../core/trace";
import type { StringAlgorithm } from "../../core/types";

export const kmp: StringAlgorithm = {
  id: "kmp",
  name: "Knuth–Morris–Pratt",
  kind: "string",
  topic: "strings",
  about: {
    summary:
      "Precomputes the failure function π, the longest proper border of every pattern prefix, then scans the text once and on a mismatch slides the pattern by the matched length minus π instead of by one.",
    invariants: [
      "π[k] is the length of the longest proper prefix of P[0..k] that is also a suffix of it.",
      "While scanning, the first q pattern characters equal the q text characters just before T[i].",
      "The text index never moves backwards, and each comparison either advances it or shrinks q, so the search makes at most 2n comparisons.",
    ],
    useCases: [
      "Searching a stream you cannot rewind, such as network packets or a log being tailed.",
      "Patterns with repeated structure, such as DNA motifs, where naive search rescans the same characters.",
      "The prefix function alone finds a string's shortest period and all of its borders.",
    ],
  },
  complexity: { best: "O(n + m)", average: "O(n + m)", worst: "O(n + m)", space: "O(m)" },
  code: {
    pseudo: `
procedure kmpSearch(T, P)
  π[0] ← 0; k ← 0                                      @@build
  for i ← 1 to m − 1 do
    while k > 0 and P[i] ≠ P[k] do k ← π[k − 1]        @@build-fallback
    if P[i] = P[k] then k ← k + 1                      @@build-compare
    π[i] ← k                                           @@build-set
  matches ← empty list; q ← 0
  for i ← 0 to n − 1 do
    while q > 0 and T[i] ≠ P[q] do q ← π[q − 1]        @@shift
    if T[i] = P[q] then q ← q + 1                      @@compare
    if q = m then                                      @@found
      append i − m + 1 to matches; q ← π[q − 1]        @@found
  return matches                                       @@done
`,
    python: `
def kmp_search(text, pattern):
    m = len(pattern)
    pi, k = [0] * m, 0                              @@build
    for i in range(1, m):
        while k > 0 and pattern[i] != pattern[k]:   @@build-fallback
            k = pi[k - 1]                           @@build-fallback
        if pattern[i] == pattern[k]:                @@build-compare
            k += 1
        pi[i] = k                                   @@build-set
    matches, q = [], 0
    for i, c in enumerate(text):
        while q > 0 and c != pattern[q]:            @@shift
            q = pi[q - 1]                           @@shift
        if c == pattern[q]:                         @@compare
            q += 1
        if q == m:                                  @@found
            matches.append(i - m + 1)               @@found
            q = pi[q - 1]                           @@found
    return matches                                  @@done
`,
    cpp: `
std::vector<int> kmpSearch(const std::string& text, const std::string& pattern) {
    int n = text.size(), m = pattern.size();
    std::vector<int> pi(m, 0), matches;                     @@build
    for (int i = 1, k = 0; i < m; i++) {
        while (k > 0 && pattern[i] != pattern[k]) k = pi[k - 1];   @@build-fallback
        if (pattern[i] == pattern[k]) k++;                  @@build-compare
        pi[i] = k;                                          @@build-set
    }
    for (int i = 0, q = 0; i < n; i++) {
        while (q > 0 && text[i] != pattern[q]) q = pi[q - 1];      @@shift
        if (text[i] == pattern[q]) q++;                     @@compare
        if (q == m) {                                       @@found
            matches.push_back(i - m + 1);                   @@found
            q = pi[q - 1];                                  @@found
        }
    }
    return matches;                                         @@done
}
`,
    java: `
static List<Integer> kmpSearch(String text, String pattern) {
    int n = text.length(), m = pattern.length();
    int[] pi = new int[m];                                  @@build
    for (int i = 1, k = 0; i < m; i++) {
        while (k > 0 && pattern.charAt(i) != pattern.charAt(k)) k = pi[k - 1];   @@build-fallback
        if (pattern.charAt(i) == pattern.charAt(k)) k++;    @@build-compare
        pi[i] = k;                                          @@build-set
    }
    List<Integer> matches = new ArrayList<>();
    for (int i = 0, q = 0; i < n; i++) {
        while (q > 0 && text.charAt(i) != pattern.charAt(q)) q = pi[q - 1];      @@shift
        if (text.charAt(i) == pattern.charAt(q)) q++;       @@compare
        if (q == m) {                                       @@found
            matches.add(i - m + 1);                         @@found
            q = pi[q - 1];                                  @@found
        }
    }
    return matches;                                         @@done
}
`,
    javascript: `
function kmpSearch(text, pattern) {
  const n = text.length, m = pattern.length;
  const pi = new Array(m).fill(0);                          @@build
  for (let i = 1, k = 0; i < m; i++) {
    while (k > 0 && pattern[i] !== pattern[k]) k = pi[k - 1];      @@build-fallback
    if (pattern[i] === pattern[k]) k++;                     @@build-compare
    pi[i] = k;                                              @@build-set
  }
  const matches = [];
  for (let i = 0, q = 0; i < n; i++) {
    while (q > 0 && text[i] !== pattern[q]) q = pi[q - 1];         @@shift
    if (text[i] === pattern[q]) q++;                        @@compare
    if (q === m) {                                          @@found
      matches.push(i - m + 1);                              @@found
      q = pi[q - 1];                                        @@found
    }
  }
  return matches;                                           @@done
}
`,
  },
  run(text, pattern) {
    const t = new StringTracer(text, pattern);
    const n = text.length;
    const m = pattern.length;
    const pi: (number | null)[] = Array(m).fill(null);
    pi[0] = 0;
    t.aux = { title: "π", under: "pattern", values: pi, marks: {} };
    t.phase = "prepare";
    t.step("build", "π[0] = 0, because a single character has no proper border.", { active: 0 });

    const same = (i: number, k: number) => {
      t.compares++;
      const result = pattern[i] === pattern[k] ? "match" : "mismatch";
      t.marks = { [i]: result, [k]: result };
      return result === "match";
    };
    let k = 0;
    for (let i = 1; i < m; i++) {
      let grew = same(i, k);
      while (k > 0 && !grew) {
        t.step("build-fallback", `P[${i}] = '${pattern[i]}' differs from P[${k}] = '${pattern[k]}', so fall back to k = π[${k - 1}] = ${pi[k - 1]}.`, { vars: { i, k }, active: k - 1 });
        k = pi[k - 1]!;
        grew = same(i, k);
      }
      t.step(
        "build-compare",
        grew ? `P[${i}] = P[${k}] = '${pattern[i]}', so the border grows to ${k + 1}.` : `P[${i}] = '${pattern[i]}' differs from P[0] = '${pattern[0]}', so no border ends here.`,
        { vars: { i, k } },
      );
      if (grew) k++;
      pi[i] = k;
      t.marks = {};
      t.step("build-set", `π[${i}] = ${k}: the longest prefix of "${pattern.slice(0, i + 1)}" that is also its suffix has length ${k}.`, { vars: { i, k }, active: i });
    }

    let q = 0;
    t.slide(0);
    for (let i = 0; i < n; i++) {
      let matched = t.compare(q);
      while (q > 0 && !matched) {
        t.step("shift", `T[${i}] = '${text[i]}' differs from P[${q}] = '${pattern[q]}' after ${q} matching characters.`, { vars: { i, q } });
        const was = q;
        q = pi[q - 1]!;
        t.slide(i - q, q);
        t.step("shift", `π[${was - 1}] = ${q}, so slide the pattern ${was} − ${q} = ${was - q} place(s) and keep ${q} known character(s).`, { vars: { i, q }, active: was - 1 });
        matched = t.compare(q);
      }
      if (matched) {
        q++;
        t.step("compare", `T[${i}] = P[${q - 1}] = '${text[i]}', so ${q} of ${m} characters match.`, { vars: { i, q } });
      } else {
        t.step("compare", `T[${i}] = '${text[i]}' differs from P[0] = '${pattern[0]}', so slide the pattern one place.`, { vars: { i, q } });
        if (i + 1 < n) t.slide(i + 1);
      }
      if (q === m) {
        t.matches.push(i - m + 1);
        t.step("found", `All ${m} characters match, so the pattern occurs at index ${i - m + 1}.`, { vars: { i, q } });
        q = pi[m - 1]!;
        if (i + 1 < n) {
          t.slide(i + 1 - q, q);
          t.step("found", `π[${m - 1}] = ${q}, so slide the pattern ${m} − ${q} = ${m - q} place(s) and keep ${q} known character(s).`, { vars: { i, q }, active: m - 1 });
        }
      }
    }
    t.finish("done", `Read each of the ${n} text characters once, with ${t.compares} comparisons in all, and found ${t.matches.length} match(es).`);
    return t.frames;
  },
};
