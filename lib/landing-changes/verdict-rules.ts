import { computeChangePercent } from "@/lib/change-percent";
import type { VerdictResult } from "@/lib/creative-changes/types";
import type { LandingPeriodMetrics } from "@/lib/landing-changes/types";

/**
 * Deterministic, code-configured rules — no AI/LLM involved. Mirrors the
 * shape of lib/creative-changes/verdict-rules.ts but judges the GA4 landing
 * funnel (CTA rate / form-start rate) instead of Meta click/video metrics.
 */
export const LANDING_VERDICT_THRESHOLDS = {
  minLandingViews: 100,
  worsened: { ctaRateChangePercentAtMost: -15 },
  improved: { ctaRateChangePercentAtLeast: 15, formStartRateChangePercentAtLeast: -10 },
  /** CTA improved but the next stage (form start) dropped meaningfully — a mixed result, not a clean win. */
  mixedFormStartDropAtMost: -15,
};

export function hasSufficientLandingVerdictData(after: LandingPeriodMetrics): boolean {
  return after.landingViews >= LANDING_VERDICT_THRESHOLDS.minLandingViews;
}

function formatPercentChange(label: string, value: number): string {
  const direction = value >= 0 ? "증가" : "감소";
  return `${label} ${Math.abs(value).toFixed(1)}% ${direction}`;
}

export function evaluateLandingVerdict(before: LandingPeriodMetrics, after: LandingPeriodMetrics): VerdictResult {
  if (!hasSufficientLandingVerdictData(after)) {
    return {
      verdict: "insufficient_data",
      headline: "데이터가 충분하지 않아 판정할 수 없습니다.",
      reasons: [`변경 후 랜딩 조회수 ${after.landingViews.toLocaleString("ko-KR")}회`],
      recommendation: "데이터가 더 쌓인 뒤 다시 확인해주세요.",
    };
  }

  const t = LANDING_VERDICT_THRESHOLDS;
  const ctaChange = computeChangePercent(before.ctaRate, after.ctaRate);
  const formStartChange = computeChangePercent(before.formStartRate, after.formStartRate);

  if (
    ctaChange !== null &&
    ctaChange > 0 &&
    formStartChange !== null &&
    formStartChange <= t.mixedFormStartDropAtMost
  ) {
    return {
      verdict: "neutral",
      headline: "CTA 전환율은 개선됐지만 폼 시작률이 하락해 CTA 이후 구간 점검이 필요합니다.",
      reasons: [formatPercentChange("CTA 전환율", ctaChange), formatPercentChange("폼 시작률", formStartChange)],
      recommendation: "CTA 클릭 이후 폼 진입 단계(로딩 속도, 폼 UX, 신뢰 요소)를 점검하세요.",
    };
  }

  if (ctaChange !== null && ctaChange <= t.worsened.ctaRateChangePercentAtMost) {
    const reasons = [formatPercentChange("CTA 전환율", ctaChange)];
    if (formStartChange !== null) reasons.push(formatPercentChange("폼 시작률", formStartChange));
    return {
      verdict: "worsened",
      headline: "랜딩 수정 후 CTA 전환율이 악화되었습니다.",
      reasons,
      recommendation: "이전 랜딩으로 롤백하거나 후킹/신뢰 요소를 재점검하세요.",
    };
  }

  if (
    ctaChange !== null &&
    ctaChange >= t.improved.ctaRateChangePercentAtLeast &&
    (formStartChange === null || formStartChange >= t.improved.formStartRateChangePercentAtLeast)
  ) {
    const reasons = [formatPercentChange("CTA 전환율", ctaChange)];
    if (formStartChange !== null) reasons.push(formatPercentChange("폼 시작률", formStartChange));
    return {
      verdict: "improved",
      headline: "랜딩 수정 후 CTA 전환율과 폼 시작률이 함께 개선돼 수정 방향이 긍정적으로 확인됩니다.",
      reasons,
      recommendation: "현재 랜딩을 유지하세요.",
    };
  }

  return {
    verdict: "neutral",
    headline: "뚜렷한 개선 또는 악화 신호가 없습니다.",
    reasons: [
      ctaChange !== null ? formatPercentChange("CTA 전환율", ctaChange) : "CTA 전환율 데이터 없음",
      formStartChange !== null ? formatPercentChange("폼 시작률", formStartChange) : "폼 시작률 데이터 없음",
    ],
    recommendation: "조금 더 지켜보거나 폼 완료율 등 다른 지표를 함께 확인하세요.",
  };
}
