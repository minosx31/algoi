import { ScanTracer } from "../../core/trace";
import { randomArray } from "../../core/inputs";
import type { ScanAlgorithm, ScanFrame } from "../../core/types";

export const nextGreater: ScanAlgorithm = {
  id: "next-greater",
  name: "Next Greater Element",
  kind: "scan",
  topic: "arrays",
  pointers: ["i"],
  legend: [
    ["compare", "Current"],
    ["pivot", "Waiting on the stack"],
    ["swap", "Popped"],
  ],
  labelTitle: "next greater value per index",
  about: {
    summary: "Finds, for every value, the first larger value to its right by scanning once with a stack of indices still waiting for an answer; each new value answers every smaller value on top of the stack.",
    invariants: [
      "Values on the stack never increase from bottom to top.",
      "An index leaves the stack exactly when its next greater value arrives.",
      "Each index is pushed once and popped at most once, so the scan is O(n).",
    ],
    useCases: [
      "Daily temperatures and stock span: how long until a higher value.",
      "The monotonic stack behind largest rectangle in a histogram and trapping rain water.",
      "The next larger price, version, or timestamp in a sequence.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)" },
  code: {
    pseudo: `
procedure nextGreater(A)
  out ← array of length(A), filled with −1        @@init
  S ← empty stack of indices                      @@init
  for i ← 0 to length(A) − 1 do
    while S not empty and A[top of S] < A[i] do   @@pop
      j ← pop S                                   @@pop
      out[j] ← A[i]                               @@pop
    push i onto S                                 @@push
  indices left on S keep −1                       @@done
  return out                                      @@done
`,
    python: `
def next_greater(a):
    out = [-1] * len(a)                         @@init
    stack = []                                  @@init
    for i in range(len(a)):
        while stack and a[stack[-1]] < a[i]:    @@pop
            j = stack.pop()                     @@pop
            out[j] = a[i]                       @@pop
        stack.append(i)                         @@push
    # indices left on the stack keep -1         @@done
    return out                                  @@done
`,
    cpp: `
std::vector<int> nextGreater(const std::vector<int>& a) {
    std::vector<int> out(a.size(), -1);                     @@init
    std::vector<int> stack;                                 @@init
    for (int i = 0; i < (int)a.size(); i++) {
        while (!stack.empty() && a[stack.back()] < a[i]) {  @@pop
            int j = stack.back();                           @@pop
            stack.pop_back();                               @@pop
            out[j] = a[i];                                  @@pop
        }
        stack.push_back(i);                                 @@push
    }
    // indices left on the stack keep -1                    @@done
    return out;                                             @@done
}
`,
    java: `
static int[] nextGreater(int[] a) {
    int[] out = new int[a.length];                          @@init
    Arrays.fill(out, -1);                                   @@init
    Deque<Integer> stack = new ArrayDeque<>();              @@init
    for (int i = 0; i < a.length; i++) {
        while (!stack.isEmpty() && a[stack.peek()] < a[i]) {  @@pop
            int j = stack.pop();                            @@pop
            out[j] = a[i];                                  @@pop
        }
        stack.push(i);                                      @@push
    }
    // indices left on the stack keep -1                    @@done
    return out;                                             @@done
}
`,
    javascript: `
function nextGreater(a) {
  const out = new Array(a.length).fill(-1);                 @@init
  const stack = [];                                         @@init
  for (let i = 0; i < a.length; i++) {
    while (stack.length && a[stack[stack.length - 1]] < a[i]) {  @@pop
      const j = stack.pop();                                @@pop
      out[j] = a[i];                                        @@pop
    }
    stack.push(i);                                          @@push
  }
  // indices left on the stack keep -1                      @@done
  return out;                                               @@done
}
`,
  },
  makeInput: (size) => ({ values: randomArray(size) }),
  solve: ({ values }) => values.map((v, i) => values.slice(i + 1).find((w) => w > v) ?? -1),
  run({ values }) {
    const t = new ScanTracer(values);
    const out = values.map(() => -1);
    const stack: number[] = [];
    t.aux = { title: "Stack", indices: stack };
    const waiting = (marks: ScanFrame["marks"] = {}) => {
      const all: ScanFrame["marks"] = {};
      for (const s of stack) all[s] = "pivot";
      return { ...all, ...marks };
    };

    t.step("init", "Every answer starts as -1. The stack holds indices still waiting for a greater value.");
    for (let i = 0; i < values.length; i++) {
      while (stack.length && values[stack[stack.length - 1]] < values[i]) {
        const j = stack.pop()!;
        out[j] = values[i];
        t.labels[j] = String(out[j]);
        t.step("pop", `A[${i}] = ${values[i]} > A[${j}] = ${values[j]}, so ${values[i]} is the next greater value for index ${j}.`, {
          marks: waiting({ [j]: "swap", [i]: "compare" }),
          pointers: { i },
          vars: { i },
        });
      }
      stack.push(i);
      t.step("push", `Index ${i} (value ${values[i]}) waits on the stack for a greater value.`, {
        marks: waiting({ [i]: "compare" }),
        pointers: { i },
        vars: { i },
      });
    }
    for (const s of stack) t.labels[s] = String(out[s]);
    t.answer = out;
    t.step("done", `${stack.length} ${stack.length === 1 ? "value never sees" : "values never see"} a greater value and keep -1. Return the answers.`, { marks: waiting() });
    return t.frames;
  },
};
