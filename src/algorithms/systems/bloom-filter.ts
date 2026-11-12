import { OpsTracer } from "../../core/trace";
import type { CellMark, OpsAlgorithm, OpsRow } from "../../core/types";

type BloomOp = { name: "add" | "has"; word: string };

const M = 17;
const SEEDS = [31, 37, 41];
const WORDS = "ant ape bat bee boa cat cod cow doe dog eel elk emu ewe fly fox gnu hen jay koi owl pig rat yak".split(" ");

function hashAt(word: string, seed: number) {
  let h = 0;
  for (const ch of word) h = (h * seed + ch.charCodeAt(0)) % M;
  return h;
}

const positions = (word: string) => SEEDS.map((seed) => hashAt(word, seed));
const list = (xs: number[]) => xs.join(", ");

export const bloomFilter: OpsAlgorithm<BloomOp> = {
  id: "bloom-filter",
  name: "Bloom Filter",
  kind: "ops",
  topic: "systems",
  about: {
    summary:
      "Answers “have I seen this?” in a few bits per item: each added word sets k bits chosen by k hash functions, and a lookup that finds any of its k bits still 0 knows the word was never added.",
    invariants: [
      "A bit, once set to 1, is never cleared, so an added word always finds all of its k bits set: no false negatives.",
      "All k bits set does not prove membership, because other words may have set them: false positives happen, at a rate that grows as the bits fill.",
      "Words are never stored, so a Bloom filter cannot list or delete its members.",
    ],
    useCases: [
      "Databases such as Cassandra and RocksDB skip disk reads for keys a table cannot contain.",
      "CDNs cache a page only on its second request, using a filter of URLs seen once.",
      "Browsers and crawlers check a URL against a large blocklist or visited set in a few bytes.",
    ],
  },
  complexity: { best: "O(k)", average: "O(k)", worst: "O(k)", space: "O(m)" },
  code: {
    pseudo: `
procedure Add(word)
  for i ← 1 to k do                               @@hash
    bits[hᵢ(word)] ← 1                            @@set

procedure Has(word)
  for i ← 1 to k do                               @@hash
    if bits[hᵢ(word)] = 0 then                    @@check
      return "definitely not added"               @@absent
  return "probably added"                         @@maybe

hᵢ(word): h ← 0; for each char c: h ← (h · seedᵢ + code(c)) mod m
`,
    python: `
SEEDS = (31, 37, 41)  # one hash function per seed, k = 3

def hash_at(word, seed, m):
    h = 0
    for ch in word:
        h = (h * seed + ord(ch)) % m
    return h

class BloomFilter:
    def __init__(self, m):
        self.m, self.bits = m, [0] * m

    def add(self, word):
        for seed in SEEDS:                                  @@hash
            self.bits[hash_at(word, seed, self.m)] = 1      @@set

    def has(self, word):
        for seed in SEEDS:                                  @@hash
            if self.bits[hash_at(word, seed, self.m)] == 0: @@check
                return False                                @@absent
        return True                                         @@maybe
`,
    cpp: `
class BloomFilter {
    static constexpr int SEEDS[] = {31, 37, 41};  // k = 3 hash functions
    std::vector<bool> bits;
    int hashAt(const std::string& word, int seed) const {
        int h = 0;
        for (char ch : word) h = (h * seed + ch) % (int)bits.size();
        return h;
    }
public:
    explicit BloomFilter(int m) : bits(m) {}
    void add(const std::string& word) {
        for (int seed : SEEDS)                          @@hash
            bits[hashAt(word, seed)] = true;            @@set
    }
    bool has(const std::string& word) const {
        for (int seed : SEEDS)                          @@hash
            if (!bits[hashAt(word, seed)])              @@check
                return false;                           @@absent
        return true;                                    @@maybe
    }
};
`,
    java: `
class BloomFilter {
    static final int[] SEEDS = {31, 37, 41};  // k = 3 hash functions
    final boolean[] bits;
    BloomFilter(int m) { bits = new boolean[m]; }

    int hashAt(String word, int seed) {
        int h = 0;
        for (char ch : word.toCharArray()) h = (h * seed + ch) % bits.length;
        return h;
    }
    void add(String word) {
        for (int seed : SEEDS)                          @@hash
            bits[hashAt(word, seed)] = true;            @@set
    }
    boolean has(String word) {
        for (int seed : SEEDS)                          @@hash
            if (!bits[hashAt(word, seed)])              @@check
                return false;                           @@absent
        return true;                                    @@maybe
    }
}
`,
    javascript: `
const SEEDS = [31, 37, 41]; // k = 3 hash functions

function hashAt(word, seed, m) {
  let h = 0;
  for (const ch of word) h = (h * seed + ch.charCodeAt(0)) % m;
  return h;
}

class BloomFilter {
  constructor(m) { this.bits = new Array(m).fill(false); }
  add(word) {
    for (const seed of SEEDS)                                   @@hash
      this.bits[hashAt(word, seed, this.bits.length)] = true;   @@set
  }
  has(word) {
    for (const seed of SEEDS)                                   @@hash
      if (!this.bits[hashAt(word, seed, this.bits.length)])     @@check
        return false;                                           @@absent
    return true;                                                @@maybe
  }
}
`,
  },
  makeInput(size) {
    for (;;) {
      const pool = [...WORDS].sort(() => Math.random() - 0.5);
      const added = pool.slice(0, 4);
      const bits = new Set(added.flatMap(positions));
      const absent = pool.slice(4);
      const fp = absent.find((w) => positions(w).every((i) => bits.has(i)));
      const no = absent.find((w) => !positions(w).every((i) => bits.has(i)));
      if (!fp || !no) continue;
      const [a, b, c, d] = added;
      const script: BloomOp[] = [
        { name: "add", word: a },
        { name: "add", word: b },
        { name: "has", word: a },
        { name: "add", word: c },
        { name: "add", word: d },
        { name: "has", word: no },
        { name: "has", word: fp },
      ];
      const fresh = absent.filter((w) => w !== fp && w !== no);
      while (script.length < size) {
        if (fresh.length > 0 && Math.random() < 0.3) script.push({ name: "add", word: fresh.pop()! });
        else script.push({ name: "has", word: pool[Math.floor(Math.random() * pool.length)] });
      }
      return script;
    }
  },
  solve(script) {
    const bits = new Set<number>();
    return script.map(({ name, word }) => {
      const at = positions(word);
      if (name === "add") {
        at.forEach((i) => bits.add(i));
        return "ok";
      }
      return at.every((i) => bits.has(i)) ? "maybe" : "no";
    });
  },
  run(script) {
    const t = new OpsTracer(script.map((op) => `${op.name}(${op.word})`));
    const bits: (string | undefined)[] = Array(M).fill(undefined);
    const added: string[] = [];

    const rows = (marks: Partial<Record<number, CellMark>> = {}, words: Partial<Record<string, CellMark>> = {}): OpsRow[] => [
      {
        title: `Bits, m = ${M}`,
        cells: bits.map((setBy, i) => ({ id: `b${i}`, text: setBy ? "1" : "0", sub: String(i), mark: marks[i] })),
      },
      { title: "Added so far (not stored, shown for tracing)", cells: added.map((w) => ({ id: w, text: w, mark: words[w] })) },
    ];
    const only = (at: number[], mark: CellMark) => Object.fromEntries(at.map((i) => [i, mark]));

    script.forEach(({ name, word }, i) => {
      t.at = i;
      const at = positions(word);
      t.step("hash", `${name}(${word}): hash ${word} with ${SEEDS.length} functions to bits ${list(at)}.`, rows(only(at, "probe")), { word, bits: list(at) });

      if (name === "add") {
        for (const p of at) bits[p] ??= word;
        if (!added.includes(word)) added.push(word);
        t.answer("ok");
        t.step("set", `Set bits ${list(at)} to 1, and they stay 1 for good.`, rows(only(at, "new"), { [word]: "new" }), { word, bits: list(at) });
        return;
      }

      for (const [k, p] of at.entries()) {
        const checked = only(at.slice(0, k + 1), "hit");
        if (!bits[p]) {
          t.answer("no");
          t.step("absent", `Bit ${p} is 0, so ${word} was never added: return false, with no chance of error.`, rows({ ...checked, [p]: "miss" }), { word, bit: p });
          return;
        }
        t.step("check", `Bit ${p} is 1, so ${word} might be present: check the next bit.`, rows(checked), { word, bit: p });
      }

      t.answer("maybe");
      if (added.includes(word)) {
        t.step("maybe", `All ${at.length} bits are 1: ${word} is probably present, and here it really was added.`, rows(only(at, "hit"), { [word]: "hit" }), { word, bits: list(at) });
        return;
      }
      const setters = [...new Set(at.map((p) => bits[p]!))];
      const parts = setters.map((w) => `${w} (bit${at.filter((p) => bits[p] === w).length > 1 ? "s" : ""} ${list(at.filter((p) => bits[p] === w))})`);
      const who = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
      t.step(
        "maybe",
        `All ${at.length} bits were set by other keys, ${who}, so has(${word}) answers maybe for a word never added: a false positive.`,
        rows(only(at, "probe"), Object.fromEntries(setters.map((w) => [w, "probe"]))),
        { word, bits: list(at) },
      );
    });
    return t.frames;
  },
};
