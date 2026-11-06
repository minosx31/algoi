import { StringTracer } from "../../core/trace";
import type { StringAlgorithm, StringAux } from "../../core/types";

export const zFunction: StringAlgorithm = {
  id: "z-function",
  name: "Z-Function Search",
  kind: "string",
  topic: "strings",
  about: {
    summary:
      'Joins S = pattern + "$" + text and computes Z[i], the length of the longest common prefix of S and S[i..]. Every i where Z[i] equals the pattern length marks a match.',
    invariants: [
      "[l, r) is the rightmost segment found so far that equals a prefix of S (the Z-box).",
      "Inside the box, Z[i] starts at min(r − i, Z[i − l]) without comparing, because S[i..r) copies S[i − l..r − l).",
      "The separator $ occurs in neither string, so no Z value exceeds the pattern length.",
      "r never moves left, so the pass makes O(n + m) comparisons.",
    ],
    useCases: [
      "Linear-time pattern search that is short enough to write from memory in an interview.",
      "Finding every period and border of a string.",
      "String compression and distinct-substring counting problems.",
    ],
  },
  complexity: { best: "O(n + m)", average: "O(n + m)", worst: "O(n + m)", space: "O(n + m)" },
  code: {
    pseudo: `
procedure zSearch(T, P)
  S ← P + "$" + T; m ← |P|                              @@init
  Z[0..|S|) ← 0; l ← 0; r ← 0; matches ← empty list     @@init
  for i ← 1 to |S| − 1 do
    if i < r then Z[i] ← min(r − i, Z[i − l])           @@box
    while i + Z[i] < |S| and S[Z[i]] = S[i + Z[i]] do   @@extend
      Z[i] ← Z[i] + 1                                   @@extend
    if i + Z[i] > r then l ← i; r ← i + Z[i]            @@move
    if Z[i] = m then                                    @@found
      append i − m − 1 to matches                       @@found
  return matches                                        @@done
`,
    python: `
def z_search(text, pattern):
    s = pattern + "$" + text                                @@init
    n, m = len(s), len(pattern)                             @@init
    z, l, r, matches = [0] * n, 0, 0, []                    @@init
    for i in range(1, n):
        if i < r:                                           @@box
            z[i] = min(r - i, z[i - l])                     @@box
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:      @@extend
            z[i] += 1                                       @@extend
        if i + z[i] > r:                                    @@move
            l, r = i, i + z[i]                              @@move
        if z[i] == m:                                       @@found
            matches.append(i - m - 1)                       @@found
    return matches                                          @@done
`,
    cpp: `
std::vector<int> zSearch(const std::string& text, const std::string& pattern) {
    std::string s = pattern + "$" + text;                   @@init
    int n = s.size(), m = pattern.size(), l = 0, r = 0;     @@init
    std::vector<int> z(n, 0), matches;                      @@init
    for (int i = 1; i < n; i++) {
        if (i < r) z[i] = std::min(r - i, z[i - l]);        @@box
        while (i + z[i] < n && s[z[i]] == s[i + z[i]])      @@extend
            z[i]++;                                         @@extend
        if (i + z[i] > r) { l = i; r = i + z[i]; }          @@move
        if (z[i] == m) matches.push_back(i - m - 1);        @@found
    }
    return matches;                                         @@done
}
`,
    java: `
static List<Integer> zSearch(String text, String pattern) {
    String s = pattern + "$" + text;                        @@init
    int n = s.length(), m = pattern.length(), l = 0, r = 0; @@init
    int[] z = new int[n];                                   @@init
    List<Integer> matches = new ArrayList<>();
    for (int i = 1; i < n; i++) {
        if (i < r) z[i] = Math.min(r - i, z[i - l]);        @@box
        while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i]))   @@extend
            z[i]++;                                         @@extend
        if (i + z[i] > r) { l = i; r = i + z[i]; }          @@move
        if (z[i] == m) matches.add(i - m - 1);              @@found
    }
    return matches;                                         @@done
}
`,
    javascript: `
function zSearch(text, pattern) {
  const s = pattern + "$" + text;                           @@init
  const n = s.length, m = pattern.length;                   @@init
  const z = new Array(n).fill(0), matches = [];             @@init
  for (let i = 1, l = 0, r = 0; i < n; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l]);            @@box
    while (i + z[i] < n && s[z[i]] === s[i + z[i]])         @@extend
      z[i]++;                                               @@extend
    if (i + z[i] > r) { l = i; r = i + z[i]; }              @@move
    if (z[i] === m) matches.push(i - m - 1);                @@found
  }
  return matches;                                           @@done
}
`,
  },
  run(text, pattern) {
    const m = pattern.length;
    const t = new StringTracer(text, pattern, pattern + "$");
    const s = t.row;
    const n = s.length;
    const z: (number | null)[] = Array(n).fill(null);
    const aux: StringAux = { title: "Z", under: "text", values: z, marks: {} };
    t.aux = aux;
    t.phase = "prepare";
    t.step("init", `Join pattern, separator, and text into S = "${s}" and find Z[i] for every i ≥ 1.`, { vars: { l: 0, r: 0 } });

    let l = 0;
    let r = 0;
    for (let i = 1; i < n; i++) {
      let k = 0;
      if (i < r) {
        k = Math.min(r - i, z[i - l]!);
        t.slide(i, k);
        z[i] = k;
        t.step("box", `i = ${i} is inside the Z-box [${l}, ${r}), so Z[${i}] starts at min(${r - i}, Z[${i - l}] = ${z[i - l]}) = ${k} without comparing.`, { vars: { i, l, r }, active: i - l });
      } else {
        t.slide(i);
        z[i] = 0;
      }
      while (i + k < n) {
        if (k === m) {
          t.compares++;
          t.step("extend", `S[${m}] is the separator $, which never equals a text character, so Z[${i}] stops at ${m}.`, { vars: { i, l, r }, active: i });
          break;
        }
        const same = t.compare(k);
        if (same) z[i] = ++k;
        t.step(
          "extend",
          same ? `S[${i + k - 1}] = S[${k - 1}] = '${s[k - 1]}', so Z[${i}] grows to ${k}.` : `S[${i + k}] = '${s[i + k]}' differs from S[${k}] = '${s[k]}', so Z[${i}] = ${k}.`,
          { vars: { i, l, r }, active: i },
        );
        if (!same) break;
      }
      if (i + k > r) {
        l = i;
        r = i + k;
        if (k > 0) t.step("move", `The match reaches past the old box, so the Z-box becomes [${l}, ${r}).`, { vars: { i, l, r }, active: i });
      }
      if (k === m) {
        t.matches.push(i - m - 1);
        aux.marks[i] = "match";
        t.step("found", `Z[${i}] = ${m}, the pattern length, so the pattern occurs at text index ${i} − ${m + 1} = ${i - m - 1}.`, { vars: { i, l, r } });
      }
    }
    t.finish("done", `Computed Z for all ${n - 1} positions of S with ${t.compares} comparisons and found ${t.matches.length} match(es).`);
    return t.frames;
  },
};
