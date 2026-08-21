import { MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE } from "@/lib/creative-changes/metrics";
import type { PeriodMetrics } from "@/lib/creative-changes/types";

export type FunnelStageKey = "plays" | "video3s" | "video25" | "video50" | "video75" | "video95" | "video100";

export interface FunnelStage {
  key: FunnelStageKey;
  label: string;
  count: number;
  /** count / total plays * 100. Null when there were no plays at all. */
  retentionRate: number | null;
  /** Drop-off vs the previous stage: (prevCount - count) / prevCount * 100. Null for the first stage or when prevCount is 0. */
  dropOffRate: number | null;
  reliable: boolean;
}

function rate(count: number, totalPlays: number): number | null {
  return totalPlays > 0 ? (count / totalPlays) * 100 : null;
}

function dropOff(prevCount: number, count: number): number | null {
  if (prevCount <= 0) return null;
  return ((prevCount - count) / prevCount) * 100;
}

/**
 * 재생 → 3초 → 25% → 50% → 75% → 95% → 100% retention funnel for one ad's
 * period metrics. Each stage's reliability mirrors aggregatePeriodMetrics'
 * MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE threshold, applied against total plays
 * (not the stage's own count) since that's the denominator every rate here
 * is computed against.
 */
export function buildRetentionFunnel(metrics: PeriodMetrics): FunnelStage[] {
  const totalPlays = metrics.totalVideoPlays;
  const reliable = totalPlays >= MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE;

  const stages: Array<{ key: FunnelStageKey; label: string; count: number }> = [
    { key: "plays", label: "재생", count: totalPlays },
    { key: "video3s", label: "3초", count: metrics.video3s.count },
    { key: "video25", label: "25%", count: metrics.video25.count },
    { key: "video50", label: "50%", count: metrics.video50.count },
    { key: "video75", label: "75%", count: metrics.video75.count },
    { key: "video95", label: "95%", count: metrics.video95.count },
    { key: "video100", label: "100%", count: metrics.video100.count },
  ];

  return stages.map((stage, i) => ({
    ...stage,
    retentionRate: i === 0 ? (totalPlays > 0 ? 100 : null) : rate(stage.count, totalPlays),
    dropOffRate: i === 0 ? null : dropOff(stages[i - 1].count, stage.count),
    reliable,
  }));
}
