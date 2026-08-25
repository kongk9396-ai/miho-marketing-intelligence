import "server-only";
import { getMetaAdHierarchy, getMetaDailyRawRowsForAds } from "@/lib/creative-changes/repository";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { getGa4RowsForCampaignContent } from "@/lib/ga4/repository";
import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import { resolveUtmForAd } from "@/lib/utm-mapping/resolve";
import { computeMetaRateFallback } from "@/lib/ad-diagnosis/meta-rate-fallback";
import { checkFormCompleteTrackingConnected } from "@/lib/ad-diagnosis/build";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";
import type { CombinedAdSummary } from "@/lib/combined-analysis/types";

/**
 * Meta + GA4 side-by-side per ad, over the last 30 days. Bounded to `limit`
 * ads. Ads are grouped by (campaign, ad name) identity — not raw ad_id —
 * and every matching ad_id (a real Meta ad can have both a legacy temp:
 * hash id and its real Meta ad_id in meta_daily) is merged before
 * aggregating, mirroring lib/ad-diagnosis/build.ts's grouping so the same
 * ad is never split into duplicate rows or under-counted.
 */
export async function buildCombinedAdSummaries(limit = 10): Promise<CombinedAdSummary[]> {
  const hierarchy = await getMetaAdHierarchy();
  const today = toKstDateOnly(new Date().toISOString());
  const start = addDaysToDateOnly(today, -30);

  const byIdentity = new Map<
    string,
    { adIds: string[]; adName: string | null; campaignName: string | null }
  >();
  for (const row of hierarchy) {
    const key = `${row.campaignName ?? ""}|||${row.adName ?? ""}`;
    let entry = byIdentity.get(key);
    if (!entry) {
      entry = { adIds: [], adName: row.adName, campaignName: row.campaignName };
      byIdentity.set(key, entry);
    }
    entry.adIds.push(row.adId);
  }

  const identities = [...byIdentity.values()].slice(0, limit);
  const formCompleteTrackingConnected = await checkFormCompleteTrackingConnected(start, today);

  const results: CombinedAdSummary[] = [];

  for (const identity of identities) {
    const primaryAdId = identity.adIds.find((id) => !id.startsWith("temp:")) ?? identity.adIds[0];

    const metaRows = await getMetaDailyRawRowsForAds(identity.adIds, start, today);
    const metaAgg = aggregatePeriodMetrics(metaRows);
    const rateFallback = computeMetaRateFallback(metaRows, {
      spend: metaAgg.totalSpend,
      impressions: metaAgg.totalImpressions,
      clicks: metaAgg.totalClicks,
      linkClicks: metaAgg.totalLinkClicks,
    });

    const resolved = await resolveUtmForAd(identity.campaignName, identity.adName);
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
          formCompleteTrackingConnected,
        };
      }
    }

    results.push({
      adId: primaryAdId,
      adName: identity.adName,
      campaignName: identity.campaignName,
      meta: {
        spend: metaAgg.totalSpend,
        impressions: metaAgg.totalImpressions,
        ctr: rateFallback.ctr,
        ctrSource: rateFallback.ctrSource,
        cpc: rateFallback.cpc,
        cpcSource: rateFallback.cpcSource,
        video50Rate: metaAgg.video50.rate,
      },
      ga4: ga4Summary,
      utmSource: resolved?.source ?? null,
    });
  }

  return results;
}
