export type GridStep =
    | { type: 'visit'; row: number; col: number }
    | { type: 'path'; row: number; col: number };

type Point = [number, number];

export const getBFSAnimations = (
    grid: number[][], // 0: empty, 1: wall
    startNode: Point,
    endNode: Point
): GridStep[] => {
    const steps: GridStep[] = [];
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const previous = Array.from({ length: rows }, () => Array(cols).fill(null) as (Point | null)[]);

    const queue: Point[] = [startNode];
    visited[startNode[0]][startNode[1]] = true;

    let found = false;

    const dr = [-1, 1, 0, 0];
    const dc = [0, 0, -1, 1];

    while (queue.length > 0) {
        const [r, c] = queue.shift()!;

        if (r === endNode[0] && c === endNode[1]) {
            found = true;
            break;
        }

        if (!(r === startNode[0] && c === startNode[1])) {
            steps.push({ type: 'visit', row: r, col: c });
        }

        for (let i = 0; i < 4; i++) {
            const nr = r + dr[i];
            const nc = c + dc[i];

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] !== 1) {
                visited[nr][nc] = true;
                previous[nr][nc] = [r, c];
                queue.push([nr, nc]);
            }
        }
    }

    if (found) {
        let curr: Point | null = previous[endNode[0]][endNode[1]];
        const path: Point[] = [];
        while (curr && !(curr[0] === startNode[0] && curr[1] === startNode[1])) {
            path.push(curr);
            curr = previous[curr[0]][curr[1]];
        }
        // Reverse to animate from start to end
        for (let i = path.length - 1; i >= 0; i--) {
            steps.push({ type: 'path', row: path[i][0], col: path[i][1] });
        }
        // steps.push({ type: 'path', row: endNode[0], col: endNode[1] }); // Optional: animate end node
    }

    return steps;
};
