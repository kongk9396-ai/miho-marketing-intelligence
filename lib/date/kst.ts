const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Start of "today" in Asia/Seoul time, returned as a UTC Date/ISO instant. */
export function startOfTodayKst(now: Date = new Date()): Date {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const y = kstNow.getUTCFullYear();
  const m = kstNow.getUTCMonth();
  const d = kstNow.getUTCDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - KST_OFFSET_MS);
}

/** The Asia/Seoul calendar date (YYYY-MM-DD) a given instant falls on. */
export function toKstDateOnly(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

/** Adds (or subtracts, with a negative value) whole days to a YYYY-MM-DD date string. */
export function addDaysToDateOnly(dateOnly: string, days: number): string {
  const d = new Date(`${dateOnly}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole-day difference (b - a) between two YYYY-MM-DD date strings. */
export function diffDaysBetweenDateOnly(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const da = new Date(`${a}T00:00:00.000Z`).getTime();
  const db = new Date(`${b}T00:00:00.000Z`).getTime();
  return Math.round((db - da) / msPerDay);
}

/** e.g. "8월 18일", using the Asia/Seoul calendar date. */
export function formatKoreanMonthDay(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export function formatKoreanDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export function formatKoreanDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
