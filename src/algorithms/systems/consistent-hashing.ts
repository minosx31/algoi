import { OpsTracer } from "../../core/trace";
import type { OpsMark, OpsAlgorithm, OpsRow } from "../../core/types";

type RingOp = { name: "addServer"; server: string } | { name: "put" | "get"; key: string };

const SERVERS = ["A", "B", "C", "D"];
const VNODES = 2;
const WORDS = "ant ape bat bee boa bug cat cod cow doe dog eel elk emu ewe fly fox gnu hen jay koi owl pig rat yak".split(" ");
const pick = (n: number) => Math.floor(Math.random() * n);

function ringHash(s: string) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h % 360;
}

type Vnode = { name: string; angle: number; server: string };
const vnodesOf = (server: string): Vnode[] =>
  Array.from({ length: VNODES }, (_, i) => ({ name: `${server}-${i + 1}`, angle: ringHash(`${server}-${i + 1}`), server }));

function ownerOf(vnodes: Vnode[], key: string) {
  const a = ringHash(key);
  let best = vnodes[0];
  for (const v of vnodes) if ((v.angle - a + 360) % 360 < (best.angle - a + 360) % 360) best = v;
  return best.server;
}

const label = (op: RingOp) => (op.name === "addServer" ? `addServer(${op.server})` : `${op.name}(${op.key})`);

export const consistentHashing: OpsAlgorithm<RingOp> = {
  id: "consistent-hashing",
  name: "Consistent Hashing",
  kind: "ops",
  topic: "systems",
  about: {
    summary:
      "Spreads keys over servers by hashing both onto a ring: a key belongs to the first server point clockwise from it, so adding a server moves only the keys in the arcs it takes over.",
    invariants: [
      "Each virtual node owns the arc from the previous node, exclusive, to itself, inclusive, so every point on the ring has exactly one owner.",
      "Adding a server moves only keys that land in its new arcs, about K / N of K keys over N servers, instead of almost all of them as hash mod N would.",
      "Several virtual nodes per server split its share into many small arcs, which evens out the load.",
    ],
    useCases: [
      "Partitioning in Cassandra, DynamoDB, and Riak.",
      "Memcached and Redis client libraries choose a cache server per key this way.",
      "Load balancers and CDNs pin a user or object to a backend that survives pool changes.",
    ],
  },
  complexity: { best: "O(log V)", average: "O(log V)", worst: "O(log V)", space: "O(V + K)" },
  code: {
    pseudo: `
procedure AddServer(s)
  for i ← 1 to vnodes do                                @@vnodes
    put virtual node s-i at angle hash(s-i) mod 360     @@vnodes
  return the keys whose Lookup is now s                 @@move

procedure Put(key)
  keys ← keys ∪ {key}
  return Lookup(key)

procedure Lookup(key)
  a ← hash(key) mod 360                                 @@hash
  v ← first virtual node clockwise from a, wrapping     @@walk
  return server(v)                                      @@walk
`,
    python: `
import bisect

def ring_hash(s):  # FNV-1a, folded onto 0..359
    h = 2166136261
    for ch in s:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return h % 360

class Ring:
    def __init__(self):
        self.points, self.owner, self.keys = [], {}, set()  # sorted angles; angle -> server
    def add_server(self, server, vnodes=2):
        for i in range(1, vnodes + 1):                             @@vnodes
            a = ring_hash(f"{server}-{i}")                         @@vnodes
            bisect.insort(self.points, a)                          @@vnodes
            self.owner[a] = server                                 @@vnodes
        return [k for k in self.keys if self.lookup(k) == server]  @@move
    def put(self, key):
        self.keys.add(key)
        return self.lookup(key)
    def lookup(self, key):
        a = ring_hash(key)                                         @@hash
        i = bisect.bisect_left(self.points, a) % len(self.points)  @@walk
        return self.owner[self.points[i]]                          @@walk
`,
    cpp: `
uint32_t ringHash(const std::string& s) {  // FNV-1a, folded onto 0..359
    uint32_t h = 2166136261u;
    for (unsigned char ch : s) h = (h ^ ch) * 16777619u;
    return h % 360;
}

class Ring {
    std::map<uint32_t, std::string> ring;  // angle -> server
    std::set<std::string> keys;
public:
    std::vector<std::string> addServer(const std::string& server, int vnodes) {
        for (int i = 1; i <= vnodes; i++)                               @@vnodes
            ring[ringHash(server + "-" + std::to_string(i))] = server;  @@vnodes
        std::vector<std::string> moved;                                 @@move
        for (auto& k : keys) if (lookup(k) == server) moved.push_back(k);   @@move
        return moved;                                                   @@move
    }
    std::string put(const std::string& key) { keys.insert(key); return lookup(key); }
    std::string lookup(const std::string& key) const {
        uint32_t a = ringHash(key);                                     @@hash
        auto it = ring.lower_bound(a);                                  @@walk
        return (it != ring.end() ? it : ring.begin())->second;          @@walk
    }
};
`,
    java: `
class Ring {
    final TreeMap<Integer, String> ring = new TreeMap<>();  // angle -> server
    final Set<String> keys = new HashSet<>();

    static int ringHash(String s) {  // FNV-1a, folded onto 0..359
        int h = 0x811c9dc5;
        for (char ch : s.toCharArray()) h = (h ^ ch) * 16777619;
        return Integer.remainderUnsigned(h, 360);
    }
    List<String> addServer(String server, int vnodes) {
        for (int i = 1; i <= vnodes; i++)                           @@vnodes
            ring.put(ringHash(server + "-" + i), server);           @@vnodes
        List<String> moved = new ArrayList<>();                     @@move
        for (String k : keys) if (lookup(k).equals(server)) moved.add(k);   @@move
        return moved;                                               @@move
    }
    String put(String key) { keys.add(key); return lookup(key); }
    String lookup(String key) {
        int a = ringHash(key);                                      @@hash
        Map.Entry<Integer, String> e = ring.ceilingEntry(a);        @@walk
        return (e != null ? e : ring.firstEntry()).getValue();      @@walk
    }
}
`,
    javascript: `
function ringHash(s) { // FNV-1a, folded onto 0..359
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h % 360;
}

class Ring {
  constructor() { this.points = []; this.owner = new Map(); this.keys = new Set(); } // sorted angles
  addServer(server, vnodes = 2) {
    for (let i = 1; i <= vnodes; i++) {                         @@vnodes
      const a = ringHash(\`\${server}-\${i}\`);                    @@vnodes
      this.owner.set(a, server);                                @@vnodes
      this.points.push(a);                                      @@vnodes
    }
    this.points.sort((x, y) => x - y);                          @@vnodes
    return [...this.keys].filter((k) => this.lookup(k) === server);   @@move
  }
  put(key) { this.keys.add(key); return this.lookup(key); }
  lookup(key) {
    const a = ringHash(key);                                    @@hash
    const p = this.points.find((x) => x >= a) ?? this.points[0];   @@walk
    return this.owner.get(p);                                   @@walk
  }
}
`,
  },
  makeInput(size) {
    const all = SERVERS.flatMap(vnodesOf);
    const pool = [...WORDS].sort(() => Math.random() - 0.5);
    const mover = pool.find((w) => ownerOf(all, w) === "D")!;
    const placed = [mover, ...pool.filter((w) => w !== mover).slice(0, 3)].sort(() => Math.random() - 0.5);
    const fresh = pool.filter((w) => !placed.includes(w));
    const script: RingOp[] = [
      ...SERVERS.slice(0, 3).map((server) => ({ name: "addServer" as const, server })),
      ...placed.map((key) => ({ name: "put" as const, key })),
      { name: "get", key: placed[pick(placed.length)] },
      { name: "addServer", server: "D" },
      { name: "get", key: mover },
    ];
    while (script.length < size) {
      if (fresh.length > 0 && Math.random() < 0.4) {
        const key = fresh.pop()!;
        placed.push(key);
        script.push({ name: "put", key });
      } else script.push({ name: "get", key: placed[pick(placed.length)] });
    }
    return script;
  },
  solve(script) {
    const vnodes: Vnode[] = [];
    const keys: string[] = [];
    return script.map((op) => {
      if (op.name === "addServer") {
        const before = keys.map((k) => ownerOf(vnodes, k));
        vnodes.push(...vnodesOf(op.server));
        return `moved ${keys.filter((k, i) => ownerOf(vnodes, k) !== before[i]).length}`;
      }
      if (op.name === "put" && !keys.includes(op.key)) keys.push(op.key);
      return ownerOf(vnodes, op.key);
    });
  },
  run(script) {
    const t = new OpsTracer(script.map(label));
    const ring: Vnode[] = [];
    const owners = new Map<string, Vnode>();
    const tone = (server: string) => SERVERS.indexOf(server);

    const rows = (marks: Partial<Record<string, OpsMark>> = {}): OpsRow[] => [
      {
        title: "Hash ring, 0° at the top, clockwise",
        ring: {
          nodes: ring.map((v) => ({ id: v.name, text: v.name, angle: v.angle, tone: tone(v.server), mark: marks[v.name] })),
          keys: [...owners].map(([key, v]) => ({ id: key, text: key, angle: ringHash(key), tone: tone(v.server), mark: marks[key] })),
        },
      },
    ];
    const walk = (key: string) => {
      const a = ringHash(key);
      return ring.find((v) => v.angle >= a) ?? ring[0];
    };

    script.forEach((op, i) => {
      t.at = i;
      if (op.name === "addServer") {
        const added = vnodesOf(op.server);
        ring.push(...added);
        ring.sort((x, y) => x.angle - y.angle);
        const where = added.map((v) => `${v.name} → ${v.angle}°`).join(" and ");
        const fresh = Object.fromEntries(added.map((v) => [v.name, "new" as const]));
        const vars = { server: op.server, nodes: ring.length };
        if (owners.size === 0) {
          t.answer("moved 0");
          t.step("vnodes", `addServer(${op.server}): hash ${where} and place both virtual nodes on the ring, where no keys are stored yet.`, rows(fresh), vars);
          return;
        }
        t.step("vnodes", `addServer(${op.server}): hash ${where}, and each new node takes over the arc back to the node before it.`, rows(fresh), vars);
        const moved: { key: string; from: string }[] = [];
        for (const [key, was] of owners) {
          const now = walk(key);
          if (now.server !== was.server) moved.push({ key, from: was.server });
          owners.set(key, now);
        }
        t.answer(`moved ${moved.length}`);
        const stay = owners.size - moved.length;
        const list = moved.map(({ key, from }) => `${key} (${ringHash(key)}°) from ${from}`).join(", ");
        const note =
          moved.length === 0
            ? `No stored key lies in ${op.server}'s new arcs, so nothing moves.`
            : `Only keys in ${op.server}'s new arcs change owner, so ${list} move${moved.length === 1 ? "s" : ""} to ${op.server} and the other ${stay} key${stay === 1 ? "" : "s"} stay put.`;
        const movedMarks = Object.fromEntries(moved.map(({ key }) => [key, "moved" as const]));
        t.step("move", note, rows({ ...fresh, ...movedMarks }), { ...vars, moved: moved.length });
        return;
      }

      const { key } = op;
      const a = ringHash(key);
      if (op.name === "put" && !owners.has(key)) owners.set(key, walk(key));
      t.step("hash", `${op.name}(${key}): hash(${key}) mod 360 = ${a}°.`, rows({ [key]: "probe" }), { key, angle: a });
      const v = walk(key);
      const wraps = v.angle < a;
      const how = wraps ? `No node lies after ${a}°, so wrap past 0° to the first node, ${v.name} at ${v.angle}°` : `Walk clockwise from ${a}° to the first virtual node, ${v.name} at ${v.angle}°`;
      t.answer(v.server);
      t.step("walk", `${how}: ${key} belongs to server ${v.server}.`, rows({ [key]: "probe", [v.name]: "hit" }), { key, angle: a, node: v.name });
    });
    return t.frames;
  },
};
