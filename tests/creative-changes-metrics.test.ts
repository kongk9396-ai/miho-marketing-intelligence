import { describe, expect, it } from "vitest";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import type { MetaDailyLike } from "@/lib/creative-changes/types";

function row(overrides: Partial<MetaDailyLike>): MetaDailyLike {
  return {
    date: "2026-08-13",
    spend: 0,
    impressions: 0,
    reach: 0,
    frequency: null,
    clicks: 0,
    link_clicks: 0,
    video_plays: 0,
    video_3s: 0,
    video_25: 0,
    video_50: 0,
    video_75: 0,
    video_95: 0,
    video_100: 0,
    avg_watch_time: null,
    ...overrides,
  };
}

describe("aggregatePeriodMetrics — CTR/CPC/CPM 재계산", () => {
  it("행별 값의 평균이 아니라 기간 합계 기준으로 재계산한다", () => {
    // Day 1: tiny volume with a misleadingly high CTR; Day 2: the real volume.
    const rows = [
      row({ date: "2026-08-13", impressions: 10, clicks: 5, spend: 1000 }), // CTR 50%
      row({ date: "2026-08-14", impressions: 10000, clicks: 100, spend: 100000 }), // CTR 1%
    ];

    const metrics = aggregatePeriodMetrics(rows);

    // Naive average of per-day CTR would be (50% + 1%) / 2 = 25.5% — wrong.
    // Correct: total clicks 105 / total impressions 10010 * 100.
    expect(metrics.ctr).toBeCloseTo((105 / 10010) * 100, 5);
    expect(metrics.cpc).toBeCloseTo(101000 / 105, 5);
    expect(metrics.cpm).toBeCloseTo((101000 / 10010) * 1000, 5);
  });

  it("linkCtr / linkCpc도 기간 합계 기준으로 계산한다", () => {
    const rows = [
      row({ impressions: 1000, link_clicks: 20, spend: 5000 }),
      row({ impressions: 2000, link_clicks: 40, spend: 8000 }),
    ];

    const metrics = aggregatePeriodMetrics(rows);

    expect(metrics.linkCtr).toBeCloseTo((60 / 3000) * 100, 5);
    expect(metrics.linkCpc).toBeCloseTo(13000 / 60, 5);
  });
});

describe("aggregatePeriodMetrics — frequency 처리", () => {
  it("일별 reach 합산으로 잘못 재계산하지 않고, 일별 frequency의 평균을 사용한다", () => {
    const rows = [
      row({ reach: 1000, frequency: 1.2, impressions: 1200 }),
      row({ reach: 900, frequency: 1.5, impressions: 1350 }),
    ];

    const metrics = aggregatePeriodMetrics(rows);

    // NOT total impressions / total reach (2550 / 1900 = 1.342...) — that would
    // double-count users active on both days via summed daily reach.
    expect(metrics.avgFrequency).toBeCloseTo((1.2 + 1.5) / 2, 5);
    expect(metrics.totalReach).toBe(1900);
  });

  it("frequency가 없는 행은 평균 계산에서 제외한다", () => {
    const rows = [row({ frequency: 2 }), row({ frequency: null })];
    const metrics = aggregatePeriodMetrics(rows);
    expect(metrics.avgFrequency).toBe(2);
  });
});

describe("aggregatePeriodMetrics — video retention 계산", () => {
  it("raw count와 rate를 함께 반환하고, video_plays 합계 기준으로 계산한다", () => {
    const rows = [
      row({ video_plays: 100, video_50: 40, video_100: 10 }),
      row({ video_plays: 200, video_50: 90, video_100: 30 }),
    ];

    const metrics = aggregatePeriodMetrics(rows);

    expect(metrics.totalVideoPlays).toBe(300);
    expect(metrics.video50.count).toBe(130);
    expect(metrics.video50.rate).toBeCloseTo((130 / 300) * 100, 5);
    expect(metrics.video100.count).toBe(40);
    expect(metrics.video100.rate).toBeCloseTo((40 / 300) * 100, 5);
  });

  it("video_plays 합계가 신뢰 기준 미만이면 reliable=false로 표시한다", () => {
    const rows = [row({ video_plays: 5, video_50: 2 })];
    const metrics = aggregatePeriodMetrics(rows);
    expect(metrics.video50.reliable).toBe(false);
  });
});

describe("aggregatePeriodMetrics — null/0 division 처리", () => {
  it("모든 행이 0이면 나눗셈이 필요한 지표는 null을 반환한다 (NaN/Infinity 없음)", () => {
    const metrics = aggregatePeriodMetrics([row({})]);

    expect(metrics.ctr).toBeNull();
    expect(metrics.linkCtr).toBeNull();
    expect(metrics.cpc).toBeNull();
    expect(metrics.linkCpc).toBeNull();
    expect(metrics.cpm).toBeNull();
    expect(metrics.avgWatchTime).toBeNull();
    expect(metrics.video50.rate).toBeNull();
    expect(Number.isNaN(metrics.ctr)).toBe(false);
  });

  it("빈 배열도 오류 없이 처리한다", () => {
    const metrics = aggregatePeriodMetrics([]);
    expect(metrics.dayCount).toBe(0);
    expect(metrics.totalSpend).toBe(0);
    expect(metrics.ctr).toBeNull();
  });
});
