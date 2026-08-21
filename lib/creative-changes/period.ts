import { addDaysToDateOnly, diffDaysBetweenDateOnly, toKstDateOnly } from "@/lib/date/kst";
import type { DateRange } from "@/lib/creative-changes/types";

export interface ComparisonPeriods {
  changeDateKst: string;
  before: DateRange;
  after: DateRange;
}

/**
 * The change day itself is excluded from both windows, and both windows are
 * always exactly `periodDays` long. Example: change on 8/18, periodDays=5 ->
 * before = 8/13~8/17, after = 8/19~8/23.
 */
export function computeComparisonPeriods(changedAt: string, periodDays: number): ComparisonPeriods {
  const changeDateKst = toKstDateOnly(changedAt);

  return {
    changeDateKst,
    before: {
      start: addDaysToDateOnly(changeDateKst, -periodDays),
      end: addDaysToDateOnly(changeDateKst, -1),
    },
    after: {
      start: addDaysToDateOnly(changeDateKst, 1),
      end: addDaysToDateOnly(changeDateKst, periodDays),
    },
  };
}

export interface ObservationProgress {
  /** KST calendar days elapsed since the change day (change day itself = 0). */
  daysElapsed: number;
  /** Elapsed days capped at periodDays, for "D+n / N일" display. */
  daysElapsedCapped: number;
  periodDays: number;
  /** True once the after-period's last day has fully passed (its data should be available). */
  isObservationWindowComplete: boolean;
}

/**
 * Meta report data for a given day is assumed available starting the next
 * day (same assumption the sync pipeline makes), so the window is only
 * "complete" once today is at least one day past the after-period's end.
 */
export function computeObservationProgress(
  changedAt: string,
  periodDays: number,
  now: Date = new Date()
): ObservationProgress {
  const changeDateKst = toKstDateOnly(changedAt);
  const todayKst = toKstDateOnly(now.toISOString());
  const daysElapsed = Math.max(0, diffDaysBetweenDateOnly(changeDateKst, todayKst));

  return {
    daysElapsed,
    daysElapsedCapped: Math.min(daysElapsed, periodDays),
    periodDays,
    isObservationWindowComplete: daysElapsed >= periodDays + 1,
  };
}
