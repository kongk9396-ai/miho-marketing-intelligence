import { describe, expect, it } from "vitest";
import { buildCreativeChangeReportLine } from "@/lib/creative-changes/report-text";
import type { PeriodMetrics } from "@/lib/creative-changes/types";

function metrics(overrides: Partial<PeriodMetrics> = {}): PeriodMetrics {
  return {
    dayCount: 5,
    totalSpend: 0,
    totalImpressions: 10000,
    totalReach: 0,
    avgFrequency: null,
    totalClicks: 0,
    totalLinkClicks: 0,
    ctr: 1.2,
    linkCtr: null,
    cpc: null,
    linkCpc: null,
    cpm: null,
    avgWatchTime: null,
    totalVideoPlays: 1000,
    video3s: { count: 900, rate: 90, reliable: true },
    video25: { count: 700, rate: 70, reliable: true },
    video50: { count: 300, rate: 30, reliable: true },
    video75: { count: 250, rate: 25, reliable: true },
    video95: { count: 200, rate: 20, reliable: true },
    video100: { count: 180, rate: 18, reliable: true },
    ...overrides,
  };
}

describe("buildCreativeChangeReportLine", () => {
  it("관찰 기간이 아직 안 끝났으면 관찰 중 보류 문구를 반환한다", () => {
    const line = buildCreativeChangeReportLine({
      changedAtKst: "2026-08-21",
      before: metrics(),
      after: metrics(),
      hasSufficientData: false,
      comparisonPeriodDays: 5,
      isObservationWindowComplete: false,
    });
    expect(line).toContain("관찰 기간");
  });

  it("관찰 기간은 끝났지만 일별 데이터가 부족하면 정확히 며칠 부족한지 표시한다", () => {
    const line = buildCreativeChangeReportLine({
      changedAtKst: "2026-08-21",
      before: metrics(),
      after: metrics({ dayCount: 2 }),
      hasSufficientData: false,
      comparisonPeriodDays: 5,
      isObservationWindowComplete: true,
    });
    expect(line).toContain("2일 데이터만 있어");
    expect(line).toContain("5일 비교까지 3일 더 필요");
  });

  it("CTR 개선 + 시청 유지율 하락이면 이전 소재가 더 우수하다는 문구를 만든다", () => {
    const before = metrics({ ctr: 1.0, video3s: { count: 900, rate: 90, reliable: true }, video50: { count: 300, rate: 30, reliable: true } });
    const after = metrics({ ctr: 1.5, video3s: { count: 700, rate: 70, reliable: true }, video50: { count: 150, rate: 15, reliable: true } });
    const line = buildCreativeChangeReportLine({
      changedAtKst: "2026-08-21",
      before,
      after,
      hasSufficientData: true,
      comparisonPeriodDays: 5,
      isObservationWindowComplete: true,
    });
    expect(line).toContain("이전 소재가 더 우수");
  });

  it("CTR과 유지율이 함께 개선되면 긍정 문구를 만든다", () => {
    const before = metrics({ ctr: 1.0, video3s: { count: 800, rate: 80, reliable: true }, video50: { count: 200, rate: 20, reliable: true } });
    const after = metrics({ ctr: 1.5, video3s: { count: 900, rate: 90, reliable: true }, video50: { count: 300, rate: 30, reliable: true } });
    const line = buildCreativeChangeReportLine({
      changedAtKst: "2026-08-21",
      before,
      after,
      hasSufficientData: true,
      comparisonPeriodDays: 5,
      isObservationWindowComplete: true,
    });
    expect(line).toContain("긍정적");
  });
});
