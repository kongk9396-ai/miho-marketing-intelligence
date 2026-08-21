import "server-only";
import { getMetaAdHierarchy, getMetaDailyRowsForAd } from "@/lib/creative-changes/repository";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { getGa4RowsForCampaignContent } from "@/lib/ga4/repository";
import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import { resolveUtmForAd } from "@/lib/utm-mapping/resolve";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";
import type { CombinedAdSummary } from "@/lib/combined-analysis/types";

/** Meta + GA4 side-by-side per ad, over the last 30 days. Bounded to `limit` ads. */
export async function buildCombinedAdSummaries(limit = 10): Promise<CombinedAdSummary[]> {
  const hierarchy = await getMetaAdHierarchy();
  const today = toKstDateOnly(new Date().toISOString());
  const start = addDaysToDateOnly(today, -30);

  const results: CombinedAdSummary[] = [];

  for (const ad of hierarchy.slice(0, limit)) {
    const metaRows = await getMetaDailyRowsForAd(ad.adId, start, today);
    const metaMetrics = aggregatePeriodMetrics(metaRows);

    const resolved = await resolveUtmForAd(ad.campaignName, ad.adName);
    let ga4Summary: CombinedAdSummary["ga4"] = null;

    if (resolved) {
      const ga4Rows = await getGa4RowsForCampaignContent(resolved.utmCampaign, resolved.utmContent, {
        startDate: start,
        endDate: today,
      });
      if (ga4Rows.length > 0) {
        const ga4Metrics = aggregateGa4Metrics(ga4Rows);
        ga4Summary = {
          sessions: ga4Metrics.totalSessions,
          ctaClicks: ga4Metrics.totalCtaClicks,
          ctaRate: ga4Metrics.ctaRate,
          formStarts: ga4Metrics.totalFormStarts,
          formStartRate: ga4Metrics.formStartRate,
          formCompletes: ga4Metrics.totalFormCompletes,
          formCompleteRate: ga4Metrics.formCompleteRate,
        };
      }
    }

    results.push({
      adId: ad.adId,
      adName: ad.adName,
      campaignName: ad.campaignName,
      meta: {
        spend: metaMetrics.totalSpend,
        impressions: metaMetrics.totalImpressions,
        ctr: metaMetrics.ctr,
        cpc: metaMetrics.cpc,
        video50Rate: metaMetrics.video50.rate,
      },
      ga4: ga4Summary,
      utmSource: resolved?.source ?? null,
    });
  }

  return results;
}
