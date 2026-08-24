import { describe, expect, it } from "vitest";
import { AD_DIAGNOSIS_THRESHOLDS, computeGroupBenchmark, diagnoseAd } from "@/lib/ad-diagnosis/engine";
import type {
  AdDiagnosisAdInput,
  AdGa4Metrics,
  AdGroupBenchmark,
  AdMetaMetrics,
} from "@/lib/ad-diagnosis/types";

/**
 * Defaults land squarely in "healthy, no problem rule fires" territory:
 * ctr 1.5% (>=0.8), landing arrival 90% (>=75), cta rate 12% (>=10),
 * form start/complete rates 90%/80% (>=30 each). Each test overrides only
 * the fields relevant to the rule it's checking, same convention as
 * tests/video-analysis-diagnosis.test.ts.
 */
function metaMetrics(overrides: Partial<AdMetaMetrics> = {}): AdMetaMetrics {
  return {
    spend: 200_000,
    impressions: 10_000,
    reach: 8_000,
    frequency: 1.2,
    linkClicks: 100,
    ctr: 1.5,
    ctrSource: "count",
    cpc: 2_000,
    cpcSource: "count",
    video3s: 1_000,
    video25: 600,
    video50: 400,
    video75: 300,
    video95: 220,
    video100: 200,
    videoCompletionRate: 20,
    ...overrides,
  };
}

function ga4Metrics(overrides: Partial<AdGa4Metrics> = {}): AdGa4Metrics {
  return {
    landingSessions: 300,
    landingPageViews: 90,
    ctaClicks: 36,
    formStarts: 32,
    formCompletes: 26,
    ctaRate: 12,
    formStartRate: 88.9,
    formCompleteRate: 81.3,
    landingConversionRate: 8.7,
    formCompleteTrackingConnected: true,
    ...overrides,
  };
}

function adInput(overrides: Partial<AdDiagnosisAdInput> = {}): AdDiagnosisAdInput {
  return {
    adId: "ad_1",
    adName: "테스트 광고",
    campaignName: "테스트 캠페인",
    meta: metaMetrics(),
    ga4: ga4Metrics(),
    targeting: null,
    original: null,
    ...overrides,
  };
}

/** A benchmark that never itself pushes a rule over its threshold. */
function neutralBenchmark(overrides: Partial<AdGroupBenchmark> = {}): AdGroupBenchmark {
  return {
    groupSize: 3,
    medianCtr: 1.5,
    medianCpc: 2_000,
    medianCostPerLandingPageView: 2_222,
    avgLandingConversionRate: 8.7,
    ...overrides,
  };
}

describe("diagnoseAd — CREATIVE_PROBLEM", () => {
  it("CTR이 낮고 랜딩 도달률은 정상이면 CREATIVE_PROBLEM", () => {
    const input = adInput({ meta: metaMetrics({ ctr: 0.5 }) });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.status).toBe("CREATIVE_PROBLEM");
    expect(result.reasons.join(" ")).toContain("CTR");
  });

  it("CTR은 정상이어도 CPC가 그룹 중앙값보다 30% 이상 높고 랜딩 도달률이 정상이면 CREATIVE_PROBLEM", () => {
    const input = adInput({ meta: metaMetrics({ ctr: 1.5, cpc: 3_000 }) });
    const result = diagnoseAd(input, neutralBenchmark({ medianCpc: 2_000 }));
    expect(result.status).toBe("CREATIVE_PROBLEM");
  });
});

describe("diagnoseAd — LANDING_PROBLEM", () => {
  it("CTR과 랜딩 도달률은 정상인데 CTA 전환율이 낮으면 LANDING_PROBLEM", () => {
    const input = adInput({
      meta: metaMetrics({ ctr: 1.5 }),
      ga4: ga4Metrics({ landingSessions: 300, landingPageViews: 90, ctaClicks: 15, ctaRate: 5 }),
    });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.status).toBe("LANDING_PROBLEM");
  });
});

describe("diagnoseAd — FORM_PROBLEM", () => {
  it("CTA 전환율은 정상인데 폼 완료율이 급락하면 FORM_PROBLEM", () => {
    const input = adInput({
      meta: metaMetrics({ ctr: 1.5 }),
      ga4: ga4Metrics({
        landingSessions: 500,
        ctaClicks: 100,
        ctaRate: 20,
        formStarts: 90,
        formStartRate: 90,
        formCompletes: 5,
        formCompleteRate: 5.6,
      }),
    });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.status).toBe("FORM_PROBLEM");
    expect(result.reasons.some((r) => r.includes("폼 완료율"))).toBe(true);
  });
});

describe("diagnoseAd — TARGETING_PROBLEM", () => {
  it("퍼널 지표는 정상인데 유효 DB율이 낮으면 TARGETING_PROBLEM", () => {
    const input = adInput({
      targeting: { totalLeads: 10, validLeads: 2, validDbRate: 20 },
    });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.status).toBe("TARGETING_PROBLEM");
  });

  it("리드 데이터가 없으면 TARGETING_PROBLEM으로 단정하지 않고 판정을 보류한다", () => {
    const input = adInput({ targeting: null });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.status).not.toBe("TARGETING_PROBLEM");
  });
});

describe("diagnoseAd — form_complete 추적 미연결", () => {
  it("사이트 전체에서 form_complete가 한 건도 없으면 0%를 FORM_PROBLEM 근거로 쓰지 않는다", () => {
    const input = adInput({
      meta: metaMetrics({ ctr: 1.5, spend: 200_000 }),
      ga4: ga4Metrics({
        formCompletes: 0,
        formCompleteRate: 0,
        landingConversionRate: 0,
        formCompleteTrackingConnected: false,
      }),
    });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.status).not.toBe("FORM_PROBLEM");
    expect(result.action).not.toBe("OFF");
  });

  it("추적이 연결된 상태에서 폼 완료율이 0%면 정상적으로 FORM_PROBLEM/OFF 근거로 사용한다", () => {
    const input = adInput({
      meta: metaMetrics({ ctr: 1.5, spend: AD_DIAGNOSIS_THRESHOLDS.off.minSpendForZeroConversionCheck + 1 }),
      ga4: ga4Metrics({ formCompletes: 0, formCompleteRate: 0, formCompleteTrackingConnected: true }),
    });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.action).toBe("OFF");
  });
});

describe("diagnoseAd — HEALTHY", () => {
  it("모든 지표가 정상이면 HEALTHY", () => {
    const input = adInput();
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.status).toBe("HEALTHY");
  });
});

describe("diagnoseAd — INSUFFICIENT_DATA", () => {
  it("노출이 최소 기준 미만이면 INSUFFICIENT_DATA이고 액션은 WATCH", () => {
    const input = adInput({
      meta: metaMetrics({ impressions: AD_DIAGNOSIS_THRESHOLDS.minImpressions - 1 }),
    });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.status).toBe("INSUFFICIENT_DATA");
    expect(result.action).toBe("WATCH");
  });

  it("GA4 매핑이 없으면 0%로 단정하지 않고 INSUFFICIENT_DATA로 판정한다", () => {
    const input = adInput({ ga4: null });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.status).toBe("INSUFFICIENT_DATA");
    expect(result.reasons).toContain("GA4 데이터 없음");
  });
});

describe("diagnoseAd — OFF (버전 대비 원본 열세)", () => {
  it("원본 대비 CTR이 25% 이상 낮고 CPC가 40% 이상 높으면 OFF", () => {
    const version = adInput({
      adId: "ad_version2",
      adName: "소재A - 버전2",
      meta: metaMetrics({ ctr: 0.6, cpc: 3_000 }),
      original: { adId: "ad_original", adName: "소재A", ctr: 1.0, cpc: 2_000, costPerLandingPageView: 1_500 },
    });
    const result = diagnoseAd(version, neutralBenchmark({ medianCpc: 2_500 }));
    expect(result.action).toBe("OFF");
  });
});

describe("diagnoseAd — OFF (최소 지출 대비 전환 0건)", () => {
  it("최소 지출 기준을 넘었는데 전환이 전혀 없으면 OFF", () => {
    const input = adInput({
      meta: metaMetrics({
        spend: AD_DIAGNOSIS_THRESHOLDS.off.minSpendForZeroConversionCheck + 1,
        ctr: 1.5,
      }),
      ga4: ga4Metrics({ formCompletes: 0, formCompleteRate: 0 }),
    });
    const result = diagnoseAd(input, neutralBenchmark());
    expect(result.action).toBe("OFF");
  });
});

describe("diagnoseAd — SCALE 또는 KEEP", () => {
  it("그룹 내 CTR/CPC/랜딩 조회당 비용이 모두 최고 수준이고 GA4 전환율도 평균 이상이면 SCALE 또는 KEEP", () => {
    const input = adInput({
      meta: metaMetrics({ ctr: 2.0, cpc: 1_500, spend: 135_000 }), // spend/90 views = 1500 cost-per-view
      ga4: ga4Metrics({ landingPageViews: 90, landingConversionRate: 15 }),
    });
    const benchmark = neutralBenchmark({
      groupSize: 3,
      medianCtr: 1.0,
      medianCpc: 2_500,
      medianCostPerLandingPageView: 3_000,
      avgLandingConversionRate: 8,
    });
    const result = diagnoseAd(input, benchmark);
    expect(result.status).toBe("HEALTHY");
    expect(["SCALE", "KEEP"]).toContain(result.action);
  });

  it("그룹 최고 성과 조건을 모두 충족하면 구체적으로 SCALE을 반환한다", () => {
    const input = adInput({
      meta: metaMetrics({ ctr: 2.0, cpc: 1_500, spend: 135_000 }),
      ga4: ga4Metrics({ landingPageViews: 90, landingConversionRate: 15 }),
    });
    const benchmark = neutralBenchmark({
      groupSize: 3,
      medianCtr: 1.0,
      medianCpc: 2_500,
      medianCostPerLandingPageView: 3_000,
      avgLandingConversionRate: 8,
    });
    const result = diagnoseAd(input, benchmark);
    expect(result.action).toBe("SCALE");
  });
});

describe("computeGroupBenchmark", () => {
  it("중앙값과 평균을 null을 제외하고 계산한다", () => {
    const benchmark = computeGroupBenchmark([
      { adId: "a", ctr: 1, cpc: 1000, costPerLandingPageView: 100, landingConversionRate: 5 },
      { adId: "b", ctr: 2, cpc: 2000, costPerLandingPageView: null, landingConversionRate: 10 },
      { adId: "c", ctr: 3, cpc: 3000, costPerLandingPageView: 300, landingConversionRate: null },
    ]);
    expect(benchmark.groupSize).toBe(3);
    expect(benchmark.medianCtr).toBe(2);
    expect(benchmark.medianCpc).toBe(2000);
    expect(benchmark.medianCostPerLandingPageView).toBe(200);
    expect(benchmark.avgLandingConversionRate).toBe(7.5);
  });

  it("표본이 없으면 모든 값이 null", () => {
    const benchmark = computeGroupBenchmark([]);
    expect(benchmark.medianCtr).toBeNull();
    expect(benchmark.avgLandingConversionRate).toBeNull();
  });
});
