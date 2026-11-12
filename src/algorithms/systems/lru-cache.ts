import { OpsTracer } from "../../core/trace";
import type { Cell, CellMark, OpsAlgorithm, OpsRow } from "../../core/types";

type LruOp = { name: "get"; key: number } | { name: "put"; key: number; value: number };

const CAP = 3;
const pick = (n: number) => Math.floor(Math.random() * n);
const label = (op: LruOp) => (op.name === "get" ? `get(${op.key})` : `put(${op.key}, ${op.value})`);

export const lruCache: OpsAlgorithm<LruOp> = {
  id: "lru-cache",
  name: "LRU Cache",
  kind: "ops",
  topic: "systems",
  about: {
    summary:
      "Keeps the most recently used entries: a hash map finds a key's node in O(1), and a doubly linked list keeps nodes in recency order so the least recent one sits at the back, ready to evict.",
    invariants: [
      "The list runs from most to least recently used, and the map holds exactly the keys in the list.",
      "Every get hit and every put moves its node to the front, so the back node is always the least recently used.",
      "The cache never holds more than its capacity: a new key arriving at a full cache evicts the back node first.",
    ],
    useCases: [
      "Page caches in databases and operating systems.",
      "CDN and reverse-proxy caches such as Varnish and Nginx.",
      "Memoizing expensive calls, as Python's functools.lru_cache does.",
    ],
  },
  complexity: { best: "O(1)", average: "O(1)", worst: "O(1)", space: "O(capacity)" },
  code: {
    pseudo: `
procedure Get(key)
  node ← map[key]                                 @@lookup
  if node = nil then return -1                    @@miss
  move node to the front of the list              @@touch
  return node.value                               @@touch

procedure Put(key, value)
  if key ∉ map and |map| = capacity then          @@full
    lru ← the node at the back of the list        @@evict
    unlink lru; delete map[lru.key]               @@evict
  if key ∈ map then unlink map[key]               @@insert
  map[key] ← new node(key, value)                 @@insert
  push map[key] onto the front of the list        @@insert
`,
    python: `
from collections import OrderedDict

class LRUCache:
    def __init__(self, cap):
        self.cap = cap
        self.map = OrderedDict()  # a dict threaded on a doubly linked list, front = most recent

    def get(self, key):
        if key not in self.map:                     @@lookup
            return -1                               @@miss
        self.map.move_to_end(key, last=False)       @@touch
        return self.map[key]                        @@touch

    def put(self, key, val):
        if key not in self.map and len(self.map) == self.cap:   @@full
            self.map.popitem(last=True)             @@evict
        self.map[key] = val                         @@insert
        self.map.move_to_end(key, last=False)       @@insert
`,
    cpp: `
class LRUCache {
    int cap;
    std::list<std::pair<int, int>> order;  // front = most recent
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> map;
public:
    explicit LRUCache(int cap) : cap(cap) {}

    int get(int key) {
        auto it = map.find(key);                            @@lookup
        if (it == map.end()) return -1;                     @@miss
        order.splice(order.begin(), order, it->second);     @@touch
        return it->second->second;                          @@touch
    }

    void put(int key, int val) {
        auto it = map.find(key);                            @@full
        if (it == map.end() && (int)map.size() == cap) {    @@full
            map.erase(order.back().first);                  @@evict
            order.pop_back();                               @@evict
        }
        if (it != map.end()) order.erase(it->second);       @@insert
        order.push_front({key, val});                       @@insert
        map[key] = order.begin();                           @@insert
    }
};
`,
    java: `
class LRUCache {
    static class Node { int key, val; Node prev, next; }
    private final int cap;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(), tail = new Node();  // head.next = most recent
    LRUCache(int cap) { this.cap = cap; head.next = tail; tail.prev = head; }
    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void pushFront(Node n) { n.prev = head; n.next = head.next; head.next.prev = n; head.next = n; }

    int get(int key) {
        Node n = map.get(key);                              @@lookup
        if (n == null) return -1;                           @@miss
        unlink(n); pushFront(n);                            @@touch
        return n.val;                                       @@touch
    }
    void put(int key, int val) {
        Node n = map.get(key);                              @@full
        if (n == null && map.size() == cap) {               @@full
            Node lru = tail.prev;                           @@evict
            unlink(lru); map.remove(lru.key);               @@evict
        }
        if (n != null) unlink(n); else map.put(key, n = new Node());   @@insert
        n.key = key; n.val = val; pushFront(n);             @@insert
    }
}
`,
    javascript: `
class LRUCache {
  constructor(cap) {
    this.cap = cap;
    this.map = new Map();
    this.head = {}; this.tail = {};  // head.next = most recent
    this.head.next = this.tail; this.tail.prev = this.head;
  }
  unlink(n) { n.prev.next = n.next; n.next.prev = n.prev; }
  pushFront(n) { n.prev = this.head; n.next = this.head.next; this.head.next.prev = n; this.head.next = n; }
  get(key) {
    const n = this.map.get(key);                    @@lookup
    if (!n) return -1;                              @@miss
    this.unlink(n); this.pushFront(n);              @@touch
    return n.val;                                   @@touch
  }
  put(key, val) {
    let n = this.map.get(key);                      @@full
    if (!n && this.map.size === this.cap) {         @@full
      const lru = this.tail.prev;                   @@evict
      this.unlink(lru); this.map.delete(lru.key);   @@evict
    }
    if (n) this.unlink(n); else this.map.set(key, (n = { key }));   @@insert
    n.val = val; this.pushFront(n);                 @@insert
  }
}
`,
  },
  makeInput(size) {
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    const [a, b, c, d] = keys;
    const value = () => 10 + pick(90);
    const script: LruOp[] = [
      { name: "put", key: a, value: value() },
      { name: "put", key: b, value: value() },
      { name: "put", key: c, value: value() },
      { name: "get", key: a },
      { name: "put", key: d, value: value() },
      { name: "get", key: b },
    ];
    const pool = keys.slice(0, 6);
    while (script.length < size) {
      const key = pool[pick(pool.length)];
      script.push(Math.random() < 0.5 ? { name: "get", key } : { name: "put", key, value: value() });
    }
    return script;
  },
  solve(script) {
    const cache = new Map<number, number>();
    return script.map((op) => {
      const value = op.name === "get" ? cache.get(op.key) : op.value;
      if (value === undefined) return "-1";
      let result = op.name === "get" ? String(value) : "ok";
      if (!cache.has(op.key) && cache.size === CAP) {
        const lru = cache.keys().next().value!;
        cache.delete(lru);
        result = `evicted ${lru}`;
      }
      cache.delete(op.key);
      cache.set(op.key, value);
      return result;
    });
  },
  run(script) {
    const t = new OpsTracer(script.map(label));
    const list: { key: number; value: number }[] = [];

    const buckets: (number | undefined)[] = Array(CAP).fill(undefined);

    const rows = (marks: Partial<Record<number, CellMark>> = {}): OpsRow[] => {
      const blank = (id: string): Cell => ({ id, text: "", mark: "empty" });
      const chain = Array.from({ length: 2 * CAP - 1 }, (_, s): Cell => {
        const j = s >> 1;
        if (s % 2) return { id: `l${j}`, text: j + 1 < list.length ? "⇄" : "", mark: "link" };
        const node = list[j];
        if (!node) return blank(`_${j}`);
        const sub = [j === 0 && "head", j === list.length - 1 && "tail"].filter(Boolean).join("·");
        return { id: `k${node.key}`, text: `${node.key}:${node.value}`, sub: sub || undefined, mark: marks[node.key] };
      });
      const map = buckets.map((key, s): Cell => {
        const node = list.find((n) => n.key === key);
        return node ? { id: `m${node.key}`, text: `${node.key}→${node.key}:${node.value}`, mark: marks[node.key] } : blank(`_m${s}`);
      });
      return [
        { title: "Doubly linked list, head = most recent, tail = least recent", cells: chain },
        { title: "Hash map, key → list node", cells: map },
      ];
    };
    const size = () => `${list.length}/${CAP}`;

    script.forEach((op, i) => {
      t.at = i;
      const { key } = op;
      const pos = list.findIndex((n) => n.key === key);
      if (op.name === "get") {
        if (pos < 0) {
          t.step("lookup", `get(${key}): look up ${key} in the hash map.`, rows(), { key, size: size() });
          t.answer("-1");
          t.step("miss", `${key} is not in the map, so it is not cached: return -1.`, rows(), { key, size: size() });
          return;
        }
        t.step("lookup", `get(${key}): the hash map points straight at node ${key}:${list[pos].value}.`, rows({ [key]: "probe" }), { key, size: size() });
        const [node] = list.splice(pos, 1);
        list.unshift(node);
        t.answer(String(node.value));
        const note =
          pos === 0
            ? `Hit: ${key} is already the most recently used, so return ${node.value}.`
            : `Hit: unlink ${key} from position ${pos + 1}, move it to the front as the most recently used, and return ${node.value}.`;
        t.step("touch", note, rows({ [key]: "hit" }), { key, size: size() });
        return;
      }

      let result = "ok";
      if (pos < 0 && list.length === CAP) {
        const lru = list[CAP - 1];
        t.step("full", `put(${key}, ${op.value}): ${key} is new and the cache is full (${size()}), so evict the least recently used node.`, rows({ [lru.key]: "miss" }), { key, size: size() });
        list.pop();
        buckets[buckets.indexOf(lru.key)] = undefined;
        result = `evicted ${lru.key}`;
        t.step("evict", `Evict ${lru.key}:${lru.value} from the back of the list and delete key ${lru.key} from the map.`, rows(), { key, size: size() });
      }
      if (pos >= 0) list.splice(pos, 1);
      list.unshift({ key, value: op.value });
      if (pos < 0) buckets[buckets.indexOf(undefined)] = key;
      t.answer(result);
      const what = pos >= 0 ? `${key} is cached, so set its value to ${op.value} and move it to the front.` : `Add node ${key}:${op.value} at the front and point map[${key}] at it.`;
      t.step("insert", `put(${key}, ${op.value}): ${what}`, rows({ [key]: "new" }), { key, size: size() });
    });
    return t.frames;
  },
};
