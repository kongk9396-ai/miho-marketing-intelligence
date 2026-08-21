import { computeChangePercent } from "@/lib/change-percent";
import type { PeriodMetrics, VerdictResult } from "@/lib/creative-changes/types";

/**
 * Deterministic, code-configured rules — no AI/LLM involved. Adjust these
 * constants as real-world results calibrate the thresholds; nothing else
 * needs to change.
 */
export const VERDICT_THRESHOLDS = {
  minImpressions: 1000,
  minClicks: 30,
  worsened: {
    ctrChangePercentAtMost: -10,
    cpcChangePercentAtLeast: 15,
    video50ChangePercentAtMost: -15,
    completionChangePercentAtMost: -20,
  },
  improved: {
    ctrChangePercentAtLeast: 10,
    cpcChangePercentAtMost: -10,
  },
};

export function hasSufficientVerdictData(after: PeriodMetrics): boolean {
  return (
    after.totalImpressions >= VERDICT_THRESHOLDS.minImpressions &&
    after.totalClicks >= VERDICT_THRESHOLDS.minClicks
  );
}

function formatPercentChange(value: number): string {
  const direction = value >= 0 ? "증가" : "감소";
  return `${Math.abs(value).toFixed(1)}% ${direction}`;
}

export function evaluateVerdict(before: PeriodMetrics, after: PeriodMetrics): VerdictResult {
  if (!hasSufficientVerdictData(after)) {
    return {
      verdict: "insufficient_data",
      headline: "데이터가 충분하지 않아 판정할 수 없습니다.",
      reasons: [
        `변경 후 노출수 ${after.totalImpressions.toLocaleString("ko-KR")}회, 클릭수 ${after.totalClicks.toLocaleString("ko-KR")}회`,
      ],
      recommendation: "데이터가 더 쌓인 뒤 다시 확인해주세요.",
    };
  }

  const t = VERDICT_THRESHOLDS;
  const ctrChange = computeChangePercent(before.ctr, after.ctr);
  const cpcChange = computeChangePercent(before.cpc, after.cpc);
  const video50Change = computeChangePercent(before.video50.rate, after.video50.rate);
  const completionChange = computeChangePercent(before.video100.rate, after.video100.rate);

  const worsenedByCtrCpc =
    ctrChange !== null &&
    cpcChange !== null &&
    ctrChange <= t.worsened.ctrChangePercentAtMost &&
    cpcChange >= t.worsened.cpcChangePercentAtLeast;

  const worsenedByVideo =
    video50Change !== null &&
    completionChange !== null &&
    video50Change <= t.worsened.video50ChangePercentAtMost &&
    completionChange <= t.worsened.completionChangePercentAtMost;

  if (worsenedByCtrCpc || worsenedByVideo) {
    const reasons: string[] = [];
    if (ctrChange !== null) reasons.push(`CTR ${formatPercentChange(ctrChange)}`);
    if (cpcChange !== null) reasons.push(`CPC ${formatPercentChange(cpcChange)}`);
    if (video50Change !== null) reasons.push(`50% 시청률 ${formatPercentChange(video50Change)}`);
    if (completionChange !== null) reasons.push(`완주율 ${formatPercentChange(completionChange)}`);

    return {
      verdict: "worsened",
      headline: "새 소재 성과 악화 가능성이 높습니다.",
      reasons,
      recommendation: "기존 소재 복귀 또는 신규 후킹 버전 테스트를 검토하세요.",
    };
  }

  const improved =
    ctrChange !== null &&
    cpcChange !== null &&
    ctrChange >= t.improved.ctrChangePercentAtLeast &&
    cpcChange <= t.improved.cpcChangePercentAtMost;

  if (improved) {
    return {
      verdict: "improved",
      headline: "새 소재 성과가 개선되었습니다.",
      reasons: [`CTR ${formatPercentChange(ctrChange)}`, `CPC ${formatPercentChange(cpcChange)}`],
      recommendation: "새 소재를 유지하고 예산 확대를 검토하세요.",
    };
  }

  return {
    verdict: "neutral",
    headline: "뚜렷한 개선 또는 악화 신호가 없습니다.",
    reasons: [
      ctrChange !== null ? `CTR ${formatPercentChange(ctrChange)}` : "CTR 데이터 없음",
      cpcChange !== null ? `CPC ${formatPercentChange(cpcChange)}` : "CPC 데이터 없음",
    ],
    recommendation: "조금 더 지켜보거나 완주율 등 다른 지표를 함께 확인하세요.",
  };
}
