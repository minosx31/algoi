import type { Algorithm } from "../core/types";
import { bubbleSort } from "./sorting/bubble";
import { insertionSort } from "./sorting/insertion";
import { selectionSort } from "./sorting/selection";
import { mergeSort } from "./sorting/merge";
import { quickSort } from "./sorting/quick";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { editDistance } from "./dp/edit-distance";

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
  editDistance,
];

export const findAlgorithm = (id: string) => ALGORITHMS.find((a) => a.id === id);
