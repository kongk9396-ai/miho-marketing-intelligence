import { describe, expect, it } from "vitest";
import { computeMetaRateFallback } from "@/lib/ad-diagnosis/meta-rate-fallback";
import type { MetaDailyWithRates } from "@/lib/creative-changes/types";

function row(overrides: Partial<MetaDailyWithRates> = {}): MetaDailyWithRates {
  return {
    date: "2026-08-20",
    spend: 20000,
    impressions: 1000,
    reach: 800,
    frequency: 1.2,
    clicks: 0,
    link_clicks: 10,
    video_plays: 0,
    video_3s: 0,
    video_25: 0,
    video_50: 0,
    video_75: 0,
    video_95: 0,
    video_100: 0,
    avg_watch_time: null,
    ctr: null,
    link_ctr: null,
    cpc: null,
    link_cpc: null,
    cpm: null,
    ...overrides,
  };
}

describe("computeMetaRateFallback — raw counts present", () => {
  it("clicks(전체) 합계가 0보다 크면 정확히 재계산하고 count를 출처로 표시한다", () => {
    const rows = [row({ clicks: 20, impressions: 1000, spend: 20000 })];
    const result = computeMetaRateFallback(rows, { spend: 20000, impressions: 1000, clicks: 20, linkClicks: 15 });
    expect(result.ctr).toBeCloseTo(2, 5);
    expect(result.ctrSource).toBe("count");
    expect(result.cpc).toBeCloseTo(1000, 5);
    expect(result.cpcSource).toBe("count");
  });

  it("clicks(전체)가 0이어도 link_clicks 합계가 있으면 실제 카운트로 정확히 계산한다 (count)", () => {
    const rows = [row({ clicks: 0, link_clicks: 15, impressions: 1000, spend: 20000 })];
    const result = computeMetaRateFallback(rows, { spend: 20000, impressions: 1000, clicks: 0, linkClicks: 15 });
    expect(result.ctr).toBeCloseTo(1.5, 5);
    expect(result.ctrSource).toBe("count");
    expect(result.cpc).toBeCloseTo(20000 / 15, 5);
    expect(result.cpcSource).toBe("count");
  });
});

describe("computeMetaRateFallback — raw counts 없고 원본 ctr/link_ctr만 있는 경우", () => {
  it("clicks/link_clicks 모두 0이어도 원본 ctr 컬럼이 있으면 0%로 표시하지 않고 원본값 기반으로 복원한다", () => {
    const rows = [
      row({ clicks: 0, link_clicks: 0, impressions: 1330, spend: 20157, ctr: 2.1053 }),
      row({ clicks: 0, link_clicks: 0, impressions: 1029, spend: 19248, ctr: 3.1098 }),
    ];
    const totals = { spend: 39405, impressions: 2359, clicks: 0, linkClicks: 0 };
    const result = computeMetaRateFallback(rows, totals);

    expect(result.ctrSource).toBe("raw_metric");
    expect(result.ctr).not.toBe(0);
    // implied clicks: 1330*0.021053 + 1029*0.031098 ≈ 28 + 32 = 60; ctr = 60/2359*100
    expect(result.ctr).toBeCloseTo(((1330 * 0.021053 + 1029 * 0.031098) / 2359) * 100, 3);
  });

  it("원본 ctr 컬럼이 없고 link_ctr만 있으면 link_ctr을 사용한다", () => {
    const rows = [row({ clicks: 0, link_clicks: 0, impressions: 1000, spend: 20000, ctr: null, link_ctr: 1.5 })];
    const totals = { spend: 20000, impressions: 1000, clicks: 0, linkClicks: 0 };
    const result = computeMetaRateFallback(rows, totals);
    expect(result.ctrSource).toBe("raw_metric");
    expect(result.ctr).toBeCloseTo(1.5, 5);
  });

  it("원본 cpc 컬럼도 없으면 ctr로부터 유추한 클릭 수로 CPC를 복원한다 (raw_metric)", () => {
    const rows = [row({ clicks: 0, link_clicks: 0, impressions: 1330, spend: 20157, ctr: 2.1053, cpc: null })];
    const totals = { spend: 20157, impressions: 1330, clicks: 0, linkClicks: 0 };
    const result = computeMetaRateFallback(rows, totals);

    expect(result.cpcSource).toBe("raw_metric");
    expect(result.cpc).not.toBeNull();
    expect(result.cpc).toBeGreaterThan(0);
  });

  it("원본 cpc 컬럼이 있으면 ctr 유추보다 그 값을 우선 사용한다", () => {
    const rows = [
      row({ clicks: 0, link_clicks: 0, impressions: 1000, spend: 20000, ctr: 2, cpc: 1500 }),
      row({ clicks: 0, link_clicks: 0, impressions: 1000, spend: 20000, ctr: 2, cpc: 1500 }),
    ];
    const totals = { spend: 40000, impressions: 2000, clicks: 0, linkClicks: 0 };
    const result = computeMetaRateFallback(rows, totals);
    // impliedClicksFromCpc per row = 20000/1500 = 13.33, total spend 40000 / (2*13.33) = 1500
    expect(result.cpc).toBeCloseTo(1500, 1);
    expect(result.cpcSource).toBe("raw_metric");
  });

  it("원본 cpc 컬럼이 없고 link_cpc만 있으면 link_cpc를 사용한다", () => {
    const rows = [row({ clicks: 0, link_clicks: 0, impressions: 1000, spend: 20000, cpc: null, link_cpc: 1500 })];
    const totals = { spend: 20000, impressions: 1000, clicks: 0, linkClicks: 0 };
    const result = computeMetaRateFallback(rows, totals);
    expect(result.cpcSource).toBe("raw_metric");
    expect(result.cpc).toBeCloseTo(1500, 1);
  });
});

describe("computeMetaRateFallback — 원본 데이터가 전혀 없는 경우", () => {
  it("clicks/link_clicks도 0이고 원본 ctr/cpc/link_ctr/link_cpc도 없으면 0으로 조작하지 않고 null(데이터 없음)을 반환한다", () => {
    const rows = [row({ clicks: 0, link_clicks: 0, ctr: null, cpc: null, link_ctr: null, link_cpc: null })];
    const totals = { spend: 20000, impressions: 1000, clicks: 0, linkClicks: 0 };
    const result = computeMetaRateFallback(rows, totals);

    expect(result.ctr).toBeNull();
    expect(result.ctrSource).toBe("none");
    expect(result.cpc).toBeNull();
    expect(result.cpcSource).toBe("none");
  });
});
