import { ScanTracer } from "../../core/trace";
import { randomArray } from "../../core/inputs";
import type { ScanAlgorithm, ScanBand, ScanFrame } from "../../core/types";

export const largestRectangle: ScanAlgorithm = {
  id: "largest-rectangle",
  name: "Largest Rectangle in a Histogram",
  kind: "scan",
  topic: "arrays",
  pointers: ["i"],
  legend: [
    ["compare", "Current bar"],
    ["pivot", "Waiting on the stack"],
    ["swap", "Popped"],
    ["band", "Rectangle of the popped bar"],
    ["found", "Largest rectangle"],
  ],
  labelTitle: "area of each popped bar",
  about: {
    summary: "Finds the largest rectangle under a histogram by keeping a stack of bars with rising heights; a bar that is no taller than the stack top fixes how far that top bar can stretch right, and the stack below it fixes how far left.",
    invariants: [
      "Heights on the stack strictly increase from bottom to top.",
      "When a bar is popped, the bar below it on the stack is the nearest shorter bar to its left, and the bar that popped it is the nearest not-taller bar to its right.",
      "Each bar is pushed once and popped once, so the scan is O(n).",
    ],
    useCases: [
      "Maximal rectangle of 1s in a binary matrix, by running this on each row's column heights.",
      "Finding the widest free block under a skyline, as in layout and packing problems.",
      "The monotonic stack pattern that also solves next greater element and trapping rain water.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)" },
  code: {
    pseudo: `
procedure largestRectangle(H)
  S ← empty stack of indices; best ← 0              @@init
  for i ← 0 to length(H) do
    cur ← H[i] if i < length(H) else 0
    while S not empty and H[top of S] ≥ cur do      @@pop
      h ← H[pop S]                                  @@pop
      left ← top of S + 1 if S not empty else 0     @@pop
      area ← h × (i − left)                         @@pop
      best ← max(best, area)                        @@best
    push i onto S                                   @@push
  return best                                       @@done
`,
    python: `
def largest_rectangle(h):
    stack, best = [], 0                             @@init
    for i in range(len(h) + 1):
        cur = h[i] if i < len(h) else 0
        while stack and h[stack[-1]] >= cur:        @@pop
            height = h[stack.pop()]                 @@pop
            left = stack[-1] + 1 if stack else 0    @@pop
            area = height * (i - left)              @@pop
            best = max(best, area)                  @@best
        stack.append(i)                             @@push
    return best                                     @@done
`,
    cpp: `
int largestRectangle(const std::vector<int>& h) {
    std::vector<int> stack;                                 @@init
    int best = 0;                                           @@init
    for (int i = 0; i <= (int)h.size(); i++) {
        int cur = i < (int)h.size() ? h[i] : 0;
        while (!stack.empty() && h[stack.back()] >= cur) {  @@pop
            int height = h[stack.back()];                   @@pop
            stack.pop_back();                               @@pop
            int left = stack.empty() ? 0 : stack.back() + 1;  @@pop
            int area = height * (i - left);                 @@pop
            best = std::max(best, area);                    @@best
        }
        stack.push_back(i);                                 @@push
    }
    return best;                                            @@done
}
`,
    java: `
static int largestRectangle(int[] h) {
    Deque<Integer> stack = new ArrayDeque<>();              @@init
    int best = 0;                                           @@init
    for (int i = 0; i <= h.length; i++) {
        int cur = i < h.length ? h[i] : 0;
        while (!stack.isEmpty() && h[stack.peek()] >= cur) {  @@pop
            int height = h[stack.pop()];                    @@pop
            int left = stack.isEmpty() ? 0 : stack.peek() + 1;  @@pop
            int area = height * (i - left);                 @@pop
            best = Math.max(best, area);                    @@best
        }
        stack.push(i);                                      @@push
    }
    return best;                                            @@done
}
`,
    javascript: `
function largestRectangle(h) {
  const stack = [];                                         @@init
  let best = 0;                                             @@init
  for (let i = 0; i <= h.length; i++) {
    const cur = i < h.length ? h[i] : 0;
    while (stack.length && h[stack[stack.length - 1]] >= cur) {  @@pop
      const height = h[stack.pop()];                        @@pop
      const left = stack.length ? stack[stack.length - 1] + 1 : 0;  @@pop
      const area = height * (i - left);                     @@pop
      best = Math.max(best, area);                          @@best
    }
    stack.push(i);                                          @@push
  }
  return best;                                              @@done
}
`,
  },
  makeInput: (size) => ({ values: randomArray(size) }),
  solve: ({ values }) => Math.max(...values.map((h, i) => {
    let from = i;
    let to = i;
    while (from > 0 && values[from - 1] >= h) from--;
    while (to < values.length - 1 && values[to + 1] >= h) to++;
    return h * (to - from + 1);
  })),
  run({ values }) {
    const t = new ScanTracer(values);
    const n = values.length;
    const stack: number[] = [];
    let best = 0;
    let bestBand: ScanBand | undefined;
    t.aux = { title: "Stack", indices: stack };

    const view = (i: number, marks: ScanFrame["marks"], band: ScanBand | undefined = bestBand) => {
      const onStack: ScanFrame["marks"] = {};
      for (const s of stack) onStack[s] = "pivot";
      return {
        marks: { ...onStack, ...marks },
        pointers: i < n ? { i } : {},
        bands: band ? [band] : [],
        vars: { i: i < n ? i : "end", best },
      };
    };

    t.step("init", "Each bar waits on the stack until a bar no taller than it shows how far right it can stretch.");
    for (let i = 0; i <= n; i++) {
      const cur = i < n ? values[i] : 0;
      while (stack.length && values[stack[stack.length - 1]] >= cur) {
        const j = stack.pop()!;
        const height = values[j];
        const left = stack.length ? stack[stack.length - 1] + 1 : 0;
        const width = i - left;
        const area = height * width;
        const band = { from: left, to: i - 1, low: 0, high: height };
        t.labels[j] = String(area);
        const why = i < n ? `A[${i}] = ${cur} ≤ A[${j}] = ${height}` : `The end of the array acts as a bar of height 0`;
        const marks: ScanFrame["marks"] = { [j]: "swap" };
        if (i < n) marks[i] = "compare";
        t.step("pop", `${why}, so pop bar ${j}. It spans indices ${left}..${i - 1}, width ${width}, area ${height} × ${width} = ${area}.`, view(i, marks, band));
        if (area > best) {
          best = area;
          bestBand = band;
          t.step("best", `${area} beats the best so far, so best = ${area}.`, view(i, marks, band));
        }
      }
      if (i < n) {
        stack.push(i);
        t.step("push", `Push bar ${i} (height ${cur}). Every bar still on the stack is shorter than it.`, view(i, { [i]: "compare" }));
      }
    }
    const marks: ScanFrame["marks"] = {};
    if (bestBand) for (let k = bestBand.from; k <= bestBand.to; k++) marks[k] = "found";
    t.answer = best;
    t.step("done", `Every bar has been popped. The largest rectangle has area ${best}.`, { marks, bands: bestBand ? [bestBand] : [], vars: { best } });
    return t.frames;
  },
};
