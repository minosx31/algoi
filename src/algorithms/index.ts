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
import { kahn } from "./graph/kahn";
import { cycleDetect } from "./graph/cycle-detect";
import { tarjanScc } from "./graph/tarjan-scc";
import { edmondsKarp } from "./graph/edmonds-karp";
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
import { floydWarshall } from "./graph/floyd-warshall";
import { lcs } from "./dp/lcs";
import { editDistance } from "./dp/edit-distance";
import { knapsack } from "./dp/knapsack";
import { coinChange } from "./dp/coin-change";
import { lis } from "./dp/lis";
import { nQueens } from "./backtracking/n-queens";
import { sudoku } from "./backtracking/sudoku";
import { wordSearch } from "./backtracking/word-search";
import { islands } from "./grids/islands";
import { gridShortestPath } from "./grids/grid-shortest-path";
import { uniquePaths } from "./grids/unique-paths";
import { bst } from "./trees/bst";
import { treeTraversals } from "./trees/traversals";
import { binaryHeap } from "./trees/binary-heap";
import { avl } from "./trees/avl";
import { trie } from "./trees/trie";
import { segmentTree } from "./trees/segment-tree";
import { fenwick } from "./trees/fenwick";
import { huffman } from "./trees/huffman";
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
  kahn,
  cycleDetect,
  tarjanScc,
  edmondsKarp,
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
  floydWarshall,
  lcs,
  editDistance,
  knapsack,
  coinChange,
  lis,
  nQueens,
  sudoku,
  wordSearch,
  islands,
  gridShortestPath,
  uniquePaths,
  bst,
  treeTraversals,
  binaryHeap,
  avl,
  trie,
  segmentTree,
  fenwick,
  huffman,
  naiveSearch,
  kmp,
  rabinKarp,
  zFunction,
  horspool,
];

export const findAlgorithm = (id: string) => ALGORITHMS.find((a) => a.id === id);
