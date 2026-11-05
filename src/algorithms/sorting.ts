export type SortingStep =
    | { type: 'compare'; indices: [number, number] }
    | { type: 'swap'; indices: [number, number] }
    | { type: 'sorted'; index: number }; // Mark index as sorted

export const getBubbleSortAnimations = (array: number[]): SortingStep[] => {
    const animations: SortingStep[] = [];
    const auxArray = array.slice();
    const n = auxArray.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            // Compare elements
            animations.push({ type: 'compare', indices: [j, j + 1] });

            if (auxArray[j] > auxArray[j + 1]) {
                // Swap elements
                animations.push({ type: 'swap', indices: [j, j + 1] });
                [auxArray[j], auxArray[j + 1]] = [auxArray[j + 1], auxArray[j]];
            }
        }
        // Mark last element as sorted
        animations.push({ type: 'sorted', index: n - i - 1 });
    }
    // Mark the first element as sorted (loop doesn't reach it)
    animations.push({ type: 'sorted', index: 0 });

    return animations;
};
