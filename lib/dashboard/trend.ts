import "server-only";
import { getLeadsCountByKstDate, getMetaSpendByDate } from "@/lib/dashboard/repository";
import { addDaysToDateOnly, startOfTodayKst, toKstDateOnly } from "@/lib/date/kst";

export interface DashboardTrendPoint {
  date: string; // YYYY-MM-DD (KST)
  label: string; // e.g. "8/21"
  spend: number;
  leadsCount: number;
}

function formatSlashDate(dateOnly: string): string {
  const [, month, day] = dateOnly.split("-");
  return `${Number(month)}/${Number(day)}`;
}

/** Last `days` KST calendar days (including today), spend and lead count on the same date axis. */
export async function getRecentSpendAndLeadsTrend(days = 7): Promise<DashboardTrendPoint[]> {
  const today = toKstDateOnly(new Date().toISOString());
  const start = addDaysToDateOnly(today, -(days - 1));

  const todayStartKst = startOfTodayKst();
  const rangeStartIso = new Date(todayStartKst.getTime() - (days - 1) * 24 * 60 * 60 * 1000).toISOString();
  const rangeEndExclusiveIso = new Date(todayStartKst.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const [spendByDate, leadsByDate] = await Promise.all([
    getMetaSpendByDate(start, today),
    getLeadsCountByKstDate(rangeStartIso, rangeEndExclusiveIso),
  ]);

  return Array.from({ length: days }, (_, i) => {
    const date = addDaysToDateOnly(start, i);
    return {
      date,
      label: formatSlashDate(date),
      spend: spendByDate.get(date) ?? 0,
      leadsCount: leadsByDate.get(date) ?? 0,
    };
  });
}
