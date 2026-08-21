import "server-only";
import { getMetaAdHierarchy, getMetaDailyRowsForAd } from "@/lib/creative-changes/repository";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { getGa4RowsForCampaignContent } from "@/lib/ga4/repository";
import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import { resolveUtmForAd } from "@/lib/utm-mapping/resolve";
import { classifyProblemArea } from "@/lib/combined-analysis/problem-classification";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";
import type { ProblemClassificationResult } from "@/lib/combined-analysis/types";

export interface ProblemAreaEstimate {
  adId: string;
  adName: string | null;
  campaignName: string | null;
  result: ProblemClassificationResult;
}

/**
 * Rolling trend check (no explicit change event needed): last 7 days vs the
 * 7 days before that, per ad that has a resolvable UTM mapping to GA4 data.
 * Scans up to `scanLimit` ads, returns up to `limit` non-"no_issue" /
 * non-"insufficient_data" results for the dashboard card.
 */
export async function getProblemAreaEstimates(limit = 3, scanLimit = 20): Promise<ProblemAreaEstimate[]> {
  const hierarchy = await getMetaAdHierarchy();
  const today = toKstDateOnly(new Date().toISOString());
  const recentStart = addDaysToDateOnly(today, -7);
  const priorStart = addDaysToDateOnly(today, -14);
  const priorEnd = addDaysToDateOnly(today, -8);

  const results: ProblemAreaEstimate[] = [];

  for (const ad of hierarchy.slice(0, scanLimit)) {
    const resolved = await resolveUtmForAd(ad.campaignName, ad.adName);
    if (!resolved) continue;

    const [metaAfterRows, metaBeforeRows, ga4AfterRows, ga4BeforeRows] = await Promise.all([
      getMetaDailyRowsForAd(ad.adId, recentStart, today),
      getMetaDailyRowsForAd(ad.adId, priorStart, priorEnd),
      getGa4RowsForCampaignContent(resolved.utmCampaign, resolved.utmContent, {
        startDate: recentStart,
        endDate: today,
      }),
      getGa4RowsForCampaignContent(resolved.utmCampaign, resolved.utmContent, {
        startDate: priorStart,
        endDate: priorEnd,
      }),
    ]);

    if (ga4AfterRows.length === 0 && ga4BeforeRows.length === 0) continue;

    const result = classifyProblemArea({
      metaBefore: aggregatePeriodMetrics(metaBeforeRows),
      metaAfter: aggregatePeriodMetrics(metaAfterRows),
      ga4Before: aggregateGa4Metrics(ga4BeforeRows),
      ga4After: aggregateGa4Metrics(ga4AfterRows),
    });

    if (result.classification === "no_issue" || result.classification === "insufficient_data") continue;

    results.push({ adId: ad.adId, adName: ad.adName, campaignName: ad.campaignName, result });
    if (results.length >= limit) break;
  }

  return results;
}
