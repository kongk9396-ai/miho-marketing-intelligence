import { diffDaysBetweenDateOnly } from "@/lib/date/kst";

export interface OperatingDaySummary {
  /** User-entered official start date, if registered. */
  officialStartDate: string | null;
  /** Earliest date with real data in meta_daily, if any. Always shown separately from officialStartDate. */
  dataFirstDate: string | null;
  /** today - officialStartDate + 1. Null when no official start date is registered, or it's in the future. */
  operatingDayCount: number | null;
}

/**
 * "운영 N일째" must only ever be computed from a user-registered official
 * start date — never silently falls back to dataFirstDate, since that would
 * misrepresent an unregistered date as if it were official (spec section 1/2).
 */
export function computeOperatingDaySummary(
  officialStartDate: string | null,
  dataFirstDate: string | null,
  todayKst: string
): OperatingDaySummary {
  if (!officialStartDate) {
    return { officialStartDate: null, dataFirstDate, operatingDayCount: null };
  }
  const diff = diffDaysBetweenDateOnly(officialStartDate, todayKst);
  const operatingDayCount = diff >= 0 ? diff + 1 : null;
  return { officialStartDate, dataFirstDate, operatingDayCount };
}
