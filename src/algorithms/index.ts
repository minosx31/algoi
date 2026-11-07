import type { Algorithm } from "../core/types";
import { bubbleSort } from "./sorting/bubble";
import { insertionSort } from "./sorting/insertion";
import { selectionSort } from "./sorting/selection";
import { mergeSort } from "./sorting/merge";
import { quickSort } from "./sorting/quick";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { binarySearch } from "./arrays/binary-search";
import { twoSumSorted } from "./arrays/two-sum-sorted";
import { slidingWindowMax } from "./arrays/sliding-window-max";
import { kadane } from "./arrays/kadane";
import { nextGreater } from "./arrays/next-greater";
import { quickselect } from "./arrays/quickselect";
import { largestRectangle } from "./arrays/largest-rectangle";
import { trappingRainWater } from "./arrays/trapping-rain-water";
import { minWindowSum } from "./arrays/min-window-sum";
import { majorityVote } from "./arrays/majority-vote";

/** Every algorithm the app knows about. Add a new one by appending it here. */
export const ALGORITHMS: Algorithm[] = [
  bubbleSort,
  insertionSort,
  selectionSort,
  mergeSort,
  quickSort,
  bfs,
  dfs,
  dijkstra,
  binarySearch,
  twoSumSorted,
  slidingWindowMax,
  kadane,
  nextGreater,
  quickselect,
  largestRectangle,
  trappingRainWater,
  minWindowSum,
  majorityVote,
];

export const findAlgorithm = (id: string) => ALGORITHMS.find((a) => a.id === id);
