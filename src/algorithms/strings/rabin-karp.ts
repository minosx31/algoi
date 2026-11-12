import { StringTracer } from "../../core/trace";
import type { StringAlgorithm, StringAux } from "../../core/types";

const BASE = 256;
const MOD = 7;

export const rabinKarp: StringAlgorithm = {
  id: "rabin-karp",
  name: "Rabin–Karp",
  kind: "string",
  topic: "strings",
  about: {
    summary:
      "Compares a rolling hash of each text window with the pattern's hash and checks characters only when the two hashes agree. This page hashes mod 7 so that spurious hits show up; real code uses a large prime.",
    invariants: [
      "t is the hash of the current window T[s..s+m), and rolling it to the next window costs O(1).",
      "Different hashes prove the window is not a match, so it is skipped without comparing characters.",
      "Equal hashes do not prove a match, so every hit is checked character by character.",
    ],
    useCases: [
      "Searching for many patterns at once by putting their hashes in a set.",
      "Plagiarism detection and deduplication by fingerprinting fixed-size windows.",
      "Rolling checksums that find unchanged blocks, as rsync does.",
    ],
  },
  complexity: { best: "O(n + m)", average: "O(n + m)", worst: "O(n·m)", space: "O(1)" },
  code: {
    pseudo: `
procedure rabinKarp(T, P, base, mod)
  if m > n then return an empty list
  h ← base^(m − 1) mod mod                                @@init
  p ← hash(P); t ← hash(T[0..m))                          @@init
  matches ← empty list
  for s ← 0 to n − m do
    if p = t then                                         @@hit
      if T[s..s+m) = P then                               @@verify
        append s to matches                               @@found
    if s < n − m then                                     @@roll
      t ← (base·(t − T[s]·h) + T[s + m]) mod mod          @@roll
  return matches                                          @@done
`,
    python: `
def rabin_karp(text, pattern, base=256, mod=7):
    n, m = len(text), len(pattern)
    if m > n:
        return []
    h = pow(base, m - 1, mod)                                           @@init
    p = t = 0                                                           @@init
    for i in range(m):                                                  @@init
        p = (base * p + ord(pattern[i])) % mod                          @@init
        t = (base * t + ord(text[i])) % mod                             @@init
    matches = []
    for s in range(n - m + 1):
        if p == t:                                                      @@hit
            if text[s:s + m] == pattern:                                @@verify
                matches.append(s)                                       @@found
        if s < n - m:                                                   @@roll
            t = (base * (t - ord(text[s]) * h % mod + mod) + ord(text[s + m])) % mod   @@roll
    return matches                                                      @@done
`,
    cpp: `
std::vector<int> rabinKarp(const std::string& text, const std::string& pattern,
                           int base = 256, int mod = 7) {
    int n = text.size(), m = pattern.size(), h = 1, p = 0, t = 0;
    if (m > n) return {};
    for (int i = 1; i < m; i++) h = h * base % mod;                     @@init
    for (int i = 0; i < m; i++) {                                       @@init
        p = (base * p + (unsigned char)pattern[i]) % mod;               @@init
        t = (base * t + (unsigned char)text[i]) % mod;                  @@init
    }
    std::vector<int> matches;
    for (int s = 0; s <= n - m; s++) {
        if (p == t) {                                                   @@hit
            if (text.compare(s, m, pattern) == 0)                       @@verify
                matches.push_back(s);                                   @@found
        }
        if (s < n - m)                                                  @@roll
            t = (base * (t - (unsigned char)text[s] * h % mod + mod)          @@roll
                 + (unsigned char)text[s + m]) % mod;                          @@roll
    }
    return matches;                                                     @@done
}
`,
    java: `
static List<Integer> rabinKarp(String text, String pattern, int base, int mod) {
    int n = text.length(), m = pattern.length(), h = 1, p = 0, t = 0;
    if (m > n) return new ArrayList<>();
    for (int i = 1; i < m; i++) h = h * base % mod;                     @@init
    for (int i = 0; i < m; i++) {                                       @@init
        p = (base * p + pattern.charAt(i)) % mod;                       @@init
        t = (base * t + text.charAt(i)) % mod;                          @@init
    }
    List<Integer> matches = new ArrayList<>();
    for (int s = 0; s <= n - m; s++) {
        if (p == t) {                                                   @@hit
            if (text.startsWith(pattern, s))                            @@verify
                matches.add(s);                                         @@found
        }
        if (s < n - m)                                                  @@roll
            t = (base * (t - text.charAt(s) * h % mod + mod) + text.charAt(s + m)) % mod;   @@roll
    }
    return matches;                                                     @@done
}
`,
    javascript: `
function rabinKarp(text, pattern, base = 256, mod = 7) {
  const n = text.length, m = pattern.length;
  if (m > n) return [];
  let h = 1, p = 0, t = 0;
  for (let i = 1; i < m; i++) h = (h * base) % mod;                     @@init
  for (let i = 0; i < m; i++) {                                         @@init
    p = (base * p + pattern.charCodeAt(i)) % mod;                       @@init
    t = (base * t + text.charCodeAt(i)) % mod;                          @@init
  }
  const matches = [];
  for (let s = 0; s <= n - m; s++) {
    if (p === t) {                                                      @@hit
      if (text.startsWith(pattern, s))                                  @@verify
        matches.push(s);                                                @@found
    }
    if (s < n - m)                                                    @@roll
      t = (base * (t - ((text.charCodeAt(s) * h) % mod) + mod) + text.charCodeAt(s + m)) % mod;   @@roll
  }
  return matches;                                                       @@done
}
`,
  },
  run(text, pattern) {
    const t = new StringTracer(text, pattern);
    const n = text.length;
    const m = pattern.length;
    let h = 1;
    for (let i = 1; i < m; i++) h = (h * BASE) % MOD;
    let p = 0;
    let w = 0;
    for (let i = 0; i < m; i++) {
      p = (BASE * p + pattern.charCodeAt(i)) % MOD;
      w = (BASE * w + text.charCodeAt(i)) % MOD;
    }
    const hashes: (number | null)[] = Array(n).fill(null);
    hashes[0] = w;
    const aux: StringAux = { title: "hash", under: "text", values: hashes, marks: {} };
    t.aux = aux;
    const showWindow = (s: number) => {
      t.slide(s);
      for (let j = 0; j < m; j++) t.marks[j] = "window";
    };
    showWindow(0);
    t.step("init", `Hash the pattern "${pattern}" to ${p} and the first window "${text.slice(0, m)}" to ${w}, both mod ${MOD}.`, { vars: { s: 0, p, t: w }, active: 0 });

    for (let s = 0; s <= n - m; s++) {
      const vars = { s, p, t: w };
      if (p !== w) {
        t.step("hit", `Window hash ${w} differs from pattern hash ${p}, so skip this window without comparing characters.`, { vars, active: s });
      } else {
        t.step("hit", `Window hash ${w} equals pattern hash ${p}, so check the characters.`, { vars, active: s });
        let j = 0;
        while (j < m) {
          const same = t.compare(j);
          if (!same) break;
          t.step("verify", `T[${s + j}] = P[${j}] = '${pattern[j]}'.`, { vars, active: s });
          j++;
        }
        if (j === m) {
          t.matches.push(s);
          aux.marks[s] = "match";
          t.step("found", `True match at index ${s}: the hashes agree and so do all ${m} characters.`, { vars });
        } else {
          aux.marks[s] = "mismatch";
          t.step("verify", `Spurious hit: the hashes agree but T[${s + j}] = '${text[s + j]}' differs from P[${j}] = '${pattern[j]}'.`, { vars });
        }
      }
      if (s < n - m) {
        w = (BASE * (w - ((text.charCodeAt(s) * h) % MOD) + MOD) + text.charCodeAt(s + m)) % MOD;
        hashes[s + 1] = w;
        showWindow(s + 1);
        t.step("roll", `Roll the window: drop '${text[s]}', add '${text[s + m]}', and the hash becomes ${w}.`, { vars: { s: s + 1, p, t: w }, active: s + 1 });
      }
    }
    t.finish("done", `Checked ${n - m + 1} window hashes, compared characters ${t.compares} times, and found ${t.matches.length} match(es).`);
    return t.frames;
  },
};
