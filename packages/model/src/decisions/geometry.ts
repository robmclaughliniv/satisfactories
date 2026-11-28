import type { PointCm } from '../units';

function orientation(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  const v = (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
  if (Math.abs(v) < 1e-9) return 0;
  return v > 0 ? 1 : 2;
}

function onSegment(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): boolean {
  return (
    bx <= Math.max(ax, cx) + 1e-9 &&
    bx + 1e-9 >= Math.min(ax, cx) &&
    by <= Math.max(ay, cy) + 1e-9 &&
    by + 1e-9 >= Math.min(ay, cy)
  );
}

function segmentsIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
): boolean {
  const o1 = orientation(x1, y1, x2, y2, x3, y3);
  const o2 = orientation(x1, y1, x2, y2, x4, y4);
  const o3 = orientation(x3, y3, x4, y4, x1, y1);
  const o4 = orientation(x3, y3, x4, y4, x2, y2);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(x1, y1, x3, y3, x2, y2)) return true;
  if (o2 === 0 && onSegment(x1, y1, x4, y4, x2, y2)) return true;
  if (o3 === 0 && onSegment(x3, y3, x1, y1, x4, y4)) return true;
  if (o4 === 0 && onSegment(x3, y3, x2, y2, x4, y4)) return true;
  return false;
}

/** True if a closed polygon (implicit edge from last to first) self-intersects. */
export function polygonSelfIntersects(points: PointCm[]): boolean {
  const n = points.length;
  if (n < 3) return false;
  const edges: [number, number, number, number][] = [];
  for (let i = 0; i < n; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % n];
    edges.push([a.x, a.y, b.x, b.y]);
  }
  for (let i = 0; i < edges.length; i += 1) {
    for (let j = i + 1; j < edges.length; j += 1) {
      const adjacent = j === i + 1 || (i === 0 && j === edges.length - 1) || (j === 0 && i === edges.length - 1);
      if (adjacent) continue;
      const [x1, y1, x2, y2] = edges[i];
      const [x3, y3, x4, y4] = edges[j];
      if (segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) return true;
    }
  }
  return false;
}