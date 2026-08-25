import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import type { Ga4DailyLike } from "@/lib/ga4/types";
import type { LandingPeriodMetrics } from "@/lib/landing-changes/types";

function inverse(rate: number | null): number | null {
  return rate === null ? null : 100 - rate;
}

/** Aggregates raw GA4 rows (already date/landing-page filtered by the repository) into the shape landing-changes comparisons work with. */
export function aggregateLandingPeriodMetrics(rows: Ga4DailyLike[]): LandingPeriodMetrics {
  const agg = aggregateGa4Metrics(rows);
  const dayCount = new Set(rows.map((r) => r.date)).size;

  return {
    dayCount,
    landingViews: agg.totalPageViews,
    ctaClicks: agg.totalCtaClicks,
    ctaRate: agg.ctaRate,
    formStarts: agg.totalFormStarts,
    formStartRate: agg.formStartRate,
    formCompletes: agg.totalFormCompletes,
    formCompleteRate: agg.formCompleteRate,
    landingToCtaDropoffRate: inverse(agg.ctaRate),
    ctaToFormStartDropoffRate: inverse(agg.formStartRate),
  };
}
