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

  // totalVideoPlays (Meta's raw "video_plays" column) is absent from some
  // real-world exports even when the percentage-retention columns are
  // populated — filtering on it alone would hide every ad with real video
  // data. Any engagement signal (3s or any %-stage) counts as "has video data".
  return results.filter(
    (r) =>
      r.metrics.totalVideoPlays > 0 ||
      r.metrics.video3s.count > 0 ||
      r.metrics.video25.count > 0 ||
      r.metrics.video50.count > 0 ||
      r.metrics.video75.count > 0 ||
      r.metrics.video95.count > 0 ||
      r.metrics.video100.count > 0
  );
}
