import type { Algorithm } from "../core/types";
import { bubbleSort } from "./sorting/bubble";
import { insertionSort } from "./sorting/insertion";
import { selectionSort } from "./sorting/selection";
import { mergeSort } from "./sorting/merge";
import { quickSort } from "./sorting/quick";
import { heapSort } from "./sorting/heap";
import { countingSort } from "./sorting/counting";
import { radixSort } from "./sorting/radix";
import { quickSort3 } from "./sorting/quick3";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { aStar } from "./graph/astar";
import { bellmanFord } from "./graph/bellman-ford";
import { prim } from "./graph/prim";
import { kruskal } from "./graph/kruskal";
import { bridges } from "./graph/bridges";
import { bipartite } from "./graph/bipartite";

/** Every algorithm the app knows about. Add a new one by appending it here. */
export const ALGORITHMS: Algorithm[] = [
  bubbleSort,
  insertionSort,
  selectionSort,
  mergeSort,
  quickSort,
  heapSort,
  countingSort,
  radixSort,
  quickSort3,
  bfs,
  dfs,
  dijkstra,
  aStar,
  bellmanFord,
  prim,
  kruskal,
  bridges,
  bipartite,
];

export const findAlgorithm = (id: string) => ALGORITHMS.find((a) => a.id === id);
