import { describe, expect, it } from "vitest";
import { evaluateVerdict, VERDICT_THRESHOLDS } from "@/lib/creative-changes/verdict-rules";
import { evaluateObservation } from "@/lib/creative-changes/observation-status";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import type { MetaDailyLike, PeriodMetrics } from "@/lib/creative-changes/types";

function periodMetrics(overrides: Partial<PeriodMetrics>): PeriodMetrics {
  return {
    dayCount: 5,
    totalSpend: 100000,
    totalImpressions: 10000,
    totalReach: 8000,
    avgFrequency: 1.2,
    totalClicks: 300,
    totalLinkClicks: 250,
    ctr: 3,
    linkCtr: 2.5,
    cpc: 333,
    linkCpc: 400,
    cpm: 10000,
    avgWatchTime: 5,
    totalVideoPlays: 1000,
    video3s: { count: 500, rate: 50, reliable: true },
    video25: { count: 400, rate: 40, reliable: true },
    video50: { count: 300, rate: 30, reliable: true },
    video75: { count: 200, rate: 20, reliable: true },
    video95: { count: 100, rate: 10, reliable: true },
    video100: { count: 80, rate: 8, reliable: true },
    ...overrides,
  };
}

describe("evaluateVerdict — 악화 판정", () => {
  it("CTR 큰 폭 하락 + CPC 큰 폭 상승이면 worsened를 반환한다", () => {
    const before = periodMetrics({ ctr: 2.26, cpc: 889 });
    const after = periodMetrics({ ctr: 2.01, cpc: 1214 }); // CTR -11.1%, CPC +36.6%

    const result = evaluateVerdict(before, after);

    expect(result.verdict).toBe("worsened");
    expect(result.reasons.some((r) => r.includes("CTR"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("CPC"))).toBe(true);
  });

  it("영상 시청 지표(50% 시청률 + 완주율) 큰 폭 하락으로도 worsened를 반환한다", () => {
    const before = periodMetrics({
      ctr: 3,
      cpc: 300,
      video50: { count: 300, rate: 30, reliable: true },
      video100: { count: 80, rate: 8, reliable: true },
    });
    const after = periodMetrics({
      ctr: 3.05, // 거의 변화 없음 — CTR/CPC 조건은 만족하지 않음
      cpc: 300,
      video50: { count: 300, rate: 30 * (1 - 0.2), reliable: true }, // -20%
      video100: { count: 80, rate: 8 * (1 - 0.3), reliable: true }, // -30%
    });

    const result = evaluateVerdict(before, after);

    expect(result.verdict).toBe("worsened");
  });
});

describe("evaluateVerdict — 개선 판정", () => {
  it("CTR 큰 폭 상승 + CPC 큰 폭 하락이면 improved를 반환한다", () => {
    const before = periodMetrics({ ctr: 2, cpc: 1000 });
    const after = periodMetrics({ ctr: 2.5, cpc: 800 }); // CTR +25%, CPC -20%

    const result = evaluateVerdict(before, after);

    expect(result.verdict).toBe("improved");
  });
});

describe("evaluateVerdict — 데이터 부족", () => {
  it("노출/클릭이 임계값 미만이면 insufficient_data를 반환한다", () => {
    const before = periodMetrics({ ctr: 2, cpc: 1000 });
    const after = periodMetrics({
      ctr: 5,
      cpc: 100,
      totalImpressions: VERDICT_THRESHOLDS.minImpressions - 1,
      totalClicks: VERDICT_THRESHOLDS.minClicks - 1,
    });

    const result = evaluateVerdict(before, after);

    expect(result.verdict).toBe("insufficient_data");
  });
});

describe("evaluateVerdict — null/0 division 처리", () => {
  it("이전 값이 0이거나 없으면 오류 없이 처리한다", () => {
    const before = periodMetrics({ ctr: null, cpc: null });
    const after = periodMetrics({ ctr: 3, cpc: 300 });

    expect(() => evaluateVerdict(before, after)).not.toThrow();
    const result = evaluateVerdict(before, after);
    expect(result.verdict === "neutral" || result.verdict === "improved" || result.verdict === "worsened").toBe(
      true
    );
  });

  it("완전히 데이터가 없는 기간(0으로 채워진 raw rows)도 오류 없이 판정한다", () => {
    const empty = aggregatePeriodMetrics([] as MetaDailyLike[]);
    expect(() => evaluateVerdict(empty, empty)).not.toThrow();
    expect(evaluateVerdict(empty, empty).verdict).toBe("insufficient_data");
  });
});

describe("evaluateObservation — 관찰 상태 전이", () => {
  const before = periodMetrics({ ctr: 2.26, cpc: 889 });
  const after = periodMetrics({ ctr: 2.01, cpc: 1214, totalImpressions: 10000, totalClicks: 300 });

  it("관찰 기간이 끝나지 않았으면 observing이다", () => {
    const evaluation = evaluateObservation({
      changedAt: "2026-08-18T10:00:00.000Z",
      comparisonPeriodDays: 5,
      before,
      after,
      now: new Date("2026-08-20T10:00:00.000Z"),
    });
    expect(evaluation.status).toBe("observing");
  });

  it("관찰 완료 + 악화 판정이면 rollback_review이다", () => {
    const evaluation = evaluateObservation({
      changedAt: "2026-08-18T10:00:00.000Z",
      comparisonPeriodDays: 5,
      before,
      after,
      now: new Date("2026-08-24T10:00:00.000Z"),
    });
    expect(evaluation.status).toBe("rollback_review");
  });

  it("관찰 완료 + 개선 판정이면 winner_confirmed이다", () => {
    const improvedAfter = periodMetrics({ ctr: 3, cpc: 700, totalImpressions: 10000, totalClicks: 300 });
    const evaluation = evaluateObservation({
      changedAt: "2026-08-18T10:00:00.000Z",
      comparisonPeriodDays: 5,
      before,
      after: improvedAfter,
      now: new Date("2026-08-24T10:00:00.000Z"),
    });
    expect(evaluation.status).toBe("winner_confirmed");
  });

  it("관찰 완료 + 데이터 부족이면 insufficient_data이다", () => {
    const lowDataAfter = periodMetrics({ totalImpressions: 10, totalClicks: 1 });
    const evaluation = evaluateObservation({
      changedAt: "2026-08-18T10:00:00.000Z",
      comparisonPeriodDays: 5,
      before,
      after: lowDataAfter,
      now: new Date("2026-08-24T10:00:00.000Z"),
    });
    expect(evaluation.status).toBe("insufficient_data");
  });
});
