import { ScanTracer } from "../../core/trace";
import { randomArray } from "../../core/inputs";
import type { ScanAlgorithm, ScanBand } from "../../core/types";

export const trappingRainWater: ScanAlgorithm = {
  id: "trapping-rain-water",
  name: "Trapping Rain Water",
  kind: "scan",
  topic: "arrays",
  pointers: ["l", "r"],
  about: {
    summary: "Totals the water held between bars of an elevation map with two pointers that move inward, always advancing the side whose running maximum is lower because that side's water level is already fixed.",
    invariants: [
      "lmax is the tallest bar in A[0..l] and rmax is the tallest bar in A[r..n−1].",
      "Water above a bar is the lower of the tallest bar on its left and the tallest on its right, minus its own height.",
      "The side with the lower maximum can be settled now, because the other side's maximum is at least as high.",
    ],
    useCases: [
      "Rainwater or fluid held in terrain profiles, and capacity of a bar chart seen as a container.",
      "Two-pointer problems where each side's answer depends only on a running maximum from its own end.",
      "The two-pointer cousin of the monotonic stack solution, with O(1) extra space.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
  code: {
    pseudo: `
procedure trap(H)
  l ← 0; r ← length(H) − 1                      @@init
  lmax ← H[l]; rmax ← H[r]; water ← 0           @@init
  while l < r do
    if lmax < rmax then                         @@compare
      l ← l + 1                                 @@left
      lmax ← max(lmax, H[l])                    @@left
      water ← water + lmax − H[l]               @@left
    else
      r ← r − 1                                 @@right
      rmax ← max(rmax, H[r])                    @@right
      water ← water + rmax − H[r]               @@right
  return water                                  @@done
`,
    python: `
def trap(h):
    l, r = 0, len(h) - 1                        @@init
    lmax, rmax, water = h[l], h[r], 0           @@init
    while l < r:
        if lmax < rmax:                         @@compare
            l += 1                              @@left
            lmax = max(lmax, h[l])              @@left
            water += lmax - h[l]                @@left
        else:
            r -= 1                              @@right
            rmax = max(rmax, h[r])              @@right
            water += rmax - h[r]                @@right
    return water                                @@done
`,
    cpp: `
int trap(const std::vector<int>& h) {
    int l = 0, r = (int)h.size() - 1;           @@init
    int lmax = h[l], rmax = h[r], water = 0;    @@init
    while (l < r) {
        if (lmax < rmax) {                      @@compare
            l++;                                @@left
            lmax = std::max(lmax, h[l]);        @@left
            water += lmax - h[l];               @@left
        } else {
            r--;                                @@right
            rmax = std::max(rmax, h[r]);        @@right
            water += rmax - h[r];               @@right
        }
    }
    return water;                               @@done
}
`,
    java: `
static int trap(int[] h) {
    int l = 0, r = h.length - 1;                @@init
    int lmax = h[l], rmax = h[r], water = 0;    @@init
    while (l < r) {
        if (lmax < rmax) {                      @@compare
            l++;                                @@left
            lmax = Math.max(lmax, h[l]);        @@left
            water += lmax - h[l];               @@left
        } else {
            r--;                                @@right
            rmax = Math.max(rmax, h[r]);        @@right
            water += rmax - h[r];               @@right
        }
    }
    return water;                               @@done
}
`,
    javascript: `
function trap(h) {
  let l = 0, r = h.length - 1;                  @@init
  let lmax = h[l], rmax = h[r], water = 0;      @@init
  while (l < r) {
    if (lmax < rmax) {                          @@compare
      l++;                                      @@left
      lmax = Math.max(lmax, h[l]);              @@left
      water += lmax - h[l];                     @@left
    } else {
      r--;                                      @@right
      rmax = Math.max(rmax, h[r]);              @@right
      water += rmax - h[r];                     @@right
    }
  }
  return water;                                 @@done
}
`,
  },
  makeInput: (size) => ({ values: randomArray(size) }),
  solve({ values }) {
    let water = 0;
    for (let i = 0; i < values.length; i++) {
      const left = Math.max(...values.slice(0, i + 1));
      const right = Math.max(...values.slice(i));
      water += Math.min(left, right) - values[i];
    }
    return water;
  },
  run({ values }) {
    const t = new ScanTracer(values);
    const h = values;
    let l = 0;
    let r = h.length - 1;
    let lmax = h[l];
    let rmax = h[r];
    let water = 0;
    const pools: ScanBand[] = [];
    const view = (marks: Record<number, "compare">) => ({
      marks: t.range(l, r, marks),
      pointers: { l, r },
      bands: pools.slice(),
      vars: { l, r, lmax, rmax, water },
    });
    const settle = (i: number, max: number) => {
      const depth = max - h[i];
      if (depth > 0) {
        pools.push({ from: i, to: i, low: h[i], high: max });
        t.labels[i] = String(depth);
      }
      water += depth;
      return depth;
    };

    t.step("init", `Start with pointers at both ends. lmax = ${lmax} and rmax = ${rmax} are the tallest bars seen from each end.`, view({}));
    while (l < r) {
      const goLeft = lmax < rmax;
      t.step(
        "compare",
        goLeft
          ? `lmax = ${lmax} < rmax = ${rmax}, so water on the left is capped by lmax. Move l.`
          : `lmax = ${lmax} ≥ rmax = ${rmax}, so water on the right is capped by rmax. Move r.`,
        view({}),
      );
      if (goLeft) {
        l++;
        lmax = Math.max(lmax, h[l]);
        const depth = settle(l, lmax);
        t.step("left", depth ? `A[${l}] = ${h[l]} sits under lmax = ${lmax}, so it holds ${depth}. Water is ${water}.` : `A[${l}] = ${h[l]} reaches lmax = ${lmax}, so it holds nothing. Water stays ${water}.`, view({ [l]: "compare" }));
      } else {
        r--;
        rmax = Math.max(rmax, h[r]);
        const depth = settle(r, rmax);
        t.step("right", depth ? `A[${r}] = ${h[r]} sits under rmax = ${rmax}, so it holds ${depth}. Water is ${water}.` : `A[${r}] = ${h[r]} reaches rmax = ${rmax}, so it holds nothing. Water stays ${water}.`, view({ [r]: "compare" }));
      }
    }
    t.answer = water;
    t.step("done", `The pointers met. ${water} units of water are trapped in total.`, { bands: pools, pointers: { l, r }, vars: { water } });
    return t.frames;
  },
};
