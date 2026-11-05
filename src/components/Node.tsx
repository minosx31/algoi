interface NodeProps {
  isStart: boolean;
  isEnd: boolean;
  isWall: boolean;
  isVisited: boolean;
  isPath: boolean;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  onMouseUp: () => void;
}

export const Node = ({
  isStart,
  isEnd,
  isWall,
  isVisited,
  isPath,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
}: NodeProps) => {
  const getBackgroundColor = () => {
    if (isStart) return 'hsl(var(--color-success))';
    if (isEnd) return 'hsl(var(--color-error))';
    if (isWall) return 'hsl(var(--text-muted))';
    if (isPath) return 'hsl(var(--color-accent))';
    if (isVisited) return 'hsl(var(--color-primary))';
    return 'transparent';
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      style={{
        width: '25px',
        height: '25px',
        border: '1px solid hsl(var(--bg-tertiary))',
        backgroundColor: getBackgroundColor(),
        transition: isWall ? 'transform 0.1s ease-in-out' : 'all 0.2s ease-out',
        transform: isVisited || isPath ? 'scale(1)' : 'scale(1)', // Can add pulse here
        borderRadius: isStart || isEnd ? '50%' : '2px',
        cursor: isStart || isEnd ? 'move' : 'pointer',
      }}
      className={isVisited ? 'node-visited' : ''}
    />
  );
};
