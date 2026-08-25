import { describe, expect, it } from "vitest";
import { buildRetentionFunnel, findMaxDropoffLabel, buildRetentionInterpretation } from "@/lib/video-analysis/funnel";
import type { PeriodMetrics, RetentionRate } from "@/lib/creative-changes/types";

function rr(count: number, rate: number | null, reliable = true): RetentionRate {
  return { count, rate, reliable };
}

function metrics(overrides: Partial<PeriodMetrics> = {}): PeriodMetrics {
  return {
    dayCount: 5,
    totalSpend: 0,
    totalImpressions: 0,
    totalReach: 0,
    avgFrequency: null,
    totalClicks: 0,
    totalLinkClicks: 0,
    ctr: null,
    linkCtr: null,
    cpc: null,
    linkCpc: null,
    cpm: null,
    avgWatchTime: null,
    totalVideoPlays: 1000,
    video3s: rr(900, 90),
    video25: rr(700, 70),
    video50: rr(300, 30),
    video75: rr(250, 25),
    video95: rr(200, 20),
    video100: rr(180, 18),
    ...overrides,
  };
}

describe("findMaxDropoffLabel — 25%~100% 구간에서만 계산", () => {
  it("가장 큰 이탈 구간을 25%->50%로 찾는다 (3초 단계는 대상에서 제외)", () => {
    const stages = buildRetentionFunnel(metrics());
    const label = findMaxDropoffLabel(stages);
    expect(label).toContain("25%");
    expect(label).toContain("50%");
  });

  it("표본 부족(25% 도달 0건)이면 null을 반환한다", () => {
    const stages = buildRetentionFunnel(
      metrics({
        video25: rr(0, null),
        video50: rr(0, null),
        video75: rr(0, null),
        video95: rr(0, null),
        video100: rr(0, null),
      })
    );
    expect(findMaxDropoffLabel(stages)).toBeNull();
  });
});

describe("buildRetentionInterpretation", () => {
  it("최대 이탈 구간에 맞는 해석 문장을 생성한다", () => {
    const stages = buildRetentionFunnel(metrics());
    const text = buildRetentionInterpretation(stages);
    expect(text).toContain("25%→50%");
    expect(text).toContain("전반부");
  });

  it("표본 부족이면 보류 문구를 반환한다", () => {
    const stages = buildRetentionFunnel(
      metrics({
        video25: rr(0, null),
        video50: rr(0, null),
        video75: rr(0, null),
        video95: rr(0, null),
        video100: rr(0, null),
      })
    );
    expect(buildRetentionInterpretation(stages)).toContain("표본이 부족");
  });
});
