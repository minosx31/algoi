import type { SortingStep } from "../algorithms/sorting";
import { getBubbleSortAnimations } from './sorting';

export interface SortingAlgorithm {
    name: string;
    value: string;
    getAnimations: (array: number[]) => SortingStep[];
    description: string;
    invariant: string;
}

export type { SortingStep };

export const ALGORITHMS: Record<string, SortingAlgorithm> = {
    bubble: {
        name: 'Bubble Sort',
        value: 'bubble',
        getAnimations: getBubbleSortAnimations,
        description: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
        invariant: 'After i iterations, the i largest elements are in their final sorted positions at the end of the array.'
    },
    // Placeholder for Quick Sort
    // quick: { ... }
};
