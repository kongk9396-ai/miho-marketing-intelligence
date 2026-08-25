import { describe, expect, it } from "vitest";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { buildRetentionFunnel, buildVideoHookMetrics } from "@/lib/video-analysis/funnel";
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

describe("buildRetentionFunnel — 25%를 기준(100%)으로 하는 유지율", () => {
  it("25% 도달 수를 100%로 하여 각 단계의 누적 유지율을 계산한다", () => {
    const metrics = aggregatePeriodMetrics([
      row({ video_plays: 1000, video_3s: 700, video_25: 500, video_50: 300, video_75: 150, video_95: 80, video_100: 60 }),
    ]);

    const funnel = buildRetentionFunnel(metrics);

    expect(funnel.map((s) => s.key)).toEqual(["video25", "video50", "video75", "video95", "video100"]);
    expect(funnel[0].cumulativeRetentionRate).toBe(100); // 500/500
    expect(funnel[1].cumulativeRetentionRate).toBeCloseTo(60, 5); // 300/500
    expect(funnel[4].cumulativeRetentionRate).toBeCloseTo(12, 5); // 60/500
  });

  it("3초 재생 수가 25% 재생 수보다 커도(혹은 작아도) 유지율이 100%를 넘거나 음수가 되지 않는다", () => {
    // Real-world case: video_3s can be smaller than video_25 because Meta
    // computes them off different denominators — the funnel must never mix them.
    const metrics = aggregatePeriodMetrics([row({ video_plays: 0, video_3s: 44755, video_25: 76089, video_50: 56478 })]);
    const funnel = buildRetentionFunnel(metrics);

    expect(funnel[0].cumulativeRetentionRate).toBe(100); // 25% stage is always its own 100% base
    expect(funnel[1].cumulativeRetentionRate).toBeCloseTo((56478 / 76089) * 100, 5);
    expect(funnel[1].cumulativeRetentionRate!).toBeLessThan(100);
    expect(funnel[1].cumulativeRetentionRate!).toBeGreaterThan(0);
  });

  it("이전 단계 대비 이탈률(drop-off)을 계산한다", () => {
    const metrics = aggregatePeriodMetrics([row({ video_25: 500, video_50: 300, video_75: 150 })]);
    const funnel = buildRetentionFunnel(metrics);

    // 25% -> 50%: (500-300)/500 = 40%
    expect(funnel[1].dropOffRate).toBeCloseTo(40, 5);
    // 50% -> 75%: (300-150)/300 = 50%
    expect(funnel[2].dropOffRate).toBeCloseTo(50, 5);
    // first stage has no previous stage
    expect(funnel[0].dropOffRate).toBeNull();
  });

  it("25%가 0이면 오류 없이 null로 처리한다", () => {
    const metrics = aggregatePeriodMetrics([row({})]);
    const funnel = buildRetentionFunnel(metrics);

    expect(funnel[0].cumulativeRetentionRate).toBeNull();
    expect(funnel.every((s) => s.count === 0)).toBe(true);
    expect(funnel[1].dropOffRate).toBeNull(); // prevCount(25%)=0
  });

  it("25% 도달 수가 신뢰 기준 미만이면 모든 단계가 reliable=false이다", () => {
    const metrics = aggregatePeriodMetrics([row({ video_25: 5, video_50: 3 })]);
    const funnel = buildRetentionFunnel(metrics);
    expect(funnel.every((s) => s.reliable === false)).toBe(true);
  });
});

describe("buildVideoHookMetrics — 3초는 별도 후킹 지표", () => {
  it("video_plays가 있으면 3초 재생률을 계산한다", () => {
    const metrics = aggregatePeriodMetrics([row({ video_plays: 1000, video_3s: 700 })]);
    const hook = buildVideoHookMetrics(metrics);
    expect(hook.video3sCount).toBe(700);
    expect(hook.video3sRate).toBeCloseTo(70, 5);
  });

  it("video_plays가 0이면 3초 재생률은 null이다 (0%로 위장하지 않는다)", () => {
    const metrics = aggregatePeriodMetrics([row({ video_plays: 0, video_3s: 44755 })]);
    const hook = buildVideoHookMetrics(metrics);
    expect(hook.video3sCount).toBe(44755);
    expect(hook.video3sRate).toBeNull();
  });
});
