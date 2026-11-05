import { useEffect, useReducer } from "react";

type State = { index: number; playing: boolean; last: number; source: readonly unknown[] };
type Action =
  | { type: "load"; source: readonly unknown[] }
  | { type: "toggle" }
  | { type: "pause" }
  | { type: "step"; delta: number }
  | { type: "seek"; index: number }
  | { type: "tick" };

const load = (source: readonly unknown[]): State => ({ index: 0, playing: false, last: Math.max(0, source.length - 1), source });

function reducer(s: State, a: Action): State {
  const clamp = (i: number) => Math.max(0, Math.min(s.last, i));
  switch (a.type) {
    case "load":
      return load(a.source);
    case "toggle":
      if (s.playing) return { ...s, playing: false };
      return { ...s, playing: true, index: s.index >= s.last ? 0 : s.index };
    case "pause":
      return { ...s, playing: false };
    case "step":
      return { ...s, playing: false, index: clamp(s.index + a.delta) };
    case "seek":
      return { ...s, playing: false, index: clamp(a.index) };
    case "tick":
      return s.index >= s.last ? { ...s, playing: false } : { ...s, index: s.index + 1 };
  }
}

/** Plays through `frames`, restarting at frame 0 whenever a new frames array arrives. */
export function usePlayer(frames: readonly unknown[], delayMs: number) {
  const [state, dispatch] = useReducer(reducer, frames, load);
  // Reset during render (not in an effect) so a stale index never reads past the new frames.
  const stale = state.source !== frames;
  if (stale) dispatch({ type: "load", source: frames });

  useEffect(() => {
    if (!state.playing) return;
    const id = setInterval(() => dispatch({ type: "tick" }), delayMs);
    return () => clearInterval(id);
  }, [state.playing, delayMs]);

  return stale ? { ...load(frames), dispatch } : { ...state, dispatch };
}
