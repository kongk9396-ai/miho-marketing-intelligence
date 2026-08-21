import "server-only";
import { getAllMetaDailyRowsForAd, getMetaAdHierarchy } from "@/lib/creative-changes/repository";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import type { PeriodMetrics } from "@/lib/creative-changes/types";

export interface VideoAdSummary {
  adId: string;
  adName: string | null;
  campaignName: string | null;
  metrics: PeriodMetrics;
}

const SCAN_LIMIT = 100;

/**
 * All-time (no date filter — this page isn't a before/after comparison)
 * video summary per ad, limited to ads that actually have video plays.
 * Scans up to `scanLimit` most-recently-active ads to bound query cost.
 */
export async function getVideoAdSummaries(scanLimit = SCAN_LIMIT): Promise<VideoAdSummary[]> {
  const hierarchy = await getMetaAdHierarchy();
  const candidates = hierarchy.slice(0, scanLimit);

  const results = await Promise.all(
    candidates.map(async (ad): Promise<VideoAdSummary> => {
      const rows = await getAllMetaDailyRowsForAd(ad.adId);
      const metrics: PeriodMetrics = aggregatePeriodMetrics(rows);
      return { adId: ad.adId, adName: ad.adName, campaignName: ad.campaignName, metrics };
    })
  );

  return results.filter((r) => r.metrics.totalVideoPlays > 0);
}
