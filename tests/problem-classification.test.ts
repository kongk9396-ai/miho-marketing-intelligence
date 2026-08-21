import { describe, expect, it } from "vitest";
import { classifyProblemArea, PROBLEM_THRESHOLDS } from "@/lib/combined-analysis/problem-classification";
import type { PeriodMetrics } from "@/lib/creative-changes/types";
import type { Ga4PeriodMetrics } from "@/lib/ga4/metrics";

function metaMetrics(overrides: Partial<PeriodMetrics> = {}): PeriodMetrics {
  return {
    dayCount: 7,
    totalSpend: 300000,
    totalImpressions: 20000,
    totalReach: 15000,
    avgFrequency: 1.3,
    totalClicks: 400,
    totalLinkClicks: 350,
    ctr: 2,
    linkCtr: 1.75,
    cpc: 750,
    linkCpc: 850,
    cpm: 15000,
    avgWatchTime: 5,
    totalVideoPlays: 2000,
    video3s: { count: 1000, rate: 50, reliable: true },
    video25: { count: 800, rate: 40, reliable: true },
    video50: { count: 600, rate: 30, reliable: true },
    video75: { count: 400, rate: 20, reliable: true },
    video95: { count: 200, rate: 10, reliable: true },
    video100: { count: 160, rate: 8, reliable: true },
    ...overrides,
  };
}

function ga4Metrics(overrides: Partial<Ga4PeriodMetrics> = {}): Ga4PeriodMetrics {
  return {
    totalSessions: 1000,
    totalUsers: 900,
    totalEngagedSessions: 600,
    engagementRate: 60,
    totalPageViews: 1200,
    totalCtaClicks: 220,
    totalFormStarts: 90,
    totalFormCompletes: 34,
    ctaRate: 22,
    formStartRate: 40.9,
    formCompleteRate: 37.8,
    ...overrides,
  };
}

describe("classifyProblemArea — 광고 소재 문제 판정", () => {
  it("CTR 급락 + CPC 급등이지만 랜딩 전환은 유지되면 creative_problem", () => {
    const result = classifyProblemArea({
      metaBefore: metaMetrics({ ctr: 2.26, cpc: 889 }),
      metaAfter: metaMetrics({ ctr: 2.01, cpc: 1214 }), // CTR -11.1%, CPC +36.6%
      ga4Before: ga4Metrics({ ctaRate: 22, formStartRate: 40 }),
      ga4After: ga4Metrics({ ctaRate: 22.5, formStartRate: 41 }), // landing basically unchanged
    });

    expect(result.classification).toBe("creative_problem");
  });
});

describe("classifyProblemArea — 랜딩 문제 판정", () => {
  it("Meta CTR/CPC는 안정적인데 CTA율 또는 폼 시작률이 급락하면 landing_problem", () => {
    const result = classifyProblemArea({
      metaBefore: metaMetrics({ ctr: 2, cpc: 800 }),
      metaAfter: metaMetrics({ ctr: 2.02, cpc: 795 }), // ~stable
      ga4Before: ga4Metrics({ ctaRate: 22, formStartRate: 40 }),
      ga4After: ga4Metrics({ ctaRate: 10, formStartRate: 18 }), // sharp drop
    });

    expect(result.classification).toBe("landing_problem");
  });
});

describe("classifyProblemArea — 광고+랜딩 동시 문제", () => {
  it("Meta 지표와 GA4 전환이 함께 악화되면 both_problem", () => {
    const result = classifyProblemArea({
      metaBefore: metaMetrics({ ctr: 2.26, cpc: 889 }),
      metaAfter: metaMetrics({ ctr: 2.01, cpc: 1214 }),
      ga4Before: ga4Metrics({ ctaRate: 22, formStartRate: 40 }),
      ga4After: ga4Metrics({ ctaRate: 10, formStartRate: 18 }),
    });

    expect(result.classification).toBe("both_problem");
  });
});

describe("classifyProblemArea — 데이터 부족 판정", () => {
  it("노출/클릭/세션이 기준 이하면 insufficient_data", () => {
    const result = classifyProblemArea({
      metaBefore: metaMetrics(),
      metaAfter: metaMetrics({
        totalImpressions: PROBLEM_THRESHOLDS.minImpressions - 1,
        totalClicks: PROBLEM_THRESHOLDS.minClicks - 1,
      }),
      ga4Before: ga4Metrics(),
      ga4After: ga4Metrics({ totalSessions: PROBLEM_THRESHOLDS.minSessions - 1 }),
    });

    expect(result.classification).toBe("insufficient_data");
  });

  it("모든 지표가 안정적이면 no_issue", () => {
    const stable = metaMetrics();
    const result = classifyProblemArea({
      metaBefore: stable,
      metaAfter: stable,
      ga4Before: ga4Metrics(),
      ga4After: ga4Metrics(),
    });

    expect(result.classification).toBe("no_issue");
  });
});
