import { OpsTracer } from "../../core/trace";
import type { OpsMark, OpsAlgorithm, OpsRow } from "../../core/types";

type HashOp = { name: "insert" | "find" | "delete"; key: number };

const M = 11;
const TOMB = "†";
const pick = (n: number) => Math.floor(Math.random() * n);

export const hashTable: OpsAlgorithm<HashOp> = {
  id: "hash-table",
  name: "Hash Table (Linear Probing)",
  kind: "ops",
  topic: "systems",
  about: {
    summary:
      "Stores keys in one array: a key goes to slot key mod m, and on a collision it probes the next slot, then the next, until it finds a free one. A delete leaves a tombstone so later searches keep probing past it.",
    invariants: [
      "Every stored key sits at its home slot or after it, with no empty slot between home and key, so a search may stop at the first empty slot.",
      "A delete writes a tombstone, not an empty slot: emptying it would cut the probe chain and hide the keys stored after it.",
      "Insert may reuse a tombstone, but only after a full search proves the key is not already stored further along.",
      "Tombstones and live keys both fill slots, so a probe can cross the whole table: real tables track their load factor and rehash into a bigger array, while this fixed one stops after m probes and reports a full table.",
    ],
    useCases: [
      "Open addressing keeps a table in one contiguous array, which is cache friendly: Python's dict and Rust's HashMap both use it.",
      "In-memory indexes and symbol tables in compilers and interpreters.",
      "Deduplicating IDs in a stream without allocating a node per key.",
    ],
  },
  complexity: { best: "O(1)", average: "O(1)", worst: "O(n)", space: "O(m)" },
  code: {
    pseudo: `
procedure Find(key)
  i ← key mod m                                   @@hash
  repeat m times                                  @@probe
    if slots[i] = empty then return -1            @@empty
    if slots[i] = key then return i               @@match
    i ← (i + 1) mod m                             @@probe
  return -1                                       @@empty

procedure Insert(key)
  if Find(key) ≠ -1 then return                   @@dupe
  i ← key mod m                                   @@start
  for n ← 1 to m while slots[i] holds a key do    @@scan
    i ← (i + 1) mod m                             @@scan
  if slots[i] holds a key then return             @@full
  slots[i] ← key                                  @@place

procedure Delete(key)
  i ← Find(key)
  if i ≠ -1 then slots[i] ← tombstone             @@bury
`,
    python: `
TOMB = "†"  # a deleted slot: find probes past it, insert may reuse it

class HashTable:
    def __init__(self, m):
        self.slots = [None] * m

    def find(self, key):
        i = key % len(self.slots)                       @@hash
        for _ in self.slots:                            @@probe
            if self.slots[i] is None: return -1         @@empty
            if self.slots[i] == key: return i           @@match
            i = (i + 1) % len(self.slots)               @@probe
        return -1                                       @@empty

    def insert(self, key):
        if self.find(key) != -1: return                 @@dupe
        i = key % len(self.slots)                       @@start
        for _ in self.slots:                            @@scan
            if self.slots[i] in (None, TOMB): break     @@scan
            i = (i + 1) % len(self.slots)               @@scan
        if self.slots[i] not in (None, TOMB): return    @@full
        self.slots[i] = key                             @@place

    def delete(self, key):
        i = self.find(key)
        if i != -1: self.slots[i] = TOMB                @@bury
`,
    cpp: `
constexpr int EMPTY = -1, TOMB = -2;  // keys are non-negative

class HashTable {
    std::vector<int> slots;
public:
    explicit HashTable(int m) : slots(m, EMPTY) {}
    int find(int key) const {
        int i = key % slots.size();                     @@hash
        for (size_t n = 0; n < slots.size() && slots[i] != EMPTY; n++) {   @@probe
            if (slots[i] == key) return i;              @@match
            i = (i + 1) % slots.size();                 @@probe
        }
        return -1;                                      @@empty
    }
    void insert(int key) {
        if (find(key) != -1) return;                    @@dupe
        int i = key % slots.size();                     @@start
        for (size_t n = 0; n < slots.size() && slots[i] >= 0; n++)   @@scan
            i = (i + 1) % slots.size();                 @@scan
        if (slots[i] >= 0) return;                      @@full
        slots[i] = key;                                 @@place
    }
    void erase(int key) {
        int i = find(key);
        if (i != -1) slots[i] = TOMB;                   @@bury
    }
};
`,
    java: `
class HashTable {
    static final int EMPTY = -1, TOMB = -2;  // keys are non-negative
    final int[] slots;
    HashTable(int m) { slots = new int[m]; Arrays.fill(slots, EMPTY); }

    int find(int key) {
        int i = key % slots.length;                     @@hash
        for (int n = 0; n < slots.length && slots[i] != EMPTY; n++) {   @@probe
            if (slots[i] == key) return i;              @@match
            i = (i + 1) % slots.length;                 @@probe
        }
        return -1;                                      @@empty
    }
    void insert(int key) {
        if (find(key) != -1) return;                    @@dupe
        int i = key % slots.length;                     @@start
        for (int n = 0; n < slots.length && slots[i] >= 0; n++)   @@scan
            i = (i + 1) % slots.length;                 @@scan
        if (slots[i] >= 0) return;                      @@full
        slots[i] = key;                                 @@place
    }
    void delete(int key) {
        int i = find(key);
        if (i != -1) slots[i] = TOMB;                   @@bury
    }
}
`,
    javascript: `
const TOMB = Symbol("tombstone"); // a deleted slot: find probes past it, insert may reuse it

class HashTable {
  constructor(m) { this.slots = new Array(m).fill(null); }
  find(key) {
    let i = key % this.slots.length;                    @@hash
    for (let n = 0; n < this.slots.length && this.slots[i] !== null; n++) {   @@probe
      if (this.slots[i] === key) return i;              @@match
      i = (i + 1) % this.slots.length;                  @@probe
    }
    return -1;                                          @@empty
  }
  insert(key) {
    if (this.find(key) !== -1) return;                  @@dupe
    let i = key % this.slots.length;                    @@start
    for (let n = 0; n < this.slots.length && typeof this.slots[i] === "number"; n++)   @@scan
      i = (i + 1) % this.slots.length;                  @@scan
    if (typeof this.slots[i] === "number") return;      @@full
    this.slots[i] = key;                                @@place
  }
  delete(key) {
    const i = this.find(key);
    if (i !== -1) this.slots[i] = TOMB;                 @@bury
  }
}
`,
  },
  makeInput(size) {
    const home = pick(M);
    const used = new Set<number>();
    const key = (residue = pick(M)) => {
      for (;;) {
        const k = residue + M * (1 + pick(8));
        if (!used.has(k)) return used.add(k), k;
      }
    };
    const [a, b, c] = [key(home), key(home), key(home)];
    const script: HashOp[] = [
      { name: "insert", key: a },
      { name: "insert", key: b },
      { name: "insert", key: c },
      { name: "delete", key: b },
      { name: "find", key: c },
    ];
    const stored = [a, c];
    let inserts = 3;
    while (script.length < size) {
      const roll = Math.random();
      if (roll < 0.08 && stored.length > 0) {
        script.push({ name: "insert", key: stored[pick(stored.length)] });
      } else if (roll < 0.35 && inserts < M - 3) {
        const k = key();
        inserts++;
        stored.push(k);
        script.push({ name: "insert", key: k });
      } else if (roll < 0.5 && stored.length > 0) {
        script.push({ name: "delete", key: stored.splice(pick(stored.length), 1)[0] });
      } else {
        script.push({ name: "find", key: stored.length > 0 && Math.random() < 0.6 ? stored[pick(stored.length)] : key() });
      }
    }
    return script;
  },
  solve(script) {
    const slots: (number | null | typeof TOMB)[] = Array(M).fill(null);
    const find = (k: number) => {
      for (let n = 0, i = k % M; n < M && slots[i] !== null; n++, i = (i + 1) % M) if (slots[i] === k) return i;
      return -1;
    };
    return script.map(({ name, key }) => {
      const at = find(key);
      if (name === "find") return at < 0 ? "-1" : `slot ${at}`;
      if (name === "delete") {
        if (at < 0) return "not found";
        slots[at] = TOMB;
        return `slot ${at}`;
      }
      if (at >= 0) return "exists";
      let i = key % M;
      for (let n = 0; n < M && typeof slots[i] === "number"; n++) i = (i + 1) % M;
      if (typeof slots[i] === "number") return "full";
      slots[i] = key;
      return `slot ${i}`;
    });
  },
  run(script) {
    const t = new OpsTracer(script.map((op) => `${op.name}(${op.key})`));
    const slots: (number | null | typeof TOMB)[] = Array(M).fill(null);

    const rows = (marks: Partial<Record<number, OpsMark>> = {}): OpsRow[] => [
      {
        title: `Slots, home = key mod ${M}`,
        cells: slots.map((s, i) => ({
          id: `s${i}`,
          text: s === null ? "" : String(s),
          sub: String(i),
          mark: marks[i] ?? (s === null ? "empty" : s === TOMB ? "tomb" : undefined),
        })),
      },
    ];

    const every = (mark: OpsMark) => Object.fromEntries(slots.map((_, i) => [i, mark]));

    const find = (key: number, vars: Record<string, number>, last: boolean) => {
      let i = key % M;
      t.step("hash", `Home slot for ${key} is ${key} mod ${M} = ${i}.`, rows({ [i]: "probe" }), { ...vars, i });
      for (let n = 0; n < M && slots[i] !== null; n++) {
        if (slots[i] === key) {
          if (last) t.answer(`slot ${i}`);
          t.step("match", `Slot ${i} holds ${key}: found it.`, rows({ [i]: "hit" }), { ...vars, i });
          return i;
        }
        const next = (i + 1) % M;
        const why = slots[i] === TOMB ? `Slot ${i} is a tombstone, so ${key} may still lie further along: keep probing` : `Slot ${i} holds ${slots[i]}, not ${key}: probe`;
        t.step("probe", `${why} slot ${next}.`, rows({ [i]: "probe", [next]: "probe" }), { ...vars, i });
        i = next;
      }
      if (last) t.answer("-1");
      if (slots[i] !== null) {
        t.step("empty", `All ${M} slots were probed and none is empty or holds ${key}, so ${key} is not here: return -1.`, rows(every("miss")), { ...vars, i });
        return -1;
      }
      t.step("empty", `Slot ${i} is empty, and a stored ${key} would sit before the first empty slot, so ${key} is not here: return -1.`, rows({ [i]: "miss" }), { ...vars, i });
      return -1;
    };

    script.forEach(({ name, key }, n) => {
      t.at = n;
      const vars = { key };
      if (name === "find") {
        find(key, vars, true);
        return;
      }
      if (name === "delete") {
        const i = find(key, vars, false);
        if (i < 0) {
          t.answer("not found");
          t.step("bury", `${key} is not stored, so there is nothing to delete.`, rows(), vars);
          return;
        }
        slots[i] = TOMB;
        t.answer(`slot ${i}`);
        t.step("bury", `Replace ${key} in slot ${i} with a tombstone, not an empty slot, so probes for keys after it keep going.`, rows({ [i]: "new" }), { ...vars, i });
        return;
      }

      const existing = slots.indexOf(key);
      if (existing >= 0) {
        t.answer("exists");
        t.step("dupe", `find(${key}) returns slot ${existing}: ${key} is already stored, so insert does nothing.`, rows({ [existing]: "hit" }), vars);
        return;
      }
      t.step("dupe", `find(${key}) returns -1: ${key} is not stored yet, so it is safe to insert.`, rows(), vars);
      let i = key % M;
      t.step("start", `Home slot for ${key} is ${key} mod ${M} = ${i}.`, rows({ [i]: "probe" }), { ...vars, i });
      for (let n = 0; n < M && typeof slots[i] === "number"; n++) {
        const next = (i + 1) % M;
        t.step("scan", `Slot ${i} holds ${slots[i]}: try slot ${next}.`, rows({ [i]: "probe", [next]: "probe" }), { ...vars, i });
        i = next;
      }
      if (typeof slots[i] === "number") {
        t.answer("full");
        t.step("full", `All ${M} slots hold live keys, so there is no room for ${key}: drop the insert. A real table would have rehashed into a bigger array by now.`, rows(every("miss")), { ...vars, i });
        return;
      }
      const reuse = slots[i] === TOMB;
      slots[i] = key;
      t.answer(`slot ${i}`);
      t.step("place", `Slot ${i} was ${reuse ? "a tombstone, which insert may reuse" : "empty"}: store ${key} there.`, rows({ [i]: "new" }), { ...vars, i });
    });
    return t.frames;
  },
};
