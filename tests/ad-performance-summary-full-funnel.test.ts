import { describe, expect, it } from "vitest";
import { buildFullFunnel, type FullFunnelInput } from "@/lib/ad-performance-summary/full-funnel";

function baseInput(overrides: Partial<FullFunnelInput> = {}): FullFunnelInput {
  return {
    hasMetaData: true,
    metaImpressions: 10000,
    metaVideoPlays3s: 4000,
    metaLinkClicks: 200,
    hasGa4Data: true,
    ga4LandingViews: 180,
    ga4CtaClicks: 90,
    ga4FormStarts: 40,
    hasLeadsData: true,
    totalDb: 20,
    validDb: 15,
    confirmedBookings: 5,
    ...overrides,
  };
}

describe("buildFullFunnel", () => {
  it("동일 소스 내 구간은 전환율을 계산한다", () => {
    const stages = buildFullFunnel(baseInput());
    const video3s = stages.find((s) => s.key === "video3s")!;
    expect(video3s.conversionFromPrevious).toBeCloseTo(40, 5);
  });

  it("서로 다른 추적 소스 경계(클릭->랜딩, 폼시작->DB)는 전환율을 억지로 만들지 않는다", () => {
    const stages = buildFullFunnel(baseInput());
    const landingViews = stages.find((s) => s.key === "landingViews")!;
    const totalDb = stages.find((s) => s.key === "totalDb")!;
    expect(landingViews.conversionFromPrevious).toBeNull();
    expect(totalDb.conversionFromPrevious).toBeNull();
    expect(landingViews.note).toBeTruthy();
    expect(totalDb.note).toBeTruthy();
  });

  it("데이터 소스가 없으면 count는 0이 아니라 null이다", () => {
    const stages = buildFullFunnel(baseInput({ hasLeadsData: false }));
    const totalDb = stages.find((s) => s.key === "totalDb")!;
    expect(totalDb.count).toBeNull();
  });
});
