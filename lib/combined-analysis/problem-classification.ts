import { computeChangePercent } from "@/lib/change-percent";
import type { Ga4PeriodMetrics } from "@/lib/ga4/metrics";
import type { PeriodMetrics } from "@/lib/creative-changes/types";
import type { ProblemClassificationResult } from "@/lib/combined-analysis/types";

/** Deterministic, code-configured rules — no AI/LLM. Adjust as thresholds calibrate. */
export const PROBLEM_THRESHOLDS = {
  minImpressions: 1000,
  minClicks: 30,
  minSessions: 100,
  ctrChangePercentAtMost: -10,
  cpcChangePercentAtLeast: 15,
  video50ChangePercentAtMost: -15,
  landingDropChangePercentAtMost: -20,
  /** |change| below this is treated as "no real move" for the landing side. */
  landingStableBandPercent: 10,
};

export interface ProblemClassificationInput {
  metaBefore: PeriodMetrics;
  metaAfter: PeriodMetrics;
  ga4Before: Ga4PeriodMetrics;
  ga4After: Ga4PeriodMetrics;
}

function formatChange(label: string, value: number | null): string {
  if (value === null) return `${label} 데이터 없음`;
  const sign = value >= 0 ? "+" : "";
  return `${label} ${sign}${value.toFixed(1)}%`;
}

function formatLandingChange(label: string, value: number | null, stableBand: number): string {
  if (value === null) return `${label} 데이터 없음`;
  if (Math.abs(value) < stableBand) return `${label} 변화 없음`;
  const sign = value >= 0 ? "+" : "";
  return `${label} ${sign}${value.toFixed(1)}%`;
}

export function classifyProblemArea(input: ProblemClassificationInput): ProblemClassificationResult {
  const { metaBefore, metaAfter, ga4Before, ga4After } = input;
  const t = PROBLEM_THRESHOLDS;

  if (
    metaAfter.totalImpressions < t.minImpressions ||
    metaAfter.totalClicks < t.minClicks ||
    ga4After.totalSessions < t.minSessions
  ) {
    return {
      classification: "insufficient_data",
      headline: "데이터가 충분하지 않아 판정할 수 없습니다.",
      reasons: [
        `노출 ${metaAfter.totalImpressions.toLocaleString("ko-KR")}, 클릭 ${metaAfter.totalClicks.toLocaleString("ko-KR")}, 세션 ${ga4After.totalSessions.toLocaleString("ko-KR")}`,
      ],
    };
  }

  const ctrChange = computeChangePercent(metaBefore.ctr, metaAfter.ctr);
  const cpcChange = computeChangePercent(metaBefore.cpc, metaAfter.cpc);
  const video50Change = computeChangePercent(metaBefore.video50.rate, metaAfter.video50.rate);
  const ctaRateChange = computeChangePercent(ga4Before.ctaRate, ga4After.ctaRate);
  const formStartRateChange = computeChangePercent(ga4Before.formStartRate, ga4After.formStartRate);

  const metaWorsened =
    ctrChange !== null && cpcChange !== null && ctrChange <= t.ctrChangePercentAtMost && cpcChange >= t.cpcChangePercentAtLeast;
  const metaStable = !metaWorsened;

  const landingDropped =
    (ctaRateChange !== null && ctaRateChange <= t.landingDropChangePercentAtMost) ||
    (formStartRateChange !== null && formStartRateChange <= t.landingDropChangePercentAtMost);
  const landingStable =
    (ctaRateChange === null || Math.abs(ctaRateChange) < t.landingStableBandPercent) &&
    (formStartRateChange === null || Math.abs(formStartRateChange) < t.landingStableBandPercent);

  const reasons = [
    formatChange("CTR", ctrChange),
    formatChange("CPC", cpcChange),
    formatChange("50% 시청률", video50Change),
    formatLandingChange("랜딩 CTA율", ctaRateChange, t.landingStableBandPercent),
  ];

  if (metaWorsened && landingDropped) {
    return {
      classification: "both_problem",
      headline: "광고 소재와 랜딩 모두에서 문제가 발견되었습니다.",
      reasons,
    };
  }

  if (metaWorsened && landingStable) {
    return {
      classification: "creative_problem",
      headline: "광고 소재 문제 가능성이 높습니다.",
      reasons,
    };
  }

  if (metaStable && landingDropped) {
    return {
      classification: "landing_problem",
      headline: "랜딩 페이지 문제 가능성이 높습니다.",
      reasons,
    };
  }

  return {
    classification: "no_issue",
    headline: "뚜렷한 문제 신호가 없습니다.",
    reasons,
  };
}
