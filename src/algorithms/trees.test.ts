import { describe, expect, test } from "bun:test";
import { randomKeys } from "../core/inputs";
import type { TreeFrame } from "../core/types";
import { avl } from "./trees/avl";
import { fenwick, fenwickPlan } from "./trees/fenwick";
import { huffman, huffmanCounts } from "./trees/huffman";
import { segmentPlan, segmentTree } from "./trees/segment-tree";
import { trie, trieQueries, trieWords } from "./trees/trie";

const SIZES = [3, 4, 5, 9, 15];
const runs = (fn: (keys: number[]) => void) => {
  for (const n of SIZES) for (let k = 0; k < 40; k++) fn(randomKeys(n));
};
const last = (frames: TreeFrame[]) => frames[frames.length - 1];
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Heights of a binary frame keyed by node id, or `null` once any node's balance leaves −1..1. */
function balanced(f: TreeFrame) {
  const byId = new Map(f.nodes.map((n) => [n.id, n]));
  let ok = true;
  const height = (id: number | null): number => {
    if (id === null) return 0;
    const [l, r] = byId.get(id)!.children;
    const hl = height(l ?? null);
    const hr = height(r ?? null);
    if (Math.abs(hl - hr) > 1) ok = false;
    return 1 + Math.max(hl, hr);
  };
  const h = height(f.roots[0] ?? null);
  return ok ? h : null;
}

describe("avl", () => {
  test("every balance factor is −1..1 before each insert and at the end, and the height stays within 1.44 log2(n + 2)", () => {
    runs((keys) => {
      const frames = avl.run(keys);
      let key: unknown;
      for (const f of frames)
        if ((f.line === "descend" || f.line === "attach") && f.vars?.key !== key) {
          key = f.vars?.key;
          expect(balanced(f)).not.toBeNull();
        }
      const h = balanced(last(frames));
      expect(h).not.toBeNull();
      expect(h!).toBeLessThanOrEqual(1.44 * Math.log2(keys.length + 2));
    });
  });
});

describe("trie", () => {
  test("prefix answers match a startsWith scan over the inserted words", () => {
    runs((keys) => {
      const words = trieWords(keys);
      const want = trieQueries(words).map((p) => {
        const hits = words.filter((w) => w.startsWith(p)).sort();
        return `${p}: ${hits.length ? hits.join(", ") : "none"}`;
      });
      const answer = last(trie.run(keys)).answer!.replace("Words starting with ", "");
      const got = answer.split(" | ").map((part) => {
        const [p, rest] = part.split(": ");
        return `${p}: ${rest === "none" ? rest : rest.split(", ").sort().join(", ")}`;
      });
      expect(got).toEqual(want);
    });
  });
});

describe("segment-tree", () => {
  test("the range sum before and after the update matches a direct sum", () => {
    runs((keys) => {
      const { values, l, r, index, value } = segmentPlan(keys);
      const before = sum(values.slice(l, r + 1));
      const next = values.slice();
      next[index] = value;
      const after = sum(next.slice(l, r + 1));
      expect(last(segmentTree.run(keys)).answer).toContain(`is ${before}, then ${after} after`);
    });
  });
});

describe("fenwick", () => {
  test("the prefix sum before and after the update matches a direct sum", () => {
    runs((keys) => {
      const { values, prefix, index, delta } = fenwickPlan(keys);
      const before = sum(values.slice(1, prefix + 1));
      const after = before + (index <= prefix ? delta : 0);
      expect(last(fenwick.run(keys)).answer).toStartWith(`prefix(${prefix}) is ${before}, then ${after} after`);
    });
  });
});

describe("huffman", () => {
  test("leaf codes are prefix-free and cost as few bits as the reference merge cost", () => {
    runs((keys) => {
      const counts = huffmanCounts(keys);
      const heap = counts.map((c) => c.count);
      let cost = 0;
      while (heap.length > 1) {
        heap.sort((a, b) => a - b);
        const merged = heap.shift()! + heap.shift()!;
        cost += merged;
        heap.push(merged);
      }
      const final = last(huffman.run(keys));
      const leaves = final.nodes.filter((n) => n.children.length === 0);
      const codes = leaves.map((n) => n.caption!);
      expect(codes.every((c) => /^[01]+$/.test(c))).toBe(true);
      for (const a of codes) for (const b of codes) if (a !== b) expect(b.startsWith(a)).toBe(false);
      const bits = sum(leaves.map((n) => counts.find((c) => c.letter === n.value)!.count * n.caption!.length));
      expect(bits).toBe(cost);
      expect(final.answer).toStartWith(`${cost} bits for ${sum(counts.map((c) => c.count))} letters`);
    });
  });
});
