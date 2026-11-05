# algoi!

*algorithms, but すごい (sugoi).*


Step through sorting and graph algorithms while the matching line of code lights up in Pseudocode, Python, C++, Java, or JavaScript.

```sh
bun install
bun run dev      # http://localhost:5173
bun run test     # trace correctness + every language has every traced line
bun run verify   # builds, then drives every algorithm in headless Chromium
```

`verify` needs a Playwright browser once: `bunx playwright install chromium-headless-shell`.

## How it works

An algorithm is one object in `src/algorithms/index.ts`. Its `run` executes the real algorithm against a tracer (`src/core/trace.ts`) that records a full snapshot frame at each interesting moment. Each frame carries a `line` label, a one-sentence `note`, and the variables in scope. The UI only plays frames back, so stepping backwards and scrubbing are free.

Code listings are plain strings per language. A line ending in `@@label` is tagged with that label, and the tag is stripped before display. A frame whose `line` is `compare` highlights the `compare`-tagged line(s) in whichever language is selected. That is the only coupling between a trace and its listings.

## Adding an algorithm

1. Copy the closest existing file (`src/algorithms/sorting/bubble.ts` or `src/algorithms/graph/bfs.ts`).
2. Write the five listings, tagging lines with `@@label`.
3. Drive the tracer in `run`, calling `t.step(label, note, ...)`.
4. Append it to `ALGORITHMS` in `src/algorithms/index.ts`.
5. `bun run test` fails if any traced label is missing from any language, or if the result is wrong.

A new kind of visual (trees, DP tables, grids) means a new frame type in `src/core/types.ts`, a variant in the `Algorithm` union, and a view component next to `ArrayView` and `GraphView`. A new language means one entry in `LANGUAGES` plus a listing in every algorithm; the test enforces the second part.
