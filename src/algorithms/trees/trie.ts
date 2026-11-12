import { TreeTracer, type TreeShape } from "../../core/trace";
import type { TreeAlgorithm, TreeMark } from "../../core/types";

type Node = { id: number; ch: string; end: boolean; kids: Node[] };
type Marks = Partial<Record<number, TreeMark>>;

/**
 * Twenty-four words in five families, nine longest words in all, so any subset draws at most nine leaves.
 * A key picks the word at its index modulo the length and moves on to the next unused one.
 */
const WORDS = [
  "to", "ton", "tone", "toned", "top", "tops",
  "car", "card", "cards", "care", "cared", "cat", "cats",
  "do", "dog", "dogs", "dot", "dots",
  "in", "inn", "inns",
  "he", "her", "hers",
];

export function trieWords(keys: number[]) {
  const used = new Set<number>();
  return keys.map((key) => {
    let i = key % WORDS.length;
    while (used.has(i)) i = (i + 1) % WORDS.length;
    used.add(i);
    return WORDS[i];
  });
}

/** One prefix that matches stored words, and one that leaves the trie after its first letter. */
export function trieQueries(words: string[]) {
  return [words[0].slice(0, 2), `${words[1][0]}z`];
}

export const trie: TreeAlgorithm = {
  id: "trie",
  name: "Trie",
  kind: "tree",
  topic: "tree",
  about: {
    summary: "A tree that spells words one letter per edge. Words that share a prefix share a path from the root, so finding every word with a given prefix means walking the prefix and reading what hangs below.",
    invariants: [
      "The path from the root to a node spells a prefix, and each node has at most one child per letter.",
      "A node marked $ ends a stored word, and a word can end inside another word's path, as to ends inside ton.",
      "Insert and prefix search take one step per letter, however many words are stored.",
    ],
    useCases: [
      "Autocomplete in search boxes, editors, and phone keyboards.",
      "Routing tables that match the longest prefix of an address or URL path.",
      "Spell checkers and word games that must test many prefixes quickly.",
    ],
  },
  complexity: { best: "O(m)", average: "O(m)", worst: "O(m)", space: "O(n · m)" },
  code: {
    pseudo: `
procedure Insert(root, word)
  node ← root
  for each letter c in word do
    if node has no child c then add a new child c to node        @@new
    node ← the child c of node                                   @@follow
  mark node as the end of a word                                 @@end

procedure StartsWith(root, prefix)
  node ← root
  for each letter c in prefix do
    if node has no child c then return an empty list             @@miss
    node ← the child c of node                                   @@walk
  return every word at or below node                             @@collect
`,
    python: `
class Node:
    def __init__(self): self.kids, self.end = {}, False

def insert(root, word):
    node = root
    for c in word:
        if c not in node.kids:
            node.kids[c] = Node()                           @@new
        node = node.kids[c]                                 @@follow
    node.end = True                                         @@end

def starts_with(root, prefix):
    node = root
    for c in prefix:
        if c not in node.kids: return []                    @@miss
        node = node.kids[c]                                 @@walk
    return below(node, prefix)                              @@collect

def below(node, path):
    out = [path] if node.end else []                        @@collect
    for c in sorted(node.kids): out += below(node.kids[c], path + c)   @@collect
    return out
`,
    cpp: `
struct Node { std::map<char, Node*> kids; bool end = false; };

void insert(Node* root, const std::string& word) {
    Node* node = root;
    for (char c : word) {
        if (!node->kids.count(c)) node->kids[c] = new Node; @@new
        node = node->kids[c];                               @@follow
    }
    node->end = true;                                       @@end
}

void below(Node* node, std::string path, std::vector<std::string>& out) {
    if (node->end) out.push_back(path);                     @@collect
    for (auto& [c, kid] : node->kids) below(kid, path + c, out);   @@collect
}

std::vector<std::string> startsWith(Node* root, const std::string& prefix) {
    Node* node = root;
    for (char c : prefix) {
        if (!node->kids.count(c)) return {};                @@miss
        node = node->kids[c];                               @@walk
    }
    std::vector<std::string> out;
    below(node, prefix, out);                               @@collect
    return out;
}
`,
    java: `
static class Node { Map<Character, Node> kids = new TreeMap<>(); boolean end; }

static void insert(Node root, String word) {
    Node node = root;
    for (char c : word.toCharArray()) {
        if (!node.kids.containsKey(c)) node.kids.put(c, new Node());   @@new
        node = node.kids.get(c);                            @@follow
    }
    node.end = true;                                        @@end
}

static void below(Node node, String path, List<String> out) {
    if (node.end) out.add(path);                            @@collect
    for (var e : node.kids.entrySet()) below(e.getValue(), path + e.getKey(), out);   @@collect
}

static List<String> startsWith(Node root, String prefix) {
    Node node = root;
    for (char c : prefix.toCharArray()) {
        if (!node.kids.containsKey(c)) return List.of();    @@miss
        node = node.kids.get(c);                            @@walk
    }
    List<String> out = new ArrayList<>();
    below(node, prefix, out);                               @@collect
    return out;
}
`,
    javascript: `
const makeNode = () => ({ kids: new Map(), end: false });

function insert(root, word) {
  let node = root;
  for (const c of word) {
    if (!node.kids.has(c)) node.kids.set(c, makeNode());    @@new
    node = node.kids.get(c);                                @@follow
  }
  node.end = true;                                          @@end
}

function below(node, path, out = []) {
  if (node.end) out.push(path);                             @@collect
  for (const c of [...node.kids.keys()].sort()) below(node.kids.get(c), path + c, out);   @@collect
  return out;
}

function startsWith(root, prefix) {
  let node = root;
  for (const c of prefix) {
    if (!node.kids.has(c)) return [];                       @@miss
    node = node.kids.get(c);                                @@walk
  }
  return below(node, prefix);                               @@collect
}
`,
  },
  run(keys) {
    const words = trieWords(keys);
    const queries = trieQueries(words);
    let nextId = 0;
    const root: Node = { id: nextId++, ch: "", end: false, kids: [] };
    const shape = (n: Node): TreeShape => ({ id: n.id, value: n === root ? "•" : n.ch + (n.end ? "$" : ""), children: n.kids.map(shape) });
    const t = new TreeTracer("Next operations", () => ({ roots: [shape(root)] }));
    t.aux.items = [...words.map((w) => `insert ${w}`), ...queries.map((q) => `prefix ${q}`)];
    const along = (trail: Node[], marks: Marks = {}) => Object.assign(Object.fromEntries(trail.map((n) => [n.id, "path" as const])), marks);

    const insert = (word: string) => {
      t.aux.items.shift();
      const trail: Node[] = [];
      let node = root;
      for (const [i, c] of [...word].entries()) {
        trail.push(node);
        const spelled = word.slice(0, i + 1);
        let kid = node.kids.find((k) => k.ch === c);
        if (kid) {
          t.step("follow", `Insert ${word}: ${node === root ? "the root" : `"${word.slice(0, i)}"`} already has a child ${c}, so follow it.`, { marks: along(trail, { [kid.id]: "compare" }), vars: { word, prefix: spelled } });
        } else {
          kid = { id: nextId++, ch: c, end: false, kids: [] };
          node.kids.push(kid);
          node.kids.sort((a, b) => (a.ch < b.ch ? -1 : 1));
          t.step("new", `Insert ${word}: ${node === root ? "the root" : `"${word.slice(0, i)}"`} has no child ${c}, so add one.`, { marks: along(trail, { [kid.id]: "target" }), vars: { word, prefix: spelled } });
        }
        node = kid;
      }
      trail.push(node);
      node.end = true;
      t.step("end", `"${word}" ends at this node, so mark it with $.`, { marks: along(trail.slice(0, -1), { [node.id]: "target" }), vars: { word } });
    };

    const below = (node: Node, path: string, out: { word: string; id: number }[] = []) => {
      if (node.end) out.push({ word: path, id: node.id });
      for (const kid of node.kids) below(kid, path + kid.ch, out);
      return out;
    };

    const answers: string[] = [];
    const startsWith = (prefix: string) => {
      t.aux.items.shift();
      const trail: Node[] = [];
      let node = root;
      for (const [i, c] of [...prefix].entries()) {
        trail.push(node);
        const kid = node.kids.find((k) => k.ch === c);
        if (!kid) {
          t.step("miss", `Prefix ${prefix}: ${node === root ? "the root" : `"${prefix.slice(0, i)}"`} has no child ${c}, so no stored word starts with ${prefix}.`, { marks: along(trail.slice(0, -1), { [node.id]: "compare" }), vars: { prefix } });
          answers.push(`${prefix}: none`);
          return;
        }
        t.step("walk", `Prefix ${prefix}: follow ${c} to "${prefix.slice(0, i + 1)}".`, { marks: along(trail, { [kid.id]: "compare" }), vars: { prefix, matched: i + 1 } });
        node = kid;
      }
      const found = below(node, prefix);
      t.step("collect", `Every letter of ${prefix} matched. The words at or below this node are ${found.map((f) => f.word).join(", ")}.`, {
        marks: along(trail, { [node.id]: "compare", ...Object.fromEntries(found.map((f) => [f.id, "target" as const])) }),
        vars: { prefix, words: found.length },
      });
      answers.push(`${prefix}: ${found.map((f) => f.word).join(", ")}`);
    };

    t.step("new", `The trie starts as a bare root. Insert ${words.join(", ")}, then ask for the words starting with ${queries.join(" and ")}.`);
    words.forEach(insert);
    queries.forEach(startsWith);

    const markDone = (n: Node) => {
      t.marks[n.id] = "done";
      n.kids.forEach(markDone);
    };
    markDone(root);
    t.answer = `Words starting with ${answers.join(" | ")}`;
    t.step("collect", `All inserts and prefix searches are done. ${answers.join("; ")}.`);
    return t.frames;
  },
};
