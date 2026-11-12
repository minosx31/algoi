import { ALGORITHMS } from "../src/algorithms";
import { viewOf } from "../src/core/views";

const RUNS = 20;

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

for (const algo of ALGORITHMS) {
  Math.random = mulberry32(hash(algo.id));
  const view = viewOf(algo);
  const input = view.largestInput(algo);
  const times: number[] = [];
  let frames = 0;
  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    frames = view.run(algo, input).length;
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const medianMs = +((times[RUNS / 2 - 1] + times[RUNS / 2]) / 2).toFixed(4);
  console.log(JSON.stringify({ id: algo.id, frames, medianMs }));
}
