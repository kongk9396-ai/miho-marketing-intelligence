import type { Ga4DailyLike } from "@/lib/ga4/types";

export interface Ga4PeriodMetrics {
  totalSessions: number;
  totalUsers: number;
  totalEngagedSessions: number;
  /** Recomputed from summed totals, never averaged from the daily engagement_rate column. */
  engagementRate: number | null;
  totalPageViews: number;
  totalCtaClicks: number;
  totalFormStarts: number;
  totalFormCompletes: number;
  ctaRate: number | null;
  formStartRate: number | null;
  formCompleteRate: number | null;
}

function sum(rows: Ga4DailyLike[], selector: (row: Ga4DailyLike) => number): number {
  return rows.reduce((acc, row) => acc + (selector(row) || 0), 0);
}

function rate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? (numerator / denominator) * 100 : null;
}

export function aggregateGa4Metrics(rows: Ga4DailyLike[]): Ga4PeriodMetrics {
  const totalSessions = sum(rows, (r) => r.sessions);
  const totalUsers = sum(rows, (r) => r.users);
  const totalEngagedSessions = sum(rows, (r) => r.engaged_sessions);
  const totalPageViews = sum(rows, (r) => r.page_views);
  const totalCtaClicks = sum(rows, (r) => r.cta_clicks);
  const totalFormStarts = sum(rows, (r) => r.form_starts);
  const totalFormCompletes = sum(rows, (r) => r.form_completes);

  return {
    totalSessions,
    totalUsers,
    totalEngagedSessions,
    engagementRate: rate(totalEngagedSessions, totalSessions),
    totalPageViews,
    totalCtaClicks,
    totalFormStarts,
    totalFormCompletes,
    ctaRate: rate(totalCtaClicks, totalSessions),
    formStartRate: rate(totalFormStarts, totalCtaClicks),
    formCompleteRate: rate(totalFormCompletes, totalFormStarts),
  };
}
