import { describe, expect, it } from "vitest";
import { buildReportHeadline, type ReportHeadlineInput } from "@/lib/ad-performance-summary/report-text";

function baseInput(overrides: Partial<ReportHeadlineInput> = {}): ReportHeadlineInput {
  return {
    officialStartDate: null,
    operatingDayCount: null,
    firstAdDate: "2026-08-11",
    totalSpend: 1_400_000,
    hasSpendData: true,
    actualDailyAvgSpend: 100_000,
    projected30DaySpend: 3_000_000,
    totalDb: 20,
    validDb: 15,
    confirmedBookings: 5,
    validToBookingRate: 33.3,
    ...overrides,
  };
}

describe("buildReportHeadline", () => {
  it("데이터가 전혀 없으면 안내 문구만 반환한다", () => {
    const text = buildReportHeadline(baseInput({ hasSpendData: false, firstAdDate: null }));
    expect(text).toContain("아직 집계할 Meta 광고 데이터가 없습니다");
  });

  it("공식 시작일이 등록되어 있으면 '운영 N일째'를 명시한다", () => {
    const text = buildReportHeadline(
      baseInput({ officialStartDate: "2026-08-11", operatingDayCount: 14 })
    );
    expect(text).toContain("14일째");
  });

  it("공식 시작일 미등록이면 '운영 N일째'라고 단정하지 않고 데이터 기준 최초 집행일만 표시한다", () => {
    const text = buildReportHeadline(baseInput({ officialStartDate: null, operatingDayCount: null }));
    expect(text).not.toContain("일째 운영");
    expect(text).toContain("데이터 기준 최초 집행일");
  });

  it("유효 DB가 0건이면 예약 성공률을 0%로 표시하지 않는다", () => {
    const text = buildReportHeadline(baseInput({ validDb: 0, validToBookingRate: null }));
    expect(text).not.toContain("0.0%");
    expect(text).toContain("유효 DB가 없어");
  });

  it("일평균/30일 예상 데이터가 없으면 계산하지 않았다고 표시한다", () => {
    const text = buildReportHeadline(baseInput({ actualDailyAvgSpend: null, projected30DaySpend: null }));
    expect(text).toContain("계산하지 않았습니다");
  });
});
