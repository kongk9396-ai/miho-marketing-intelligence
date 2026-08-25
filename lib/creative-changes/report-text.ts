import { computeChangePercent } from "@/lib/change-percent";
import { formatKoreanMonthDay } from "@/lib/date/kst";
import type { PeriodMetrics } from "@/lib/creative-changes/types";

const MOVE_THRESHOLD_PERCENT = 5;

function pct(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

export interface CreativeReportLineInput {
  changedAtKst: string;
  before: PeriodMetrics;
  after: PeriodMetrics;
  hasSufficientData: boolean;
  /** The registered comparison window (3/5/7/custom days) — used only to explain a shortfall precisely. */
  comparisonPeriodDays: number;
  /** False = the after-window's calendar days haven't fully elapsed yet (still observing). True = the window elapsed but meta_daily simply has fewer dated rows than that many days (e.g. a period-aggregate CSV import). */
  isObservationWindowComplete: boolean;
}

/**
 * The 1-2 sentence rule-based summary shown under a creative (릴스) change's
 * before/after comparison (spec section 10). Rule-based only — no AI API.
 * Mirrors lib/landing-changes/report-text.ts but judges Meta CTR + video
 * retention (3초 시청률 / 50% 유지율) instead of the GA4 landing funnel.
 */
export function buildCreativeChangeReportLine(input: CreativeReportLineInput): string {
  if (!input.hasSufficientData) {
    if (!input.isObservationWindowComplete) {
      return "아직 관찰 기간이 끝나지 않아 판단을 보류합니다.";
    }
    const missingDays = input.comparisonPeriodDays - input.after.dayCount;
    if (missingDays > 0) {
      return `수정 후 ${input.after.dayCount}일 데이터만 있어 ${input.comparisonPeriodDays}일 비교까지 ${missingDays}일 더 필요합니다 (일별 세부 데이터 부족 — 기간 합계로 업로드된 CSV는 날짜별로 분리되지 않습니다).`;
    }
    return "수정 후 데이터가 충분하지 않아 판단을 보류합니다.";
  }

  const { before, after, changedAtKst } = input;
  const dateLabel = formatKoreanMonthDay(changedAtKst);
  const ctrChange = computeChangePercent(before.ctr, after.ctr);
  const video3sChange = computeChangePercent(before.video3s.rate, after.video3s.rate);
  const video50Change = computeChangePercent(before.video50.rate, after.video50.rate);

  const ctrUp = ctrChange !== null && ctrChange >= MOVE_THRESHOLD_PERCENT;
  const ctrDown = ctrChange !== null && ctrChange <= -MOVE_THRESHOLD_PERCENT;
  const retentionDown =
    (video3sChange !== null && video3sChange <= -MOVE_THRESHOLD_PERCENT) ||
    (video50Change !== null && video50Change <= -MOVE_THRESHOLD_PERCENT);
  const retentionUp =
    (video3sChange === null || video3sChange >= -MOVE_THRESHOLD_PERCENT) &&
    (video50Change === null || video50Change >= -MOVE_THRESHOLD_PERCENT);

  const ctrPart =
    before.ctr !== null && after.ctr !== null ? `CTR은 ${pct(before.ctr)}에서 ${pct(after.ctr)}로 ${ctrUp ? "개선됐" : ctrDown ? "하락했" : "비슷했"}` : null;

  if (!ctrPart && video3sChange === null && video50Change === null) {
    return "수정 후 데이터가 충분하지 않아 판단을 보류합니다.";
  }

  if (ctrUp && retentionDown) {
    return `${dateLabel} 영상 수정 후 ${ctrPart}지만 3초 시청률과 50% 유지율이 하락해 초반 후킹은 이전 소재가 더 우수한 것으로 확인됩니다.`;
  }

  if (ctrUp && retentionUp) {
    return `${dateLabel} 영상 수정 후 CTR과 주요 시청 구간 유지율이 함께 개선돼 수정 방향이 긍정적으로 확인됩니다.`;
  }

  if (ctrDown) {
    return `${dateLabel} 영상 수정 후 ${ctrPart ?? "CTR이 하락했"}습니다. 이전 소재 복귀 또는 재점검이 필요합니다.`;
  }

  return `${dateLabel} 영상 수정 후 뚜렷한 개선 또는 악화 신호가 없습니다${ctrPart ? ` (${ctrPart}습니다)` : ""}.`;
}
