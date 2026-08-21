import { MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE } from "@/lib/creative-changes/metrics";
import type { PeriodMetrics } from "@/lib/creative-changes/types";

/**
 * Deterministic, code-configured rules — no AI/LLM involved. Adjust these
 * constants as real-world results calibrate the thresholds; nothing else
 * needs to change.
 */
export const VIDEO_DIAGNOSIS_THRESHOLDS = {
  /** Below this many total plays, the sample is too small to diagnose at all. */
  minVideoPlaysForDiagnosis: MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE,
  /** % lost between "재생" and "3초" at or above this is an early-hook problem. */
  earlyDropOffAtLeast: 70,
  /** % lost between "25%" and "50%" at or above this is a mid-video message problem. */
  midDropOffAtLeast: 40,
  /** % lost between "75%" and "100%" at or above this is a late/CTA problem. */
  lateDropOffAtLeast: 40,
  /** video100 rate at or above this counts as "유지율 좋음" for the CTR cross-check. */
  strongCompletionRateAtLeast: 20,
  /** CTR at or below this counts as "낮음" for the retention-vs-CTR cross-check. */
  lowCtrAtMost: 1,
  /** CTR at or above this triggers the "후속 퍼널 확인 필요" note. */
  goodCtrAtLeast: 2,
};

export type VideoDiagnosisSeverity = "warning" | "info";

export interface VideoDiagnosisInsight {
  key: string;
  severity: VideoDiagnosisSeverity;
  headline: string;
  detail: string;
}

function dropOffPercent(prevCount: number, count: number): number | null {
  if (prevCount <= 0) return null;
  return ((prevCount - count) / prevCount) * 100;
}

/**
 * Rule-based diagnosis of one ad's video retention + CTR shape. Every rule
 * requires a minimum sample (see thresholds above) so a handful of plays
 * never produces a confident-sounding claim — "과도한 단정은 하지 않는다".
 */
export function diagnoseVideo(metrics: PeriodMetrics): VideoDiagnosisInsight[] {
  const t = VIDEO_DIAGNOSIS_THRESHOLDS;

  if (metrics.totalVideoPlays < t.minVideoPlaysForDiagnosis) {
    return [
      {
        key: "insufficient_data",
        severity: "info",
        headline: "표본 부족",
        detail: `영상 재생 수가 ${metrics.totalVideoPlays}회로 적어 진단하기에 표본이 부족합니다.`,
      },
    ];
  }

  const insights: VideoDiagnosisInsight[] = [];

  const earlyDropOff = dropOffPercent(metrics.totalVideoPlays, metrics.video3s.count);
  if (earlyDropOff !== null && earlyDropOff >= t.earlyDropOffAtLeast) {
    insights.push({
      key: "early_hook_weak",
      severity: "warning",
      headline: "초반 훅 약화 가능성",
      detail: `재생 대비 3초 유지율 ${metrics.video3s.rate?.toFixed(1) ?? "—"}% (이탈 ${earlyDropOff.toFixed(1)}%)`,
    });
  }

  const midDropOff = dropOffPercent(metrics.video25.count, metrics.video50.count);
  if (midDropOff !== null && midDropOff >= t.midDropOffAtLeast) {
    insights.push({
      key: "mid_message_drop",
      severity: "warning",
      headline: "중반 메시지 이탈 가능성",
      detail: `25%→50% 구간 이탈 ${midDropOff.toFixed(1)}% (25% 유지율 ${metrics.video25.rate?.toFixed(1) ?? "—"}% → 50% 유지율 ${metrics.video50.rate?.toFixed(1) ?? "—"}%)`,
    });
  }

  const lateDropOff = dropOffPercent(metrics.video75.count, metrics.video100.count);
  if (lateDropOff !== null && lateDropOff >= t.lateDropOffAtLeast) {
    insights.push({
      key: "late_cta_review",
      severity: "warning",
      headline: "후반 길이 또는 CTA 점검 필요",
      detail: `75%→100% 구간 이탈 ${lateDropOff.toFixed(1)}% (75% 유지율 ${metrics.video75.rate?.toFixed(1) ?? "—"}% → 완주율 ${metrics.video100.rate?.toFixed(1) ?? "—"}%)`,
    });
  }

  if (
    metrics.video100.rate !== null &&
    metrics.video100.rate >= t.strongCompletionRateAtLeast &&
    metrics.ctr !== null &&
    metrics.ctr <= t.lowCtrAtMost
  ) {
    insights.push({
      key: "low_click_conversion",
      severity: "warning",
      headline: "영상 관심도 대비 클릭 유도력이 낮을 가능성",
      detail: `완주율 ${metrics.video100.rate.toFixed(1)}%로 시청 유지는 양호하나 CTR ${metrics.ctr.toFixed(2)}%로 낮습니다.`,
    });
  }

  if (metrics.ctr !== null && metrics.ctr >= t.goodCtrAtLeast) {
    insights.push({
      key: "funnel_followup_needed",
      severity: "info",
      headline: "후속 퍼널 데이터 확인 필요",
      detail: `CTR ${metrics.ctr.toFixed(2)}%로 양호하지만, 이 화면은 광고 소재 지표까지만 다룹니다. 랜딩/DB 전환 성과는 GA4·DB 분석에서 별도로 확인해주세요.`,
    });
  }

  if (insights.filter((i) => i.severity === "warning").length === 0) {
    insights.unshift({
      key: "no_issue",
      severity: "info",
      headline: "특이 이탈 구간 없음",
      detail: "구간별 이탈률이 임계값 이내로, 현재 뚜렷한 문제 구간은 발견되지 않았습니다.",
    });
  }

  return insights;
}
