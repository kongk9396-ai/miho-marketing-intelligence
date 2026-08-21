/** Relative change from `before` to `after`, as a percentage. Null when either side is unavailable or `before` is 0 (undefined percentage). */
export function computeChangePercent(before: number | null, after: number | null): number | null {
  if (before === null || after === null) return null;
  if (before === 0) return null;
  return ((after - before) / Math.abs(before)) * 100;
}
