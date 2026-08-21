import { MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE } from "@/lib/creative-changes/metrics";
import { VERDICT_THRESHOLDS } from "@/lib/creative-changes/verdict-rules";
import type { PeriodMetrics } from "@/lib/creative-changes/types";

export interface VideoAdMetrics {
  adId: string;
  adName: string | null;
  metrics: PeriodMetrics;
}

export type RankingCategory = "earlyRetention" | "midRetention" | "completionRate" | "clickEfficiency";

export interface RankingEntry {
  adId: string;
  adName: string | null;
  value: number;
  displayValue: string;
}

export interface CategoryRanking {
  category: RankingCategory;
  label: string;
  /** Highest first. */
  top: RankingEntry[];
  /** Lowest first. */
  bottom: RankingEntry[];
  /** Ads with too little sample to rank fairly — shown separately, never silently dropped. */
  insufficientSample: { adId: string; adName: string | null }[];
}

interface CategoryDef {
  category: RankingCategory;
  label: string;
  getValue: (m: PeriodMetrics) => number | null;
  formatValue: (v: number) => string;
  /** Whether this ad has enough sample to be ranked for this category. */
  isReliable: (m: PeriodMetrics) => boolean;
}

const CATEGORY_DEFS: CategoryDef[] = [
  {
    category: "earlyRetention",
    label: "초반 유지력 (3초 재생률)",
    getValue: (m) => m.video3s.rate,
    formatValue: (v) => `${v.toFixed(1)}%`,
    isReliable: (m) => m.totalVideoPlays >= MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE,
  },
  {
    category: "midRetention",
    label: "중간 유지력 (50% 재생률)",
    getValue: (m) => m.video50.rate,
    formatValue: (v) => `${v.toFixed(1)}%`,
    isReliable: (m) => m.totalVideoPlays >= MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE,
  },
  {
    category: "completionRate",
    label: "완주율 (100%)",
    getValue: (m) => m.video100.rate,
    formatValue: (v) => `${v.toFixed(1)}%`,
    isReliable: (m) => m.totalVideoPlays >= MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE,
  },
  {
    category: "clickEfficiency",
    label: "클릭 효율 (CTR)",
    getValue: (m) => m.ctr,
    formatValue: (v) => `${v.toFixed(2)}%`,
    // CTR reliability depends on impression volume, not video plays — reuses
    // the same minimum the before/after verdict engine trusts a CTR change at.
    isReliable: (m) => m.totalImpressions >= VERDICT_THRESHOLDS.minImpressions,
  },
];

/** Top/bottom `limit` ads per category, excluding low-sample ads from ranking (never silently — they're returned as `insufficientSample`). */
export function buildCreativeRankings(ads: VideoAdMetrics[], limit = 5): CategoryRanking[] {
  return CATEGORY_DEFS.map((def) => {
    const reliableEntries: RankingEntry[] = [];
    const insufficientSample: { adId: string; adName: string | null }[] = [];

    for (const ad of ads) {
      if (!def.isReliable(ad.metrics)) {
        insufficientSample.push({ adId: ad.adId, adName: ad.adName });
        continue;
      }
      const value = def.getValue(ad.metrics);
      if (value === null) continue;
      reliableEntries.push({
        adId: ad.adId,
        adName: ad.adName,
        value,
        displayValue: def.formatValue(value),
      });
    }

    const sorted = [...reliableEntries].sort((a, b) => b.value - a.value);

    return {
      category: def.category,
      label: def.label,
      top: sorted.slice(0, limit),
      bottom: sorted.length > limit ? [...sorted].reverse().slice(0, limit) : [],
      insufficientSample,
    };
  });
}
