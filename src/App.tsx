import { motion } from 'framer-motion';
import { useState } from 'react';
import { SortingVisualizer } from './components/SortingVisualizer';
import { GraphVisualizer } from './components/GraphVisualizer';

function App() {
  const [activeTab, setActiveTab] = useState<'sorting' | 'graph'>('sorting');

  return (
    <div className="app-container" style={{ padding: 'var(--spacing-lg)' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '2.5rem', fontWeight: 700, color: 'hsl(var(--color-primary))', marginBottom: 'var(--spacing-xs)' }}
        >
          Algorithm Visualizer
        </motion.h1>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Interactive visualization of sorting and graph algorithms.
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <TabButton 
          isActive={activeTab === 'sorting'} 
          onClick={() => setActiveTab('sorting')}
        >
          Sorting
        </TabButton>
        <TabButton 
          isActive={activeTab === 'graph'} 
          onClick={() => setActiveTab('graph')}
        >
          Graphs
        </TabButton>
      </div>

      <main style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'sorting' ? <SortingVisualizer /> : <GraphVisualizer />}
      </main>
    </div>
  );
}

const TabButton = ({ children, isActive, onClick }: { children: React.ReactNode; isActive: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: '0.5rem 1.5rem',
      borderRadius: 'var(--radius-full)',
      background: isActive ? 'hsl(var(--color-primary))' : 'transparent',
      color: isActive ? 'white' : 'hsl(var(--text-secondary))',
      border: isActive ? 'none' : '1px solid hsl(var(--bg-tertiary))',
      transition: 'all var(--transition-normal)',
      fontWeight: 500
    }}
  >
    {children}
  </button>
);

export default App;
