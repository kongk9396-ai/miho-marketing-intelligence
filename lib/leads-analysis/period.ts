import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";

export type PeriodPreset = "today" | "7d" | "30d" | "custom";

export interface ResolvedPeriod {
  preset: PeriodPreset;
  startDate: string; // YYYY-MM-DD (KST), inclusive
  endDate: string; // YYYY-MM-DD (KST), inclusive
  startIso: string;
  endIsoExclusive: string;
  label: string;
}

function kstDateOnlyToInstantIso(dateOnly: string): string {
  return new Date(`${dateOnly}T00:00:00+09:00`).toISOString();
}

export function resolvePeriod(preset: PeriodPreset, customStart?: string, customEnd?: string): ResolvedPeriod {
  const today = toKstDateOnly(new Date().toISOString());
  let startDate: string;
  let endDate: string;
  let label: string;

  switch (preset) {
    case "today":
      startDate = today;
      endDate = today;
      label = "오늘";
      break;
    case "30d":
      startDate = addDaysToDateOnly(today, -29);
      endDate = today;
      label = "최근 30일";
      break;
    case "custom":
      startDate = customStart && customStart <= (customEnd ?? today) ? customStart : today;
      endDate = customEnd ?? today;
      label = "사용자 지정";
      break;
    case "7d":
    default:
      startDate = addDaysToDateOnly(today, -6);
      endDate = today;
      label = "최근 7일";
      break;
  }

  return {
    preset,
    startDate,
    endDate,
    startIso: kstDateOnlyToInstantIso(startDate),
    endIsoExclusive: kstDateOnlyToInstantIso(addDaysToDateOnly(endDate, 1)),
    label,
  };
}

/** The immediately preceding period of the same length, for before/after problem classification. */
export function resolvePriorPeriod(period: ResolvedPeriod): ResolvedPeriod {
  const dayCount = Math.round(
    (new Date(`${period.endDate}T00:00:00Z`).getTime() - new Date(`${period.startDate}T00:00:00Z`).getTime()) /
      86_400_000
  ) + 1;

  const priorEnd = addDaysToDateOnly(period.startDate, -1);
  const priorStart = addDaysToDateOnly(priorEnd, -(dayCount - 1));

  return {
    preset: "custom",
    startDate: priorStart,
    endDate: priorEnd,
    startIso: kstDateOnlyToInstantIso(priorStart),
    endIsoExclusive: kstDateOnlyToInstantIso(addDaysToDateOnly(priorEnd, 1)),
    label: "이전 기간",
  };
}
