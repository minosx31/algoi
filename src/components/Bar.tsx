import { motion } from 'framer-motion';

interface BarProps {
  value: number;
  max: number;
  state: 'compare' | 'swap' | 'sorted' | 'default';
}

export const Bar = ({ value, max, state }: BarProps) => {
  const height = `${(value / max) * 100}%`;

  const getBackgroundColor = () => {
    switch (state) {
      case 'compare': return 'hsl(var(--color-accent))';
      case 'swap': return 'hsl(var(--color-error))';
      case 'sorted': return 'hsl(var(--color-success))';
      default: return 'hsl(var(--color-primary))';
    }
  };

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        height,
        flex: 1,
        backgroundColor: getBackgroundColor(),
        borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
        margin: '0 1px',
        maxWidth: '40px',
        minWidth: '4px'
      }}
    >
      <span style={{
        position: 'absolute',
        top: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        color: 'hsl(var(--text-secondary))',
        fontWeight: 'bold',
        opacity: 0.8
      }}>
        {value}
      </span>
    </motion.div>
  );
};
