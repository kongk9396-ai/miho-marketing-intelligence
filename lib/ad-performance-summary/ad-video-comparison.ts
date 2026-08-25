import { buildRetentionFunnelFromCounts, findMaxDropoffLabel } from "@/lib/video-analysis/funnel";
import type { FunnelStage } from "@/lib/video-analysis/funnel";
import type { AdDiagnosisResult } from "@/lib/ad-diagnosis/types";

export interface AdVideoFunnelSummary {
  adId: string;
  adName: string | null;
  campaignName: string | null;
  stages: FunnelStage[];
  maxDropoffLabel: string | null;
  /** false when this ad's 25% count is 0 — no usable video data, must render as "데이터 없음", never a fabricated 0%. */
  hasData: boolean;
  /** true for long-running legacy campaigns excluded from the "신규 광고" comparison table (still shown in a reference-only area). */
  excluded: boolean;
  ctr: number | null;
  cpc: number | null;
}

/**
 * Per-ad 25%→50%→75%→95%→100% retention funnel, built from the same raw
 * summed counts (AdDiagnosisMetricsView.video25...video100) the rest of the
 * ad diagnosis already computed — no new data fetching, no per-row averaging.
 */
export function buildAdVideoFunnels(
  ads: AdDiagnosisResult[],
  excludedCampaignNames: string[]
): AdVideoFunnelSummary[] {
  return ads.map((ad) => {
    const stages = buildRetentionFunnelFromCounts({
      video25: ad.metrics.video25,
      video50: ad.metrics.video50,
      video75: ad.metrics.video75,
      video95: ad.metrics.video95,
      video100: ad.metrics.video100,
    });
    return {
      adId: ad.adId,
      adName: ad.adName,
      campaignName: ad.campaignName,
      stages,
      maxDropoffLabel: findMaxDropoffLabel(stages),
      hasData: ad.metrics.video25 > 0,
      excluded: excludedCampaignNames.includes(ad.campaignName ?? ""),
      ctr: ad.metrics.ctr,
      cpc: ad.metrics.cpc,
    };
  });
}
