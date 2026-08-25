import { MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE } from "@/lib/creative-changes/metrics";
import type { PeriodMetrics } from "@/lib/creative-changes/types";

/**
 * Meta's "3-second video plays" and its "video plays at 25%/50%/.../100%"
 * are NOT the same sequential funnel — they can (and in this account's real
 * exports, do) use different underlying denominators, so a 3-second count
 * can legitimately be smaller than the 25% count for the same ad. Dividing
 * one by the other produces nonsense (170%, -70%, ...). 3-second data is
 * therefore reported as its own standalone "초반 후킹" metric, never chained
 * into the retention funnel below.
 */
export interface VideoHookMetrics {
  video3sCount: number;
  /** video_3s / video_plays * 100 — null when video_plays (Meta's own "재생" denominator) is 0 or wasn't exported, never a fabricated 0. */
  video3sRate: number | null;
  avgWatchTime: number | null;
}

export function buildVideoHookMetrics(metrics: PeriodMetrics): VideoHookMetrics {
  return {
    video3sCount: metrics.video3s.count,
    video3sRate: metrics.totalVideoPlays > 0 ? (metrics.video3s.count / metrics.totalVideoPlays) * 100 : null,
    avgWatchTime: metrics.avgWatchTime,
  };
}

export type FunnelStageKey = "video25" | "video50" | "video75" | "video95" | "video100";

export interface FunnelStage {
  key: FunnelStageKey;
  label: string;
  count: number;
  /** % of the 25% stage's count — the funnel's fixed 100% base. Null only when the 25% count itself is 0 (no usable base at all). */
  cumulativeRetentionRate: number | null;
  /** Drop-off vs the immediately previous stage in this list (25→50→75→95→100 only). Null for the first stage (25%) or when the previous count is 0. */
  dropOffRate: number | null;
  /** True when the 25% base count meets MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE. */
  reliable: boolean;
}

function dropOff(prevCount: number, count: number): number | null {
  if (prevCount <= 0) return null;
  return ((prevCount - count) / prevCount) * 100;
}

/** Raw (already-summed) 25/50/75/95/100 video-retention counts for one ad or the whole account. */
export interface VideoStageCounts {
  video25: number;
  video50: number;
  video75: number;
  video95: number;
  video100: number;
}

/**
 * Same 25%→50%→75%→95%→100% funnel as buildRetentionFunnel, but built
 * directly from already-summed raw counts instead of a full PeriodMetrics —
 * used for per-ad funnels where only the raw video_25.../video_100 sums are
 * available (see AdDiagnosisMetricsView). Counts must already be raw-summed
 * across the period (never a per-row/per-day average).
 */
export function buildRetentionFunnelFromCounts(counts: VideoStageCounts): FunnelStage[] {
  const base = counts.video25;
  const reliable = base >= MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE;

  const stages: Array<{ key: FunnelStageKey; label: string; count: number }> = [
    { key: "video25", label: "25%", count: counts.video25 },
    { key: "video50", label: "50%", count: counts.video50 },
    { key: "video75", label: "75%", count: counts.video75 },
    { key: "video95", label: "95%", count: counts.video95 },
    { key: "video100", label: "100%", count: counts.video100 },
  ];

  return stages.map((stage, i) => ({
    ...stage,
    cumulativeRetentionRate: base > 0 ? (stage.count / base) * 100 : null,
    dropOffRate: i === 0 ? null : dropOff(stages[i - 1].count, stage.count),
    reliable,
  }));
}

/**
 * 25% → 50% → 75% → 95% → 100% video retention funnel, with the 25% stage
 * fixed as the 100% base. Raw counts are summed first (via
 * aggregatePeriodMetrics) and every rate is recomputed from those sums —
 * never a per-row/per-day average, and never chained against video_plays or
 * video_3s (see VideoHookMetrics above for why).
 */
export function buildRetentionFunnel(metrics: PeriodMetrics): FunnelStage[] {
  return buildRetentionFunnelFromCounts({
    video25: metrics.video25.count,
    video50: metrics.video50.count,
    video75: metrics.video75.count,
    video95: metrics.video95.count,
    video100: metrics.video100.count,
  });
}

export interface MaxDropoff {
  fromLabel: string;
  toLabel: string;
  dropOffRate: number;
}

/** The stage-to-stage pair (within 25→50→75→95→100 only) with the largest dropOffRate. Null when unreliable or no stage has a computable drop-off. */
export function findMaxDropoff(stages: FunnelStage[]): MaxDropoff | null {
  if (stages.length < 2 || !stages[0].reliable) return null;

  let maxIndex = -1;
  let maxRate = -Infinity;
  for (let i = 1; i < stages.length; i++) {
    const rate = stages[i].dropOffRate;
    if (rate !== null && rate > maxRate) {
      maxRate = rate;
      maxIndex = i;
    }
  }
  if (maxIndex === -1) return null;

  return { fromLabel: stages[maxIndex - 1].label, toLabel: stages[maxIndex].label, dropOffRate: maxRate };
}

/** "최대 이탈 구간: XX → XX" label string, for places that just need the headline text. */
export function findMaxDropoffLabel(stages: FunnelStage[]): string | null {
  const max = findMaxDropoff(stages);
  if (!max) return null;
  return `${max.fromLabel} → ${max.toLabel} 구간에서 가장 큰 이탈 (${max.dropOffRate.toFixed(1)}%)`;
}

const SEGMENT_ADVICE: Record<string, string> = {
  "25%→50%": "영상 중반부로 넘어가기 전에 이탈이 커 핵심 혜택이나 결과 화면을 영상 전반부로 당기는 것을 권장합니다.",
  "50%→75%": "중반 메시지에서 관심이 식고 있어 스토리 전개나 설명 구간을 더 간결하게 다듬는 것이 좋습니다.",
  "75%→95%": "영상 후반부 길이나 전개가 늘어질 수 있어 핵심 정보 이후 분량을 점검해보세요.",
  "95%→100%": "마무리 직전 이탈이 커 CTA/클로징 구간의 임팩트를 점검해보세요.",
};

/**
 * "보고용 자동 해석" one-liner (spec) — rule-based only, no AI. States the
 * real retention rate at every stage (25% base fixed at 100%), then the
 * max-dropoff segment with a fixed, segment-specific suggestion.
 */
export function buildRetentionInterpretation(stages: FunnelStage[]): string {
  if (stages.length < 5 || !stages[0].reliable) {
    return "표본이 부족해 이탈 구간을 판정하기 이릅니다.";
  }
  const [, s50, s75, s95, s100] = stages;
  const rate = (s: FunnelStage) =>
    s.cumulativeRetentionRate !== null ? `${s.cumulativeRetentionRate.toFixed(1)}%` : "데이터 없음";

  const max = findMaxDropoff(stages);
  if (!max) {
    return `영상 시청은 25% 도달자를 기준으로 50%까지 ${rate(s50)}, 75%까지 ${rate(s75)}, 95%까지 ${rate(s95)}, 완주까지 ${rate(s100)}가 유지됐습니다.`;
  }

  const segmentKey = `${max.fromLabel}→${max.toLabel}`;
  const advice = SEGMENT_ADVICE[segmentKey] ?? "";
  return `영상 시청은 25% 도달자를 기준으로 50%까지 ${rate(s50)}, 75%까지 ${rate(s75)}, 95%까지 ${rate(s95)}, 완주까지 ${rate(s100)}가 유지됐으며, 가장 큰 이탈은 ${max.fromLabel}→${max.toLabel} 구간에서 ${max.dropOffRate.toFixed(1)}% 발생했습니다. ${advice}`;
}
