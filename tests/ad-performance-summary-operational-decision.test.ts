import { describe, expect, it } from "vitest";
import { mapToOperationalRecommendation, buildAdOperationalDecisions } from "@/lib/ad-performance-summary/operational-decision";
import type { AdDiagnosisResult } from "@/lib/ad-diagnosis/types";
import type { AdOperationalStatusRecord } from "@/lib/ad-operations/types";

function result(overrides: Partial<AdDiagnosisResult> = {}): AdDiagnosisResult {
  return {
    adId: "ad_1",
    adName: "소재A",
    campaignName: "캠페인A",
    status: "HEALTHY",
    action: "KEEP",
    reasons: ["CTR 1.20%", "CPC ₩1,000"],
    recommendations: [],
    metrics: {
      spend: 0,
      impressions: 0,
      linkClicks: 0,
      ctr: null,
      ctrSource: "none",
      cpc: null,
      cpcSource: "none",
      landingPageViews: null,
      costPerLandingPageView: null,
      landingArrivalRate: null,
      ctaRate: null,
      formStartRate: null,
      formCompleteRate: null,
      landingConversionRate: null,
      formCompleteTrackingConnected: true,
      videoCompletionRate: null,
      video25: 0,
      video50: 0,
      video75: 0,
      video95: 0,
      video100: 0,
    },
    ...overrides,
  };
}

describe("mapToOperationalRecommendation", () => {
  it("action OFF -> OFF_REVIEW (never auto-OFF)", () => {
    expect(mapToOperationalRecommendation(result({ action: "OFF" }))).toBe("OFF_REVIEW");
  });

  it("action SCALE -> SCALE_REVIEW", () => {
    expect(mapToOperationalRecommendation(result({ action: "SCALE" }))).toBe("SCALE_REVIEW");
  });

  it("action WATCH + status CREATIVE_PROBLEM -> CREATIVE_FIX", () => {
    expect(mapToOperationalRecommendation(result({ action: "WATCH", status: "CREATIVE_PROBLEM" }))).toBe(
      "CREATIVE_FIX"
    );
  });

  it("action WATCH + status LANDING_PROBLEM -> LANDING_FIX", () => {
    expect(mapToOperationalRecommendation(result({ action: "WATCH", status: "LANDING_PROBLEM" }))).toBe(
      "LANDING_FIX"
    );
  });

  it("action WATCH + other status -> WATCH", () => {
    expect(mapToOperationalRecommendation(result({ action: "WATCH", status: "INSUFFICIENT_DATA" }))).toBe(
      "WATCH"
    );
  });
});

describe("buildAdOperationalDecisions", () => {
  it("시스템 추천(OFF_REVIEW)과 실제 OFF 상태를 구분해서 함께 반환한다", () => {
    const statusRecord: AdOperationalStatusRecord = {
      id: "status-1",
      campaign_name: "캠페인A",
      ad_name: "소재A",
      ad_id: null,
      status: "OFF",
      status_changed_at: "2026-08-24",
      reason: "CPC 열세",
      memo: null,
      created_at: "2026-08-24T00:00:00.000Z",
      updated_at: "2026-08-24T00:00:00.000Z",
    };
    const statuses = new Map([["캠페인A|||소재A", statusRecord]]);
    const decisions = buildAdOperationalDecisions([result({ action: "OFF" })], statuses, new Map());

    expect(decisions[0].recommendation).toBe("OFF_REVIEW");
    expect(decisions[0].actualStatus?.status).toBe("OFF");
  });

  it("운영 상태가 기록되지 않은 광고는 actualStatus가 null이다", () => {
    const decisions = buildAdOperationalDecisions([result()], new Map(), new Map());
    expect(decisions[0].actualStatus).toBeNull();
  });
});
