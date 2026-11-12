import { OpsTracer } from "../../core/trace";
import type { CellMark, OpsAlgorithm, OpsRow } from "../../core/types";

type TokenOp = { name: "allow"; now: number };

const CAPACITY = 4;
const RATE = 1;
const pick = (n: number) => Math.floor(Math.random() * n);

export const tokenBucket: OpsAlgorithm<TokenOp> = {
  id: "token-bucket",
  name: "Token Bucket",
  kind: "ops",
  topic: "systems",
  about: {
    summary:
      "Rate-limits requests with a bucket of tokens: tokens drip in at a fixed rate up to a capacity, each request spends one, and a request that finds the bucket empty is rejected.",
    invariants: [
      "The bucket never holds more than its capacity, so a burst is at most capacity requests.",
      "Over any window of length T, at most capacity + rate × T requests are allowed.",
      "Refill is computed lazily from the time since the last request, so an idle bucket costs nothing.",
    ],
    useCases: [
      "API gateways and services such as AWS API Gateway and Stripe throttle each client this way.",
      "Network traffic shaping in routers, where tokens are bytes rather than requests.",
      "Client-side limits that keep a crawler or SDK under a provider's quota.",
    ],
  },
  complexity: { best: "O(1)", average: "O(1)", worst: "O(1)", space: "O(1)" },
  code: {
    pseudo: `
capacity ← the largest burst allowed
rate ← tokens added per second
tokens ← capacity; last ← 0

procedure Allow(now)
  elapsed ← now − last                                   @@refill
  tokens ← min(capacity, tokens + elapsed · rate)        @@refill
  last ← now                                             @@refill
  if tokens ≥ 1 then                                     @@take
    tokens ← tokens − 1                                  @@take
    return true                                          @@take
  return false                                           @@reject
`,
    python: `
class TokenBucket:
    def __init__(self, capacity, rate):
        self.capacity, self.rate = capacity, rate  # rate = tokens added per second
        self.tokens, self.last = capacity, 0

    def allow(self, now):
        elapsed = now - self.last                                   @@refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)   @@refill
        self.last = now                                             @@refill
        if self.tokens >= 1:                                        @@take
            self.tokens -= 1                                        @@take
            return True                                             @@take
        return False                                                @@reject
`,
    cpp: `
class TokenBucket {
    double capacity, rate, tokens, last = 0;  // rate = tokens added per second
public:
    TokenBucket(double capacity, double rate) : capacity(capacity), rate(rate), tokens(capacity) {}
    bool allow(double now) {
        tokens = std::min(capacity, tokens + (now - last) * rate);  @@refill
        last = now;                                                 @@refill
        if (tokens >= 1) {                                          @@take
            tokens -= 1;                                            @@take
            return true;                                            @@take
        }
        return false;                                               @@reject
    }
};
`,
    java: `
class TokenBucket {
    final double capacity, rate;  // rate = tokens added per second
    double tokens, last = 0;
    TokenBucket(double capacity, double rate) { this.capacity = capacity; this.rate = rate; tokens = capacity; }

    boolean allow(double now) {
        tokens = Math.min(capacity, tokens + (now - last) * rate);  @@refill
        last = now;                                                 @@refill
        if (tokens >= 1) {                                          @@take
            tokens -= 1;                                            @@take
            return true;                                            @@take
        }
        return false;                                               @@reject
    }
}
`,
    javascript: `
class TokenBucket {
  constructor(capacity, rate) {
    this.capacity = capacity;
    this.rate = rate; // tokens added per second
    this.tokens = capacity;
    this.last = 0;
  }
  allow(now) {
    this.tokens = Math.min(this.capacity, this.tokens + (now - this.last) * this.rate);  @@refill
    this.last = now;                                    @@refill
    if (this.tokens >= 1) {                             @@take
      this.tokens -= 1;                                 @@take
      return true;                                      @@take
    }
    return false;                                       @@reject
  }
}
`,
  },
  makeInput(size) {
    const script: TokenOp[] = Array.from({ length: CAPACITY + 1 + pick(2) }, () => ({ name: "allow", now: 0 }));
    let now = 0;
    while (script.length < size) {
      now += pick(4);
      for (let burst = 1 + pick(3); burst > 0 && script.length < size; burst--) script.push({ name: "allow", now });
    }
    return script;
  },
  solve(script) {
    let tokens = CAPACITY;
    let last = 0;
    return script.map(({ now }) => {
      tokens = Math.min(CAPACITY, tokens + (now - last) * RATE);
      last = now;
      if (tokens < 1) return "rejected";
      tokens -= 1;
      return "allowed";
    });
  },
  run(script) {
    const t = new OpsTracer(script.map(({ now }) => `allow(t=${now})`));
    let tokens = CAPACITY;
    let last = 0;

    const rows = (marks: Partial<Record<number, CellMark>> = {}): OpsRow[] => [
      {
        title: `Tokens, capacity ${CAPACITY}, +${RATE} per second`,
        cells: Array.from({ length: CAPACITY }, (_, i) => ({ id: `t${i}`, text: i < tokens ? "●" : "", mark: marks[i] ?? (i < tokens ? undefined : "empty") })),
      },
    ];
    const range = (from: number, to: number, mark: CellMark) => Object.fromEntries(Array.from({ length: Math.max(0, to - from) }, (_, k) => [from + k, mark]));

    script.forEach(({ now }, i) => {
      t.at = i;
      const before = tokens;
      const prev = last;
      const elapsed = now - last;
      tokens = Math.min(CAPACITY, tokens + elapsed * RATE);
      last = now;
      const vars = { now, last, elapsed, tokens };
      const gained = tokens - before;
      const added = elapsed * RATE;
      const refill =
        elapsed === 0
          ? `no time has passed since last = ${prev}, so no tokens drip in and ${tokens} remain.`
          : `${elapsed} s have passed since last = ${prev}, so add ${added} token${added === 1 ? "" : "s"}${gained < added ? `, capped at ${CAPACITY},` : ""} for ${tokens} in the bucket.`;
      t.step("refill", `allow(t=${now}): ${refill} Then last = ${now}.`, rows(range(before, tokens, "new")), vars);

      if (tokens < 1) {
        t.answer("rejected");
        t.step("reject", `The bucket is empty at t=${now}, so reject the request; the next token arrives at t=${now + 1 / RATE}.`, rows(range(0, CAPACITY, "miss")), vars);
        return;
      }
      tokens -= 1;
      t.answer("allowed");
      t.step("take", `Spend one token and allow the request: ${tokens} left.`, rows({ [tokens]: "hit" }), { ...vars, tokens });
    });
    return t.frames;
  },
};
