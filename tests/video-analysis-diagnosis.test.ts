import { describe, expect, it } from "vitest";
import { diagnoseVideo, VIDEO_DIAGNOSIS_THRESHOLDS } from "@/lib/video-analysis/diagnosis";
import type { PeriodMetrics } from "@/lib/creative-changes/types";

/**
 * Defaults are deliberately chosen so that NO diagnosis rule fires:
 * early drop-off 20% (<70), mid drop-off 20% (<40), late drop-off 33.3% (<40),
 * video100 rate 20% with ctr 1.5% (so the low_click_conversion AND doesn't hold).
 * Each test overrides only the fields relevant to the rule it's checking.
 */
function periodMetrics(overrides: Partial<PeriodMetrics>): PeriodMetrics {
  return {
    dayCount: 5,
    totalSpend: 100000,
    totalImpressions: 10000,
    totalReach: 8000,
    avgFrequency: 1.2,
    totalClicks: 150,
    totalLinkClicks: 130,
    ctr: 1.5,
    linkCtr: 1.3,
    cpc: 667,
    linkCpc: 770,
    cpm: 10000,
    avgWatchTime: 5,
    totalVideoPlays: 1000,
    video3s: { count: 800, rate: 80, reliable: true },
    video25: { count: 500, rate: 50, reliable: true },
    video50: { count: 400, rate: 40, reliable: true },
    video75: { count: 300, rate: 30, reliable: true },
    video95: { count: 200, rate: 20, reliable: true },
    video100: { count: 200, rate: 20, reliable: true },
    ...overrides,
  };
}

describe("diagnoseVideo — 표본 부족", () => {
  it("재생 수가 임계값 미만이면 표본 부족 하나만 반환한다", () => {
    const metrics = periodMetrics({ totalVideoPlays: VIDEO_DIAGNOSIS_THRESHOLDS.minVideoPlaysForDiagnosis - 1 });
    const insights = diagnoseVideo(metrics);
    expect(insights).toHaveLength(1);
    expect(insights[0].key).toBe("insufficient_data");
  });
});

describe("diagnoseVideo — 초반 훅 약화", () => {
  it("재생 대비 3초 유지 이탈이 임계값 이상이면 경고를 반환한다", () => {
    const metrics = periodMetrics({
      video3s: { count: 200, rate: 20, reliable: true }, // 80% drop-off
    });
    const insights = diagnoseVideo(metrics);
    expect(insights.some((i) => i.key === "early_hook_weak")).toBe(true);
  });

  it("3초 이탈이 임계값 미만이면 경고를 반환하지 않는다", () => {
    const metrics = periodMetrics({}); // default: 20% drop-off
    const insights = diagnoseVideo(metrics);
    expect(insights.some((i) => i.key === "early_hook_weak")).toBe(false);
  });
});

describe("diagnoseVideo — 중반 이탈", () => {
  it("25%→50% 구간 급락이면 경고를 반환한다", () => {
    const metrics = periodMetrics({
      video25: { count: 500, rate: 50, reliable: true },
      video50: { count: 200, rate: 20, reliable: true }, // 60% drop
    });
    const insights = diagnoseVideo(metrics);
    expect(insights.some((i) => i.key === "mid_message_drop")).toBe(true);
  });
});

describe("diagnoseVideo — 후반 이탈", () => {
  it("75%→100% 구간 급락이면 경고를 반환한다", () => {
    const metrics = periodMetrics({
      video75: { count: 300, rate: 30, reliable: true },
      video100: { count: 50, rate: 5, reliable: true }, // ~83% drop
    });
    const insights = diagnoseVideo(metrics);
    expect(insights.some((i) => i.key === "late_cta_review")).toBe(true);
  });
});

describe("diagnoseVideo — 유지율 대비 클릭 유도력", () => {
  it("완주율은 높은데 CTR이 낮으면 경고를 반환한다", () => {
    const metrics = periodMetrics({
      video100: { count: 250, rate: 25, reliable: true },
      ctr: 0.5,
    });
    const insights = diagnoseVideo(metrics);
    expect(insights.some((i) => i.key === "low_click_conversion")).toBe(true);
  });
});

describe("diagnoseVideo — 후속 퍼널 확인 필요", () => {
  it("CTR이 높으면 GA4/DB 확인이 필요하다는 안내를 포함한다", () => {
    const metrics = periodMetrics({ ctr: 3 });
    const insights = diagnoseVideo(metrics);
    expect(insights.some((i) => i.key === "funnel_followup_needed")).toBe(true);
  });
});

describe("diagnoseVideo — 문제 없음", () => {
  it("어떤 경고 규칙에도 해당하지 않으면 문제 없음 안내를 반환한다", () => {
    const metrics = periodMetrics({});
    const insights = diagnoseVideo(metrics);
    expect(insights.some((i) => i.key === "no_issue")).toBe(true);
    expect(insights.filter((i) => i.severity === "warning")).toHaveLength(0);
  });

  it("과도한 단정을 하지 않는다 — 임계값에 못 미치면 경고를 만들지 않는다", () => {
    const metrics = periodMetrics({});
    const insights = diagnoseVideo(metrics);
    const warnings = insights.filter((i) => i.severity === "warning");
    expect(warnings).toHaveLength(0);
  });
});
