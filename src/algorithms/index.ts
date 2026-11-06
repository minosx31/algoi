import type { Algorithm } from "../core/types";
import { bubbleSort } from "./sorting/bubble";
import { insertionSort } from "./sorting/insertion";
import { selectionSort } from "./sorting/selection";
import { mergeSort } from "./sorting/merge";
import { quickSort } from "./sorting/quick";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { naiveSearch } from "./strings/naive";
import { kmp } from "./strings/kmp";
import { rabinKarp } from "./strings/rabin-karp";
import { zFunction } from "./strings/z-function";
import { horspool } from "./strings/horspool";

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
  naiveSearch,
  kmp,
  rabinKarp,
  zFunction,
  horspool,
];

export const findAlgorithm = (id: string) => ALGORITHMS.find((a) => a.id === id);
