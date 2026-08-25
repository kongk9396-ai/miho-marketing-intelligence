import { addDaysToDateOnly } from "@/lib/date/kst";

/** 0 = Monday .. 6 = Sunday. */
function mondayBasedDayOfWeek(dateOnly: string): number {
  const day = new Date(`${dateOnly}T00:00:00.000Z`).getUTCDay(); // 0 Sun .. 6 Sat
  return (day + 6) % 7;
}

export interface WeekRange {
  start: string; // Monday, YYYY-MM-DD
  end: string; // Sunday, YYYY-MM-DD
}

/**
 * The most recently completed Monday-Sunday (KST) week, relative to
 * `todayKst`. If today is itself a Monday, that means yesterday (Sunday)
 * just completed last week — this always returns the week strictly before
 * the one containing today, never a partial in-progress week.
 */
export function getMostRecentCompletedWeek(todayKst: string): WeekRange {
  const offsetFromMonday = mondayBasedDayOfWeek(todayKst);
  const thisWeekMonday = addDaysToDateOnly(todayKst, -offsetFromMonday);
  const lastWeekMonday = addDaysToDateOnly(thisWeekMonday, -7);
  const lastWeekSunday = addDaysToDateOnly(thisWeekMonday, -1);
  return { start: lastWeekMonday, end: lastWeekSunday };
}
