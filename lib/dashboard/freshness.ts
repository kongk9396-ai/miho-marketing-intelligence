import "server-only";
import { getLatestMetaDailyDate } from "@/lib/meta/repository";
import { getLatestGa4DataDate } from "@/lib/ga4/repository";
import { getLatestLeadsAppliedAt } from "@/lib/leads-sync/repository";
import { diffDaysBetweenDateOnly, toKstDateOnly } from "@/lib/date/kst";

/** A source is flagged stale once its latest data is this many KST days behind today or older. */
export const STALE_THRESHOLD_DAYS = 2;

export interface DataSourceFreshness {
  label: string;
  latestDate: string | null;
  daysBehind: number | null;
  isStale: boolean;
}

function toFreshness(label: string, latestDateOnly: string | null, today: string): DataSourceFreshness {
  if (!latestDateOnly) {
    return { label, latestDate: null, daysBehind: null, isStale: true };
  }
  const daysBehind = diffDaysBetweenDateOnly(latestDateOnly, today);
  return { label, latestDate: latestDateOnly, daysBehind, isStale: daysBehind >= STALE_THRESHOLD_DAYS };
}

export interface DashboardFreshness {
  meta: DataSourceFreshness;
  ga4: DataSourceFreshness;
  leads: DataSourceFreshness;
}

export async function getDashboardFreshness(): Promise<DashboardFreshness> {
  const today = toKstDateOnly(new Date().toISOString());

  const [metaDate, ga4Date, leadsAppliedAt] = await Promise.all([
    getLatestMetaDailyDate(),
    getLatestGa4DataDate(),
    getLatestLeadsAppliedAt(),
  ]);

  const leadsDateOnly = leadsAppliedAt ? toKstDateOnly(leadsAppliedAt) : null;

  return {
    meta: toFreshness("Meta", metaDate, today),
    ga4: toFreshness("GA4", ga4Date, today),
    leads: toFreshness("DB", leadsDateOnly, today),
  };
}
