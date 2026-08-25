import { formatCount, formatPercent, formatWon } from "@/lib/dashboard/format";
import { formatKoreanMonthDay } from "@/lib/date/kst";

export interface ReportHeadlineInput {
  /** User-registered official Meta start date (section 1). Null when never registered. */
  officialStartDate: string | null;
  /** today - officialStartDate + 1. Null when officialStartDate is null. */
  operatingDayCount: number | null;
  /** Earliest date with real meta_daily data — the fallback reference when no official start date exists. */
  firstAdDate: string | null;
  totalSpend: number;
  hasSpendData: boolean;
  actualDailyAvgSpend: number | null;
  projected30DaySpend: number | null;
  totalDb: number;
  validDb: number;
  confirmedBookings: number;
  validToBookingRate: number | null;
}

/**
 * The single human-readable paragraph shown at the top of the ad
 * performance summary (spec section 19). Every number is threaded through
 * from real aggregates — no field is ever synthesized here. A field with no
 * data yet is dropped from the sentence rather than filled with a
 * placeholder or a fabricated 0.
 *
 * Never claims "운영 N일째" from firstAdDate alone — that phrase only ever
 * appears when officialStartDate/operatingDayCount are both present (section
 * 1: an unregistered official date must not be treated as if it were one).
 */
export function buildReportHeadline(input: ReportHeadlineInput): string {
  if (!input.hasSpendData || !input.firstAdDate) {
    return "아직 집계할 Meta 광고 데이터가 없습니다. CSV 업로드 또는 자동 수집 후 다시 확인해주세요.";
  }

  const sentences: string[] = [];

  if (input.officialStartDate && input.operatingDayCount !== null) {
    sentences.push(
      `Meta 광고는 ${formatKoreanMonthDay(input.officialStartDate)}부터 현재 ${input.operatingDayCount}일째 운영 중이며, 현재까지 누적 ${formatWon(input.totalSpend)}을 집행했습니다.`
    );
  } else {
    sentences.push(
      `Meta 공식 시작일이 아직 등록되지 않아, 데이터 기준 최초 집행일(${formatKoreanMonthDay(input.firstAdDate)}) 기준으로 표시합니다. 현재까지 누적 ${formatWon(input.totalSpend)}을 집행했습니다.`
    );
  }

  if (input.actualDailyAvgSpend !== null && input.projected30DaySpend !== null) {
    sentences.push(
      `현재 실데이터 기준 일평균 광고비는 ${formatWon(input.actualDailyAvgSpend)}, 30일 예상 광고비는 ${formatWon(input.projected30DaySpend)}입니다.`
    );
  } else {
    sentences.push("최근 집행 데이터가 부족해 일평균/30일 예상 광고비는 계산하지 않았습니다.");
  }

  if (input.totalDb === 0) {
    sentences.push("아직 확보된 DB가 없습니다.");
  } else {
    const bookingPart =
      input.validToBookingRate !== null
        ? `유효 DB 대비 예약 성공률은 ${formatPercent(input.validToBookingRate, 1)}입니다.`
        : "유효 DB가 없어 예약 성공률은 계산하지 않았습니다.";
    sentences.push(
      `총 DB ${formatCount(input.totalDb)}건 중 유효 DB ${formatCount(input.validDb)}건, 예약 확정 ${formatCount(input.confirmedBookings)}건으로 ${bookingPart}`
    );
  }

  return sentences.join(" ");
}
