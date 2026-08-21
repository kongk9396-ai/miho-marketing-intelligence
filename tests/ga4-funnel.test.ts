import { describe, expect, it } from "vitest";
import { computeLandingFunnel } from "@/lib/ga4/funnel";
import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import type { Ga4DailyLike } from "@/lib/ga4/types";

function row(overrides: Partial<Ga4DailyLike> = {}): Ga4DailyLike {
  return {
    date: "2026-08-20",
    sessions: 0,
    users: 0,
    engaged_sessions: 0,
    page_views: 0,
    cta_clicks: 0,
    form_starts: 0,
    form_completes: 0,
    ...overrides,
  };
}

describe("computeLandingFunnel — 예시 수치 재현", () => {
  it("세션 1,000 / CTA 220 (22%) / 폼시작 90 (40.9%) / 폼완료 34 (37.8%)", () => {
    const rows = [row({ sessions: 1000, cta_clicks: 220, form_starts: 90, form_completes: 34 })];

    const stages = computeLandingFunnel(rows);

    expect(stages[0]).toMatchObject({ label: "세션", count: 1000, stepRatePercent: null });
    expect(stages[1].count).toBe(220);
    expect(stages[1].stepRatePercent).toBeCloseTo(22, 1);
    expect(stages[2].count).toBe(90);
    expect(stages[2].stepRatePercent).toBeCloseTo(40.9, 1);
    expect(stages[3].count).toBe(34);
    expect(stages[3].stepRatePercent).toBeCloseTo(37.8, 1);
  });

  it("여러 날짜의 raw 데이터를 합계 기준으로 재계산한다 (단순 평균 아님)", () => {
    const rows = [
      row({ sessions: 10, cta_clicks: 8 }), // day with a misleading 80% CTA rate
      row({ sessions: 990, cta_clicks: 100 }), // the real volume, ~10.1%
    ];

    const stages = computeLandingFunnel(rows);
    // naive average of (80% + 10.1%)/2 = 45% would be wrong
    expect(stages[1].stepRatePercent).toBeCloseTo((108 / 1000) * 100, 5);
  });
});

describe("aggregateGa4Metrics — CTA/폼 시작/폼 완료율", () => {
  it("CTA rate = ctaClicks / sessions", () => {
    const metrics = aggregateGa4Metrics([row({ sessions: 500, cta_clicks: 100 })]);
    expect(metrics.ctaRate).toBeCloseTo(20, 5);
  });

  it("form_start rate = formStarts / ctaClicks", () => {
    const metrics = aggregateGa4Metrics([row({ cta_clicks: 200, form_starts: 50 })]);
    expect(metrics.formStartRate).toBeCloseTo(25, 5);
  });

  it("form_complete rate = formCompletes / formStarts", () => {
    const metrics = aggregateGa4Metrics([row({ form_starts: 80, form_completes: 20 })]);
    expect(metrics.formCompleteRate).toBeCloseTo(25, 5);
  });

  it("분모가 0이면 null을 반환한다 (0으로 나누지 않음)", () => {
    const metrics = aggregateGa4Metrics([row({})]);
    expect(metrics.ctaRate).toBeNull();
    expect(metrics.formStartRate).toBeNull();
    expect(metrics.formCompleteRate).toBeNull();
    expect(metrics.engagementRate).toBeNull();
  });

  it("engagementRate는 일별 값 평균이 아니라 기간 합계로 재계산한다", () => {
    const rows = [
      row({ sessions: 10, engaged_sessions: 9 }), // 90% on a tiny day
      row({ sessions: 990, engaged_sessions: 99 }), // ~10% on the real-volume day
    ];
    const metrics = aggregateGa4Metrics(rows);
    expect(metrics.engagementRate).toBeCloseTo((108 / 1000) * 100, 5);
  });
});
