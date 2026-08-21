import { describe, expect, it } from "vitest";
import { buildCampaignBreakdown } from "@/lib/leads-analysis/campaign-breakdown";
import type { LeadAnalysisRow } from "@/lib/leads-analysis/types";

function lead(overrides: Partial<LeadAnalysisRow>): LeadAnalysisRow {
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: "여름세일",
    utm_content: "A안",
    procedure: null,
    is_valid: true,
    outcome_status: "pending",
    consultation_status: "new",
    booking_status: "none",
    visit_status: "none",
    applied_at: "2026-08-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildCampaignBreakdown — UTM 매핑 성공", () => {
  it("Meta 광고비가 있는 utm_campaign/utm_content와 일치하는 리드는 해당 캠페인 행에 집계된다", () => {
    const spendByUtmKey = new Map([["여름세일|||A안", 100000]]);
    const rows = buildCampaignBreakdown([lead({ utm_campaign: "여름세일", utm_content: "A안" })], spendByUtmKey);

    const matched = rows.find((r) => r.campaignLabel === "여름세일");
    expect(matched).toBeDefined();
    expect(matched?.isUnmapped).toBe(false);
    expect(matched?.spend).toBe(100000);
    expect(matched?.kpi.totalDb).toBe(1);
    expect(matched?.cpa.dbCpa).toBe(100000);
  });

  it("리드가 없어도 광고비가 있는 캠페인은 0건 DB로 표시된다 (조용히 제외하지 않음)", () => {
    const spendByUtmKey = new Map([["가을세일|||B안", 50000]]);
    const rows = buildCampaignBreakdown([], spendByUtmKey);

    const row = rows.find((r) => r.campaignLabel === "가을세일");
    expect(row).toBeDefined();
    expect(row?.kpi.totalDb).toBe(0);
    expect(row?.cpa.dbCpa).toBeNull();
  });
});

describe("buildCampaignBreakdown — UTM 매핑 실패", () => {
  it("Meta 광고비에서 찾을 수 없는 utm_campaign/utm_content를 가진 리드는 '매핑되지 않음'으로 별도 표시된다", () => {
    const spendByUtmKey = new Map([["여름세일|||A안", 100000]]);
    const rows = buildCampaignBreakdown(
      [lead({ utm_campaign: "존재하지않는캠페인", utm_content: "존재하지않는소재" })],
      spendByUtmKey
    );

    const unmapped = rows.find((r) => r.isUnmapped);
    expect(unmapped).toBeDefined();
    expect(unmapped?.campaignLabel).toBe("매핑되지 않음");
    expect(unmapped?.kpi.totalDb).toBe(1);
  });

  it("매핑되지 않은 리드는 spend를 알 수 없으므로 CPA가 0이 아닌 null이다", () => {
    const rows = buildCampaignBreakdown([lead({ utm_campaign: "미확인", utm_content: "미확인" })], new Map());
    const unmapped = rows.find((r) => r.isUnmapped)!;

    expect(unmapped.cpa.dbCpa).toBeNull();
    expect(unmapped.cpa.validDbCpa).toBeNull();
  });

  it("매핑 성공 리드와 매핑 실패 리드가 섞여 있으면 둘 다 조용히 사라지지 않고 각각 표시된다", () => {
    const spendByUtmKey = new Map([["여름세일|||A안", 100000]]);
    const rows = buildCampaignBreakdown(
      [
        lead({ utm_campaign: "여름세일", utm_content: "A안" }),
        lead({ utm_campaign: "미확인", utm_content: "미확인" }),
      ],
      spendByUtmKey
    );

    expect(rows.some((r) => r.campaignLabel === "여름세일" && !r.isUnmapped)).toBe(true);
    expect(rows.some((r) => r.isUnmapped)).toBe(true);
    const totalLeadsAcrossRows = rows.reduce((acc, r) => acc + r.kpi.totalDb, 0);
    expect(totalLeadsAcrossRows).toBe(2);
  });
});
