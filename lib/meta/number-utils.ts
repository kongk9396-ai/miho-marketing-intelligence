/**
 * Meta export numbers can show up as "1,234", "₩1,234", "12.3%", or blank.
 * These coerce that into plain numbers (or null when the cell is empty).
 */
export function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const trimmed = String(value).trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "—") return null;

  const cleaned = trimmed
    .replace(/[₩$,%\s]/g, "")
    .replace(/^\((.+)\)$/, "-$1"); // accounting-style negatives: (123) -> -123

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function parseInteger(value: unknown): number {
  const num = parseNumeric(value);
  return num === null ? 0 : Math.round(num);
}

export function parseRequiredNumeric(value: unknown, fallback = 0): number {
  const num = parseNumeric(value);
  return num === null ? fallback : num;
}

/** Normalizes "2026-08-20", "2026/08/20", "08/20/2026" into "YYYY-MM-DD". */
export function parseDateString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}
