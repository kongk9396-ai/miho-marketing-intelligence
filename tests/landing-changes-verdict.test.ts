import { describe, expect, it } from "vitest";
import { evaluateLandingVerdict } from "@/lib/landing-changes/verdict-rules";
import type { LandingPeriodMetrics } from "@/lib/landing-changes/types";

function metrics(overrides: Partial<LandingPeriodMetrics> = {}): LandingPeriodMetrics {
  return {
    dayCount: 5,
    landingViews: 500,
    ctaClicks: 100,
    ctaRate: 20,
    formStarts: 50,
    formStartRate: 50,
    formCompletes: 20,
    formCompleteRate: 40,
    landingToCtaDropoffRate: 80,
    ctaToFormStartDropoffRate: 50,
    ...overrides,
  };
}

describe("evaluateLandingVerdict", () => {
  it("표본 부족이면 insufficient_data", () => {
    const result = evaluateLandingVerdict(metrics(), metrics({ landingViews: 10 }));
    expect(result.verdict).toBe("insufficient_data");
  });

  it("CTA 전환율은 개선, 폼 시작률은 하락하면 CTA 이후 구간 점검 문구를 반환한다", () => {
    const before = metrics({ ctaRate: 20, formStartRate: 50 });
    const after = metrics({ ctaRate: 30, formStartRate: 30 });
    const result = evaluateLandingVerdict(before, after);
    expect(result.verdict).toBe("neutral");
    expect(result.headline).toContain("CTA 이후 구간 점검");
  });

  it("CTA 전환율과 폼 시작률이 함께 개선되면 improved", () => {
    const before = metrics({ ctaRate: 20, formStartRate: 40 });
    const after = metrics({ ctaRate: 30, formStartRate: 45 });
    const result = evaluateLandingVerdict(before, after);
    expect(result.verdict).toBe("improved");
  });

  it("CTA 전환율이 크게 악화되면 worsened", () => {
    const before = metrics({ ctaRate: 30 });
    const after = metrics({ ctaRate: 20 });
    const result = evaluateLandingVerdict(before, after);
    expect(result.verdict).toBe("worsened");
  });
});
