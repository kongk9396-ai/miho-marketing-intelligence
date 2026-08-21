import { describe, expect, it } from "vitest";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { buildRetentionFunnel } from "@/lib/video-analysis/funnel";
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

describe("buildRetentionFunnel", () => {
  it("재생을 100%로 하여 각 단계의 유지율을 계산한다", () => {
    const metrics = aggregatePeriodMetrics([
      row({ video_plays: 1000, video_3s: 700, video_25: 500, video_50: 300, video_75: 150, video_95: 80, video_100: 60 }),
    ]);

    const funnel = buildRetentionFunnel(metrics);

    expect(funnel.map((s) => s.key)).toEqual(["plays", "video3s", "video25", "video50", "video75", "video95", "video100"]);
    expect(funnel[0].retentionRate).toBe(100);
    expect(funnel[1].retentionRate).toBeCloseTo(70, 5); // 700/1000
    expect(funnel[6].retentionRate).toBeCloseTo(6, 5); // 60/1000
  });

  it("이전 단계 대비 이탈률(drop-off)을 계산한다", () => {
    const metrics = aggregatePeriodMetrics([row({ video_plays: 1000, video_3s: 700, video_25: 500 })]);
    const funnel = buildRetentionFunnel(metrics);

    // plays -> 3s: (1000-700)/1000 = 30%
    expect(funnel[1].dropOffRate).toBeCloseTo(30, 5);
    // 3s -> 25%: (700-500)/700 = 28.57%
    expect(funnel[2].dropOffRate).toBeCloseTo(((700 - 500) / 700) * 100, 5);
    // first stage has no previous stage
    expect(funnel[0].dropOffRate).toBeNull();
  });

  it("재생이 0이면 오류 없이 null/0으로 처리한다", () => {
    const metrics = aggregatePeriodMetrics([row({})]);
    const funnel = buildRetentionFunnel(metrics);

    expect(funnel[0].retentionRate).toBeNull();
    expect(funnel.every((s) => s.count === 0)).toBe(true);
    expect(funnel[1].dropOffRate).toBeNull(); // prevCount(plays)=0
  });

  it("재생 수가 신뢰 기준 미만이면 모든 단계가 reliable=false이다", () => {
    const metrics = aggregatePeriodMetrics([row({ video_plays: 5, video_3s: 3 })]);
    const funnel = buildRetentionFunnel(metrics);
    expect(funnel.every((s) => s.reliable === false)).toBe(true);
  });
});
