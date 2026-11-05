import { useState, useEffect, useRef } from 'react';
import { generateRandomArray } from '../utils/random';
import { ALGORITHMS } from '../algorithms/types';
import { Bar } from './Bar';
// Simple UUID generator for keys
const uuid = () => Math.random().toString(36).substring(2, 9);

interface ArrayItem {
  id: string;
  value: number;
  state: 'default' | 'compare' | 'swap' | 'sorted';
}

export const SortingVisualizer = () => {
  const [array, setArray] = useState<ArrayItem[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [arraySize, setArraySize] = useState(15);
  const [selectedAlgoKey, setSelectedAlgoKey] = useState<string>('bubble');
  
  // Refs to control the sorting loop
  const stopSorting = useRef(false);

  const selectedAlgo = ALGORITHMS[selectedAlgoKey];

  // Initialize array
  useEffect(() => {
    resetArray();
  }, [arraySize]);

  const resetArray = () => {
    if (isSorting) return;
    const values = generateRandomArray(arraySize, 10, 100);
    const newArray = values.map(val => ({
      id: uuid(),
      value: val,
      state: 'default' as const
    }));
    setArray(newArray);
  };

  const runSorting = async () => {
    setIsSorting(true);
    stopSorting.current = false;

    // Helper to get raw numbers for algorithm
    const rawArray = array.map(item => item.value);
    const steps = selectedAlgo.getAnimations(rawArray);

    for (let i = 0; i < steps.length; i++) {
      if (stopSorting.current) break;

      const step = steps[i];
      
      // Delay based on speed (inverted: higher speed = lower delay)
      // Speed 1-100 -> Delay 500ms - 10ms
      const delay = Math.max(10, 500 - (speed * 4.5));
      await new Promise(resolve => setTimeout(resolve, delay));

      setArray(prev => {
        const newArray = [...prev];
        
        // Reset previous states
        newArray.forEach(item => {
          if (item.state !== 'sorted') item.state = 'default';
        });

        if (step.type === 'compare') {
          const [idx1, idx2] = step.indices;
          newArray[idx1].state = 'compare';
          newArray[idx2].state = 'compare';
        } else if (step.type === 'swap') {
            const [idx1, idx2] = step.indices;
            newArray[idx1].state = 'swap';
            newArray[idx2].state = 'swap';
            // Perform swap
            [newArray[idx1], newArray[idx2]] = [newArray[idx2], newArray[idx1]];
        } else if (step.type === 'sorted') {
           newArray[step.index].state = 'sorted';
        }

        return newArray;
      });
    }

    setIsSorting(false);
    // Ensure all sorted
    if (!stopSorting.current) {
        setArray(prev => prev.map(item => ({ ...item, state: 'sorted' })));
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Controls */}
      <div style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          background: 'hsl(var(--bg-tertiary))',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-md)',
          flexWrap: 'wrap',
          alignItems: 'center'
      }}>
        <button 
            onClick={resetArray} 
            disabled={isSorting}
            style={{ 
                padding: '0.5rem 1rem', 
                background: 'hsl(var(--color-primary))',
                color: 'white',
                borderRadius: 'var(--radius-sm)',
                opacity: isSorting ? 0.5 : 1
            }}
        >
            Generate New Array
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label>Size</label>
            <input 
                type="range" 
                min="5" 
                max="50" 
                value={arraySize} 
                onChange={(e) => setArraySize(Number(e.target.value))}
                disabled={isSorting}
            />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label>Speed</label>
            <input 
                type="range" 
                min="1" 
                max="100" 
                value={speed} 
                onChange={(e) => setSpeed(Number(e.target.value))}
                disabled={isSorting}
            />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <select
                value={selectedAlgoKey}
                onChange={(e) => setSelectedAlgoKey(e.target.value)}
                disabled={isSorting}
                style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'hsl(var(--bg-secondary))',
                    color: 'hsl(var(--text-primary))',
                    border: '1px solid hsl(var(--bg-tertiary))'
                }}
            >
                {Object.values(ALGORITHMS).map(algo => (
                    <option key={algo.value} value={algo.value}>{algo.name}</option>
                ))}
            </select>

            <button 
                onClick={runSorting}
                disabled={isSorting}
                style={{ 
                    padding: '0.5rem 1rem', 
                    background: 'hsl(var(--color-accent))',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    opacity: isSorting ? 0.5 : 1
                }}
            >
                Sort
            </button>
        </div>
      </div>

       {/* Info Panel */}
       <div style={{
          marginBottom: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          background: 'hsl(var(--bg-secondary))',
          borderRadius: 'var(--radius-md)',
          borderLeft: '4px solid hsl(var(--color-accent))'
       }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-xs)' }}>{selectedAlgo.name}</h3>
          <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: 'var(--spacing-sm)' }}>
            {selectedAlgo.description}
          </p>
          <div style={{ 
              background: 'hsl(var(--bg-tertiary))', 
              padding: '0.5rem', 
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.9rem'
          }}>
              <span style={{ color: 'hsl(var(--color-accent))', fontWeight: 'bold' }}>Invariant: </span>
              {selectedAlgo.invariant}
          </div>
       </div>

      {/* Visualizer Area */}
      <div style={{
          height: '400px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '2px', // tiny gap handled by margins in Bar usually, but flex gap helpful
          padding: 'var(--spacing-lg)',
          background: 'hsl(var(--bg-secondary))',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
      }}>
        {array.map((item) => (
          <Bar 
            key={item.id} 
            value={item.value} 
            max={100} 
            state={item.state} 
          />
        ))}
      </div>
    </div>
  );
};
