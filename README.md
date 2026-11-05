# Algorithm Visualizer - Technical Overview

This project is a React-based interactive visualizer for sorting and graph algorithms, designed with a focus on education and premium aesthetics.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS with CSS Custom Properties (Variables)
- **Animation**: Framer Motion & CSS Transitions
- **Package Manager**: Bun

## Implementation Details

### Animation Logic
The core challenge in algorithm visualization is synchronizing the synchronous algorithm execution with the asynchronous visual updates.

**Our Approach:**
1.  **Detach Algorithm from View**: The algorithm logic (e.g., `bubbleSort`) does not directly manipulate the DOM or React state. Instead, it runs on a copy of the data and returns a list of **steps** or **animations**.
    *   Example Step: `{ type: 'swap', indices: [1, 2] }`
2.  **Animation Loop**: The React component (`SortingVisualizer`) iterates through these steps.
    *   For each step, it awaits a `Promise` that resolves after a delay (controlled by the speed slider).
    *   It then updates the React state to reflect that single step (e.g., swapping elements, changing colors).
3.  **Framer Motion**: We use `framer-motion`'s `layout` prop on the Bar components. This allows React to simply reorder the DOM elements, and Framer Motion automatically calculates the transforms to animate them smoothly from their old position to their new position.

### Project Structure
- `src/algorithms/`: Pure TypeScript implementations of algorithms returning animation steps.
- `src/components/`: React components for the UI.
    - `SortingVisualizer.tsx`: Manages state playback for sorting.
    - `GraphVisualizer.tsx`: Manages grid state and BFS plotting.
- `src/styles/`: Global CSS variables for the dark theme.

## Extensibility
New sorting algorithms can be added by implementing the `SortingAlgorithm` interface in `src/algorithms/types.ts` and adding them to the `ALGORITHMS` objects. The visualizer will automatically pick them up and display them in the dropdown.
