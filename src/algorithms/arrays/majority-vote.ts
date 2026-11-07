import { ScanTracer } from "../../core/trace";
import type { ScanAlgorithm, ScanFrame } from "../../core/types";

export const majorityVote: ScanAlgorithm = {
  id: "majority-vote",
  name: "Boyer-Moore Majority Vote",
  kind: "scan",
  topic: "arrays",
  pointers: ["i"],
  about: {
    summary: "Finds the value that fills more than half of an array in one pass and O(1) space by cancelling each value against a different one; a true majority outnumbers everything else and survives, and a second pass confirms it.",
    invariants: [
      "count is the number of unmatched copies of candidate in the part scanned so far; everything else has been cancelled in pairs of different values.",
      "A value with more than n / 2 copies cannot be fully cancelled, so if a majority exists it is the final candidate.",
      "The final candidate is only a suspect: without a majority it is arbitrary, so it must be counted.",
    ],
    useCases: [
      "Majority element in a stream or log when memory is tight.",
      "Distributed voting and replica agreement, where a value needs more than half the votes.",
      "The Misra-Gries heavy-hitters summary generalises it to values above n / k.",
    ],
  },
  complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
  code: {
    pseudo: `
procedure majority(A)
  candidate ← none; count ← 0                   @@init
  for each x in A do
    if count = 0 then                           @@adopt
      candidate ← x                             @@adopt
    if x = candidate then                       @@match
      count ← count + 1                         @@match
    else                                        @@differ
      count ← count − 1                         @@differ
  total ← number of x in A equal to candidate   @@verify
  if total > length(A) / 2 then return candidate  @@done
  return −1                                     @@done
`,
    python: `
def majority(a):
    candidate, count = None, 0                  @@init
    for x in a:
        if count == 0:                          @@adopt
            candidate = x                       @@adopt
        if x == candidate:                      @@match
            count += 1                          @@match
        else:                                   @@differ
            count -= 1                          @@differ
    total = a.count(candidate)                  @@verify
    return candidate if total > len(a) // 2 else -1  @@done
`,
    cpp: `
int majority(const std::vector<int>& a) {
    int candidate = 0, count = 0;               @@init
    for (int x : a) {
        if (count == 0) {                       @@adopt
            candidate = x;                      @@adopt
        }
        if (x == candidate) {                   @@match
            count++;                            @@match
        } else {                                @@differ
            count--;                            @@differ
        }
    }
    int total = (int)std::count(a.begin(), a.end(), candidate);  @@verify
    return total > (int)a.size() / 2 ? candidate : -1;  @@done
}
`,
    java: `
static int majority(int[] a) {
    int candidate = 0, count = 0;               @@init
    for (int x : a) {
        if (count == 0) {                       @@adopt
            candidate = x;                      @@adopt
        }
        if (x == candidate) {                   @@match
            count++;                            @@match
        } else {                                @@differ
            count--;                            @@differ
        }
    }
    int total = 0;                              @@verify
    for (int x : a) if (x == candidate) total++;  @@verify
    return total > a.length / 2 ? candidate : -1;  @@done
}
`,
    javascript: `
function majority(a) {
  let candidate = null, count = 0;              @@init
  for (const x of a) {
    if (count === 0) {                          @@adopt
      candidate = x;                            @@adopt
    }
    if (x === candidate) {                      @@match
      count++;                                  @@match
    } else {                                    @@differ
      count--;                                  @@differ
    }
  }
  const total = a.filter((x) => x === candidate).length;  @@verify
  return total > a.length / 2 ? candidate : -1;  @@done
}
`,
  },
  makeInput(size) {
    const major = 20 + Math.floor(Math.random() * 70);
    // Most inputs have a bare majority, and the rest stop exactly at half, so the verify pass has something to refuse.
    const copies = Math.floor(size / 2) + (size < 2 || Math.random() < 0.92 ? 1 : 0);
    const values = Array.from({ length: size }, (_, i) => {
      if (i < copies) return major;
      let v = major;
      while (v === major) v = 5 + Math.floor(Math.random() * 95);
      return v;
    });
    for (let i = size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return { values };
  },
  solve({ values }) {
    const counts = new Map<number, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts].find(([, c]) => c * 2 > values.length)?.[0] ?? -1;
  },
  run({ values }) {
    const t = new ScanTracer(values);
    const n = values.length;
    const unmatched: number[] = [];
    const cancelled: ScanFrame["marks"] = {};
    let candidate = 0;
    let count = 0;

    const view = (i: number, marks: ScanFrame["marks"] = {}) => {
      const held: ScanFrame["marks"] = {};
      for (const k of unmatched) held[k] = "pivot";
      return { marks: { ...cancelled, ...held, ...marks }, pointers: { i }, vars: { i, candidate, count } };
    };

    t.step("init", "Scan once with a candidate and a count. Each value that differs from the candidate cancels one copy of it.", { vars: { candidate: "none", count } });
    for (let i = 0; i < n; i++) {
      const x = values[i];
      if (count === 0) {
        candidate = x;
        t.step("adopt", `The count is 0, so adopt ${x} as the candidate.`, view(i, { [i]: "compare" }));
      }
      if (x === candidate) {
        unmatched.push(i);
        count++;
        t.step("match", `A[${i}] = ${x} equals the candidate ${candidate}, so the count rises to ${count}.`, view(i, { [i]: "compare" }));
      } else {
        const partner = unmatched.pop()!;
        count--;
        t.step("differ", `A[${i}] = ${x} differs from the candidate ${candidate}, so it cancels the copy at index ${partner}. The count falls to ${count}.`, view(i, { [i]: "swap", [partner]: "swap" }));
        cancelled[i] = cancelled[partner] = "muted";
      }
    }
    const matches: ScanFrame["marks"] = {};
    values.forEach((v, i) => v === candidate && (matches[i] = "found"));
    const total = Object.keys(matches).length;
    const wins = total * 2 > n;
    t.step(
      "verify",
      wins ? `Count the candidate ${candidate} over the whole array: it appears ${total} times, more than half of ${n}.` : `Count the candidate ${candidate} over the whole array: it appears ${total} times, not more than half of ${n}.`,
      { marks: matches, vars: { candidate, total, n } },
    );
    t.answer = wins ? candidate : -1;
    t.step("done", wins ? `${candidate} appears ${total} of ${n} times, so it is the majority. Return ${candidate}.` : `The candidate ${candidate} appears only ${total} of ${n} times, so there is no majority. Return -1.`, { marks: wins ? matches : {}, vars: { candidate, total, n } });
    return t.frames;
  },
};
