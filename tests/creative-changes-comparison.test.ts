import { describe, expect, it } from "vitest";
import { buildMetricComparisons } from "@/lib/creative-changes/comparison";
import type { PeriodMetrics } from "@/lib/creative-changes/types";

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

describe("buildMetricComparisons — 영상 지표 raw count 표시", () => {
  it("영상 재생률 표시에 rate와 raw count를 함께 담는다", () => {
    const before = periodMetrics({});
    const after = periodMetrics({ video50: { count: 320, rate: 32, reliable: true } });

    const rows = buildMetricComparisons(before, after);
    const video50Row = rows.find((r) => r.key === "video50")!;

    expect(video50Row.beforeDisplay).toContain("30.0%");
    expect(video50Row.beforeDisplay).toContain("300");
    expect(video50Row.afterDisplay).toContain("32.0%");
    expect(video50Row.afterDisplay).toContain("320");
  });
});

describe("buildMetricComparisons — 표본 부족 판정", () => {
  it("전/후 어느 한쪽이라도 신뢰 기준 미만이면 표본 부족 상태로 표시한다", () => {
    const before = periodMetrics({});
    const after = periodMetrics({ video50: { count: 5, rate: 50, reliable: false } }); // huge % change but unreliable

    const rows = buildMetricComparisons(before, after);
    const video50Row = rows.find((r) => r.key === "video50")!;

    expect(video50Row.status).toBe("unavailable");
    expect(video50Row.statusLabel).toBe("표본 부족");
  });

  it("전/후 모두 신뢰 가능하면 표본 부족으로 표시하지 않는다", () => {
    const before = periodMetrics({});
    const after = periodMetrics({ video50: { count: 320, rate: 32, reliable: true } });

    const rows = buildMetricComparisons(before, after);
    const video50Row = rows.find((r) => r.key === "video50")!;

    expect(video50Row.statusLabel).not.toBe("표본 부족");
  });

  it("영상 지표가 아닌 항목(CTR 등)은 reliability 판정과 무관하다", () => {
    const before = periodMetrics({});
    const after = periodMetrics({ ctr: 3.05 }); // flat change
    const rows = buildMetricComparisons(before, after);
    const ctrRow = rows.find((r) => r.key === "ctr")!;
    expect(ctrRow.statusLabel).not.toBe("표본 부족");
  });
});
