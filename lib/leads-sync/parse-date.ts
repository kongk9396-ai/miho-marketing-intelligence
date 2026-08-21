const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Parses a Google Sheet date/datetime cell (fetched as FORMATTED_VALUE text)
 * into an ISO instant string. Accepts "YYYY-MM-DD", "YYYY/MM/DD", "YYYY. M. D."
 * (common Korean locale formatting), each optionally followed by "HH:MM" or
 * "HH:MM:SS". A date with no time component is treated as KST midnight of
 * that day, matching how every other date-only business date in this app
 * (meta_daily.date, ga4_daily.date) is anchored to KST.
 */
export function parseSheetDateTime(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(\d{4})[.\-/]\s?(\d{1,2})[.\-/]\s?(\d{1,2})\.?(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (!match) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const [, y, mo, d, h, mi, s] = match;
  const hasTime = h !== undefined;
  const hours = hasTime ? Number(h) : 0;
  const minutes = hasTime ? Number(mi) : 0;
  const seconds = hasTime ? Number(s ?? "0") : 0;

  // Interpret the wall-clock value as Asia/Seoul time, then convert to a UTC instant.
  const kstMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), hours, minutes, seconds);
  return new Date(kstMs - KST_OFFSET_MS).toISOString();
}
