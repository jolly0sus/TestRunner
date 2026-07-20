import type { Rectangle } from 'pixi.js';

export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Axis-aligned bounding-box overlap test. */
export function rectsIntersect(a: Rectangle, b: Rectangle): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Distance between a rectangle center and a point vs. a radius. */
export function rectCircleHit(
  rect: Rectangle,
  cx: number,
  cy: number,
  radius: number,
): boolean {
  const nx = clamp(cx, rect.x, rect.x + rect.width);
  const ny = clamp(cy, rect.y, rect.y + rect.height);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= radius * radius;
}
