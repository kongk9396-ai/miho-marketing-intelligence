import { describe, expect, it } from "vitest";
import { aggregatePeriodMetrics, MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE } from "@/lib/creative-changes/metrics";
import { VERDICT_THRESHOLDS } from "@/lib/creative-changes/verdict-rules";
import { buildCreativeRankings, type VideoAdMetrics } from "@/lib/video-analysis/ranking";
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

function ad(adId: string, adName: string, rows: MetaDailyLike[]): VideoAdMetrics {
  return { adId, adName, metrics: aggregatePeriodMetrics(rows) };
}

describe("buildCreativeRankings — 정렬", () => {
  it("각 카테고리에서 값이 높은 순으로 상위 목록을 만든다", () => {
    const ads = [
      ad("a", "A", [row({ video_plays: 1000, video_3s: 900, impressions: 5000, clicks: 100 })]), // 90%
      ad("b", "B", [row({ video_plays: 1000, video_3s: 500, impressions: 5000, clicks: 50 })]), // 50%
      ad("c", "C", [row({ video_plays: 1000, video_3s: 700, impressions: 5000, clicks: 70 })]), // 70%
    ];

    const rankings = buildCreativeRankings(ads, 2);
    const earlyRetention = rankings.find((r) => r.category === "earlyRetention")!;

    expect(earlyRetention.top.map((e) => e.adId)).toEqual(["a", "c"]);
  });
});

describe("buildCreativeRankings — 표본 부족 제외", () => {
  it("영상 재생 수가 신뢰 기준 미만인 광고는 재생 기반 랭킹에서 제외하고 별도로 표시한다", () => {
    const ads = [
      ad("a", "A", [row({ video_plays: 1000, video_3s: 900 })]),
      ad("low", "Low sample", [row({ video_plays: MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE - 1, video_3s: 5 })]),
    ];

    const rankings = buildCreativeRankings(ads);
    const earlyRetention = rankings.find((r) => r.category === "earlyRetention")!;

    expect(earlyRetention.top.some((e) => e.adId === "low")).toBe(false);
    expect(earlyRetention.insufficientSample.map((e) => e.adId)).toContain("low");
  });

  it("CTR 랭킹은 노출 수 기준으로 표본 부족을 판단한다", () => {
    const ads = [
      ad("a", "A", [row({ impressions: VERDICT_THRESHOLDS.minImpressions, clicks: 100 })]),
      ad("low", "Low impressions", [row({ impressions: VERDICT_THRESHOLDS.minImpressions - 1, clicks: 5 })]),
    ];

    const rankings = buildCreativeRankings(ads);
    const clickEfficiency = rankings.find((r) => r.category === "clickEfficiency")!;

    expect(clickEfficiency.insufficientSample.map((e) => e.adId)).toContain("low");
  });
});

describe("buildCreativeRankings — 빈 입력", () => {
  it("광고가 없어도 오류 없이 빈 랭킹을 반환한다", () => {
    const rankings = buildCreativeRankings([]);
    expect(rankings).toHaveLength(4);
    expect(rankings.every((r) => r.top.length === 0)).toBe(true);
  });
});
