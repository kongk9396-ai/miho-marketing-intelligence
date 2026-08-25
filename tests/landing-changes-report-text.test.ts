import { describe, expect, it } from "vitest";
import { buildLandingChangeReportLine } from "@/lib/landing-changes/report-text";
import type { LandingPeriodMetrics } from "@/lib/landing-changes/types";

function metrics(overrides: Partial<LandingPeriodMetrics> = {}): LandingPeriodMetrics {
  return {
    dayCount: 5,
    landingViews: 500,
    ctaClicks: 100,
    ctaRate: 24.3,
    formStarts: 50,
    formStartRate: 18.2,
    formCompletes: 20,
    formCompleteRate: 40,
    landingToCtaDropoffRate: 75.7,
    ctaToFormStartDropoffRate: 81.8,
    ...overrides,
  };
}

describe("buildLandingChangeReportLine", () => {
  it("관찰 기간이 아직 안 끝났으면 관찰 중 보류 문구를 반환한다", () => {
    const line = buildLandingChangeReportLine({
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
    const line = buildLandingChangeReportLine({
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

  it("CTA 개선 + 폼시작률 하락이면 두 수치와 함께 CTA 이후 구간 점검 문구를 만든다", () => {
    const before = metrics({ ctaRate: 24.3, formStartRate: 18.2 });
    const after = metrics({ ctaRate: 31.8, formStartRate: 15.6 });
    const line = buildLandingChangeReportLine({
      changedAtKst: "2026-08-21",
      before,
      after,
      hasSufficientData: true,
      comparisonPeriodDays: 5,
      isObservationWindowComplete: true,
    });
    expect(line).toContain("24.3%");
    expect(line).toContain("31.8%");
    expect(line).toContain("18.2%");
    expect(line).toContain("15.6%");
    expect(line).toContain("CTA 이후 구간 점검");
  });

  it("CTA/폼시작률 모두 개선되면 긍정 문구를 만든다", () => {
    const before = metrics({ ctaRate: 20, formStartRate: 40 });
    const after = metrics({ ctaRate: 30, formStartRate: 50 });
    const line = buildLandingChangeReportLine({
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
