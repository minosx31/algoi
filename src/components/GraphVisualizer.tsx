import { useState, useRef, useEffect } from 'react';
import { Node } from './Node';
import { getBFSAnimations } from '../algorithms/graph';

const ROWS = 15;
const COLS = 25;
const START_NODE: [number, number] = [7, 5];
const END_NODE: [number, number] = [7, 19];

interface GridNodeState {
  isWall: boolean;
  isVisited: boolean;
  isPath: boolean;
}

export const GraphVisualizer = () => {
  const [grid, setGrid] = useState<GridNodeState[][]>([]);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isMousePressed, setIsMousePressed] = useState(false);
  
  // Refs
  const stopInfo = useRef(false);

  useEffect(() => {
    resetGrid();
  }, []);

  const resetGrid = (clearWalls = true) => {
    if (isVisualizing) return;
    stopInfo.current = false;
    const newGrid: GridNodeState[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const currentRow: GridNodeState[] = [];
      for (let c = 0; c < COLS; c++) {
        currentRow.push({
          isWall: clearWalls ? false : (grid[r]?.[c]?.isWall || false),
          isVisited: false,
          isPath: false,
        });
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
  };

  const handleMouseDown = (row: number, col: number) => {
    if (isVisualizing) return;
    setIsMousePressed(true);
    toggleWall(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isMousePressed || isVisualizing) return;
    toggleWall(row, col);
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
  };

  const toggleWall = (row: number, col: number) => {
      // Don't toggle walls on start or end nodes
    if ((row === START_NODE[0] && col === START_NODE[1]) || 
        (row === END_NODE[0] && col === END_NODE[1])) return;

    setGrid(prev => {
      const newGrid = [...prev]; // shallow copy rows
      const newRow = [...newGrid[row]];
      newRow[col] = { ...newRow[col], isWall: !newRow[col].isWall };
      newGrid[row] = newRow;
      return newGrid;
    });
  };

  const visualizeBFS = async () => {
    if (isVisualizing) return;
    // Clear previous paths but keep walls
    resetGrid(false);
    
    setIsVisualizing(true);
    stopInfo.current = false;

    // Convert grid state to 0/1 for algorithm (0 empty, 1 wall)
    const algGrid = grid.map(row => row.map(node => node.isWall ? 1 : 0));
    const steps = getBFSAnimations(algGrid, START_NODE, END_NODE);

    for (let i = 0; i < steps.length; i++) {
        if (stopInfo.current) break;
        const step = steps[i];
        
        // Delay
        const delay = step.type === 'visit' ? 10 : 30; // Path is slower
        await new Promise(resolve => setTimeout(resolve, delay));

        setGrid(prev => {
            const newGrid = [...prev];
            const newRow = [...newGrid[step.row]];
            if (step.type === 'visit') {
                 newRow[step.col] = { ...newRow[step.col], isVisited: true };
            } else if (step.type === 'path') {
                newRow[step.col] = { ...newRow[step.col], isPath: true };
            }
            newGrid[step.row] = newRow;
            return newGrid;
        });
    }
    setIsVisualizing(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* Controls */}
       <div style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          background: 'hsl(var(--bg-tertiary))',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-md)',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center'
      }}>
         <button 
            onClick={() => resetGrid(true)} 
            disabled={isVisualizing}
            style={{ 
                padding: '0.5rem 1rem', 
                background: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                border: '1px solid hsl(var(--bg-tertiary))',
                borderRadius: 'var(--radius-sm)',
                opacity: isVisualizing ? 0.5 : 1
            }}
        >
            Clear Board
        </button>
         <button 
            onClick={() => resetGrid(false)} 
            disabled={isVisualizing}
            style={{ 
                padding: '0.5rem 1rem', 
                background: 'hsl(var(--bg-tertiary))',
                color: 'hsl(var(--text-secondary))',
                border: '1px solid hsl(var(--bg-tertiary))',
                borderRadius: 'var(--radius-sm)',
                opacity: isVisualizing ? 0.5 : 1
            }}
        >
            Clear Path
        </button>

        <button 
            onClick={visualizeBFS}
            disabled={isVisualizing}
            style={{ 
                padding: '0.5rem 1rem', 
                background: 'hsl(var(--color-primary))',
                color: 'white',
                borderRadius: 'var(--radius-sm)',
                opacity: isVisualizing ? 0.5 : 1,
                fontWeight: 'bold',
                marginLeft: 'var(--spacing-md)'
            }}
        >
            Visualize BFS
        </button>
      </div>

       <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            overflowX: 'auto',
            padding: 'var(--spacing-md)',
            background: 'hsl(var(--bg-secondary))',
            borderRadius: 'var(--radius-lg)'
        }}>
         <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 25px)`, gap: '1px', background: 'hsl(var(--bg-tertiary))', padding: '1px' }}>
            {grid.map((row, rowIdx) => (
                row.map((node, colIdx) => (
                    <Node
                        key={`${rowIdx}-${colIdx}`}
                        isStart={rowIdx === START_NODE[0] && colIdx === START_NODE[1]}
                        isEnd={rowIdx === END_NODE[0] && colIdx === END_NODE[1]}
                        isWall={node.isWall}
                        isVisited={node.isVisited}
                        isPath={node.isPath}
                        onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                        onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                        onMouseUp={handleMouseUp}
                    />
                ))
            ))}
         </div>
       </div>
       <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', marginTop: 'var(--spacing-sm)' }}>
            Click and drag to draw walls.
       </p>
    </div>
  );
};
