import { describe, expect, it } from 'vitest';
import { polygonSelfIntersects } from './geometry';

describe('polygonSelfIntersects', () => {
  it('detects a bow-tie', () => {
    const bow = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ];
    expect(polygonSelfIntersects(bow)).toBe(true);
  });

  it('allows a square', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(polygonSelfIntersects(square)).toBe(false);
  });
});