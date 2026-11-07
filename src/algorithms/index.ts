import type { Algorithm } from "../core/types";
import { bubbleSort } from "./sorting/bubble";
import { insertionSort } from "./sorting/insertion";
import { selectionSort } from "./sorting/selection";
import { mergeSort } from "./sorting/merge";
import { quickSort } from "./sorting/quick";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { floydWarshall } from "./graph/floyd-warshall";
import { lcs } from "./dp/lcs";
import { editDistance } from "./dp/edit-distance";
import { knapsack } from "./dp/knapsack";
import { coinChange } from "./dp/coin-change";
import { lis } from "./dp/lis";

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
  floydWarshall,
  lcs,
  editDistance,
  knapsack,
  coinChange,
  lis,
];

export const findAlgorithm = (id: string) => ALGORITHMS.find((a) => a.id === id);
