import { computeChangePercent } from "@/lib/change-percent";
import { formatKoreanMonthDay } from "@/lib/date/kst";
import type { LandingPeriodMetrics } from "@/lib/landing-changes/types";

function pct(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

/** Meaningful-move threshold, matching FLAT_THRESHOLD_PERCENT in lib/landing-changes/comparison.ts. */
const MOVE_THRESHOLD_PERCENT = 5;

export interface LandingReportLineInput {
  changedAtKst: string;
  before: LandingPeriodMetrics;
  after: LandingPeriodMetrics;
  hasSufficientData: boolean;
  /** The registered comparison window (3/5/7/custom days) — used only to explain a shortfall precisely. */
  comparisonPeriodDays: number;
  /** False = the after-window's calendar days haven't fully elapsed yet (still observing). True = the window elapsed but ga4_daily simply has fewer dated rows than that many days. */
  isObservationWindowComplete: boolean;
}

/**
 * The 1-2 sentence rule-based summary shown under a landing change's
 * before/after comparison (spec section 12). Rule-based only — no AI API.
 * Every number comes straight from the real aggregates passed in; a field
 * with no data on either side is simply omitted from the sentence.
 */
export function buildLandingChangeReportLine(input: LandingReportLineInput): string {
  if (!input.hasSufficientData) {
    if (!input.isObservationWindowComplete) {
      return "아직 관찰 기간이 끝나지 않아 성과 변화 판단을 보류합니다.";
    }
    const missingDays = input.comparisonPeriodDays - input.after.dayCount;
    if (missingDays > 0) {
      return `수정 후 ${input.after.dayCount}일 데이터만 있어 ${input.comparisonPeriodDays}일 비교까지 ${missingDays}일 더 필요합니다.`;
    }
    return "수정 후 데이터가 충분하지 않아 성과 변화 판단을 보류합니다.";
  }

  const { before, after, changedAtKst } = input;
  const dateLabel = formatKoreanMonthDay(changedAtKst);
  const ctaChange = computeChangePercent(before.ctaRate, after.ctaRate);
  const formChange = computeChangePercent(before.formStartRate, after.formStartRate);

  const ctaPart =
    before.ctaRate !== null && after.ctaRate !== null
      ? `CTA 전환율은 ${pct(before.ctaRate)}에서 ${pct(after.ctaRate)}로 ${
          ctaChange !== null && ctaChange >= MOVE_THRESHOLD_PERCENT
            ? "개선됐"
            : ctaChange !== null && ctaChange <= -MOVE_THRESHOLD_PERCENT
              ? "하락했"
              : "비슷했"
        }`
      : null;
  const formPart =
    before.formStartRate !== null && after.formStartRate !== null
      ? `폼 시작률은 ${pct(before.formStartRate)}에서 ${pct(after.formStartRate)}로 ${
          formChange !== null && formChange >= MOVE_THRESHOLD_PERCENT
            ? "개선"
            : formChange !== null && formChange <= -MOVE_THRESHOLD_PERCENT
              ? "하락"
              : "유지"
        }`
      : null;

  if (!ctaPart && !formPart) {
    return "수정 후 데이터가 충분하지 않아 성과 변화 판단을 보류합니다.";
  }

  const ctaUp = ctaChange !== null && ctaChange >= MOVE_THRESHOLD_PERCENT;
  const formDown = formChange !== null && formChange <= -MOVE_THRESHOLD_PERCENT;
  const ctaDown = ctaChange !== null && ctaChange <= -MOVE_THRESHOLD_PERCENT;

  if (ctaUp && formDown && ctaPart && formPart) {
    return `${dateLabel} 랜딩 수정 후 ${ctaPart}지만, ${formPart}해 CTA 이후 구간 점검이 필요합니다.`;
  }

  if (ctaUp && !formDown) {
    return `${dateLabel} 랜딩 수정 후 CTA 전환율과 폼 시작률이 함께 개선돼 수정 방향이 긍정적으로 확인됩니다.`;
  }

  if (ctaDown) {
    const tail = formPart ? `고, ${formPart}습니다.` : "습니다.";
    return `${dateLabel} 랜딩 수정 후 ${ctaPart}${tail} 이전 랜딩 복귀 또는 재점검이 필요합니다.`;
  }

  const parts = [ctaPart, formPart].filter((p): p is string => p !== null).join(", ");
  return `${dateLabel} 랜딩 수정 후 뚜렷한 개선 또는 악화 신호가 없습니다 (${parts}).`;
}
