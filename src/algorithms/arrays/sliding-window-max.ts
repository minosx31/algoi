import { ScanTracer } from "../../core/trace";
import { randomArray } from "../../core/inputs";
import type { ScanAlgorithm, ScanFrame } from "../../core/types";

export const slidingWindowMax: ScanAlgorithm = {
  id: "sliding-window-max",
  name: "Sliding Window Maximum",
  kind: "scan",
  topic: "arrays",
  pointers: ["i"],
  about: {
    summary: "Reports the maximum of every window of k consecutive values by keeping a deque of indices whose values decrease from front to back, so the front is always the current maximum.",
    invariants: [
      "The deque holds indices in increasing order, and their values strictly decrease from front to back.",
      "The front index is inside the window and holds the window's maximum.",
      "Each index is pushed once and popped at most once, so the whole scan is O(n).",
    ],
    useCases: [
      "Rolling maximum or minimum over a stream, as in metrics dashboards and rate monitors.",
      "The monotonic queue trick that speeds up sliding-window dynamic programming.",
      "\"Best in the last k\" questions over prices, latencies, or sensor readings.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(k)" },
  code: {
    pseudo: `
procedure slidingWindowMax(A, k)
  D ← empty deque of indices; out ← []          @@init
  for i ← 0 to length(A) − 1 do
    if D not empty and D.front ≤ i − k then      @@evict
      remove D.front                             @@evict
    while D not empty and A[D.back] ≤ A[i] do    @@drop
      remove D.back                              @@drop
    append i to D                                @@push
    if i ≥ k − 1 then                            @@record
      append A[D.front] to out                   @@record
  return out                                     @@done
`,
    python: `
from collections import deque

def sliding_window_max(a, k):
    dq, out = deque(), []                       @@init
    for i in range(len(a)):
        if dq and dq[0] <= i - k:               @@evict
            dq.popleft()                        @@evict
        while dq and a[dq[-1]] <= a[i]:         @@drop
            dq.pop()                            @@drop
        dq.append(i)                            @@push
        if i >= k - 1:                          @@record
            out.append(a[dq[0]])                @@record
    return out                                  @@done
`,
    cpp: `
std::vector<int> slidingWindowMax(const std::vector<int>& a, int k) {
    std::deque<int> dq;                                 @@init
    std::vector<int> out;                               @@init
    for (int i = 0; i < (int)a.size(); i++) {
        if (!dq.empty() && dq.front() <= i - k) {       @@evict
            dq.pop_front();                             @@evict
        }
        while (!dq.empty() && a[dq.back()] <= a[i]) {   @@drop
            dq.pop_back();                              @@drop
        }
        dq.push_back(i);                                @@push
        if (i >= k - 1) {                               @@record
            out.push_back(a[dq.front()]);               @@record
        }
    }
    return out;                                         @@done
}
`,
    java: `
static int[] slidingWindowMax(int[] a, int k) {
    Deque<Integer> dq = new ArrayDeque<>();             @@init
    int[] out = new int[a.length - k + 1];              @@init
    for (int i = 0; i < a.length; i++) {
        if (!dq.isEmpty() && dq.peekFirst() <= i - k) { @@evict
            dq.pollFirst();                             @@evict
        }
        while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) {  @@drop
            dq.pollLast();                              @@drop
        }
        dq.addLast(i);                                  @@push
        if (i >= k - 1) {                               @@record
            out[i - k + 1] = a[dq.peekFirst()];         @@record
        }
    }
    return out;                                         @@done
}
`,
    javascript: `
function slidingWindowMax(a, k) {
  const dq = [], out = [];                      @@init
  for (let i = 0; i < a.length; i++) {
    if (dq.length && dq[0] <= i - k) {          @@evict
      dq.shift();                               @@evict
    }
    while (dq.length && a[dq[dq.length - 1]] <= a[i]) {  @@drop
      dq.pop();                                 @@drop
    }
    dq.push(i);                                 @@push
    if (i >= k - 1) {                           @@record
      out.push(a[dq[0]]);                       @@record
    }
  }
  return out;                                   @@done
}
`,
  },
  makeInput: (size) => ({ values: randomArray(size), k: Math.min(size, 3 + Math.floor(Math.random() * 3)) }),
  solve: ({ values, k }) => Array.from({ length: values.length - k! + 1 }, (_, s) => Math.max(...values.slice(s, s + k!))),
  run({ values, k }) {
    const w = k!;
    const t = new ScanTracer(values);
    const dq: number[] = [];
    const out: number[] = [];
    t.aux = { title: "Deque", indices: dq };
    const view = (i: number, marks: ScanFrame["marks"]) => {
      const inDeque: ScanFrame["marks"] = {};
      for (const d of dq) inDeque[d] = "pivot";
      return { marks: { ...inDeque, ...marks }, pointers: { i }, bands: [{ from: Math.max(0, i - w + 1), to: i }], vars: { i, k: w } };
    };

    t.step("init", `Slide a window of ${w} values across the array. The deque keeps indices whose values decrease from front to back.`, { vars: { k: w } });
    for (let i = 0; i < values.length; i++) {
      if (dq.length && dq[0] <= i - w) {
        const gone = dq.shift()!;
        t.step("evict", `Index ${gone} has left the window A[${i - w + 1}..${i}], so drop it from the front.`, view(i, { [gone]: "swap", [i]: "compare" }));
      }
      while (dq.length && values[dq[dq.length - 1]] <= values[i]) {
        const j = dq.pop()!;
        t.step("drop", `A[${j}] = ${values[j]} ≤ A[${i}] = ${values[i]}, so ${values[j]} can never be a window maximum again. Pop it from the back.`, view(i, { [j]: "swap", [i]: "compare" }));
      }
      dq.push(i);
      t.step("push", `Push index ${i} (value ${values[i]}) onto the back.`, view(i, { [i]: "compare" }));
      if (i >= w - 1) {
        const max = values[dq[0]];
        out.push(max);
        t.labels[i] = String(max);
        t.step("record", `The front of the deque holds the maximum of A[${i - w + 1}..${i}], which is ${max}.`, view(i, { [dq[0]]: "found" }));
      }
    }
    t.answer = out;
    t.step("done", `Every window has its maximum. Return all ${out.length} of them.`, { marks: {}, vars: { k: w } });
    return t.frames;
  },
};
