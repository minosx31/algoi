import type { Algorithm } from "../core/types";
import { bubbleSort } from "./sorting/bubble";
import { insertionSort } from "./sorting/insertion";
import { selectionSort } from "./sorting/selection";
import { mergeSort } from "./sorting/merge";
import { quickSort } from "./sorting/quick";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { lruCache } from "./systems/lru-cache";
import { bloomFilter } from "./systems/bloom-filter";
import { hashTable } from "./systems/hash-table";
import { tokenBucket } from "./systems/token-bucket";
import { consistentHashing } from "./systems/consistent-hashing";

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
  lruCache,
  bloomFilter,
  hashTable,
  tokenBucket,
  consistentHashing,
];

export const findAlgorithm = (id: string) => ALGORITHMS.find((a) => a.id === id);
