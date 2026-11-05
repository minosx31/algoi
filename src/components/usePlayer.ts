import { useEffect, useReducer } from "react";

type State = { index: number; playing: boolean; last: number };
type Action =
  | { type: "toggle" }
  | { type: "pause" }
  | { type: "step"; delta: number }
  | { type: "seek"; index: number }
  | { type: "tick" };

function reducer(s: State, a: Action): State {
  const clamp = (i: number) => Math.max(0, Math.min(s.last, i));
  switch (a.type) {
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

export function usePlayer(frameCount: number, delayMs: number) {
  const [state, dispatch] = useReducer(reducer, { index: 0, playing: false, last: Math.max(0, frameCount - 1) });

  useEffect(() => {
    if (!state.playing) return;
    const id = setInterval(() => dispatch({ type: "tick" }), delayMs);
    return () => clearInterval(id);
  }, [state.playing, delayMs]);

  return { ...state, dispatch };
}
