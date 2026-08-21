import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/utm-mapping/repository", () => ({
  findUtmMappingForAd: vi.fn(),
}));

import { findUtmMappingForAd } from "@/lib/utm-mapping/repository";
import { resolveUtmForAd } from "@/lib/utm-mapping/resolve";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveUtmForAd — UTM 매핑", () => {
  it("수동 매핑이 있으면 그 값을 사용한다", async () => {
    vi.mocked(findUtmMappingForAd).mockResolvedValue({
      id: "1",
      campaign_name: "여름 세일",
      ad_name: "첫코 A",
      utm_campaign: "summer_sale_2026",
      utm_content: "ad_a_v2",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    });

    const resolved = await resolveUtmForAd("여름 세일", "첫코 A");

    expect(resolved).toEqual({
      utmCampaign: "summer_sale_2026",
      utmContent: "ad_a_v2",
      source: "manual_mapping",
    });
  });

  it("수동 매핑이 없으면 캠페인/광고 이름으로 자동 매칭한다", async () => {
    vi.mocked(findUtmMappingForAd).mockResolvedValue(null);

    const resolved = await resolveUtmForAd("여름 세일", "첫코 A");

    expect(resolved).toEqual({
      utmCampaign: "여름 세일",
      utmContent: "첫코 A",
      source: "auto_match",
    });
  });

  it("캠페인 또는 광고 이름이 없으면 null을 반환한다", async () => {
    expect(await resolveUtmForAd(null, "첫코 A")).toBeNull();
    expect(await resolveUtmForAd("여름 세일", null)).toBeNull();
    expect(findUtmMappingForAd).not.toHaveBeenCalled();
  });
});
