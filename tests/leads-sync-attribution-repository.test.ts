import { describe, expect, it } from "vitest";
import { attributionMatchKey, fetchAttributionMatchMap, parseAttributionRecords } from "@/lib/leads-sync/attribution-repository";

describe("parseAttributionRecords", () => {
  it("source_sheet/source_row 컬럼이 있으면 utm 값들을 정상 파싱한다", () => {
    const records = parseAttributionRecords([
      {
        source_sheet: "코첫",
        source_row: "5",
        submitted_at: "2026-08-20 10:00",
        landing_name: "첫코 랜딩",
        utm_source: "meta",
        utm_medium: "paid_social",
        utm_campaign: "firstnose",
        utm_content: "creative_a",
        result_status: "",
        booking_status: "",
      },
    ]);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      sourceSheet: "코첫",
      sourceRow: 5,
      landingName: "첫코 랜딩",
      utmSource: "meta",
      utmMedium: "paid_social",
      utmCampaign: "firstnose",
      utmContent: "creative_a",
    });
  });

  it("source_sheet/source_row 컬럼 자체가 없으면 임의로 추측하지 않고 빈 배열을 반환한다", () => {
    const records = parseAttributionRecords([{ utm_campaign: "firstnose", utm_content: "creative_a" }]);
    expect(records).toHaveLength(0);
  });

  it("source_row가 숫자가 아니면 그 행은 건너뛴다", () => {
    const records = parseAttributionRecords([{ source_sheet: "코첫", source_row: "abc", utm_campaign: "firstnose" }]);
    expect(records).toHaveLength(0);
  });
});

describe("attributionMatchKey", () => {
  it("같은 시트명+행번호는 같은 키, 다르면 다른 키", () => {
    expect(attributionMatchKey("코첫", 5)).toBe(attributionMatchKey("코첫", 5));
    expect(attributionMatchKey("코첫", 5)).not.toBe(attributionMatchKey("눈", 5));
    expect(attributionMatchKey("코첫", 5)).not.toBe(attributionMatchKey("코첫", 6));
  });
});

describe("fetchAttributionMatchMap", () => {
  it("탭이 없거나 조회가 실패하면 null을 반환한다 (동기화 전체를 실패시키지 않음)", async () => {
    const map = await fetchAttributionMatchMap("marketing_attribution", async () => {
      throw new Error("Unable to parse range: marketing_attribution");
    });
    expect(map).toBeNull();
  });

  it("행이 있는데 source_sheet/source_row 컬럼이 없으면(형식이 다르면) null을 반환한다", async () => {
    const map = await fetchAttributionMatchMap("marketing_attribution", async () => [{ 엉뚱한컬럼: "값" }]);
    expect(map).toBeNull();
  });

  it("정상 형식이면 (source_sheet, source_row) -> record 맵을 반환한다", async () => {
    const map = await fetchAttributionMatchMap("marketing_attribution", async () => [
      { source_sheet: "코첫", source_row: "2", utm_campaign: "firstnose", utm_content: "creative_a" },
      { source_sheet: "코첫", source_row: "3", utm_campaign: "firstnose", utm_content: "creative_b" },
    ]);
    expect(map).not.toBeNull();
    expect(map!.size).toBe(2);
    expect(map!.get(attributionMatchKey("코첫", 2))?.utmContent).toBe("creative_a");
  });

  it("빈 시트(행 0개)는 빈 맵을 반환한다 (null이 아님 — 형식은 알 수 없지만 실패는 아님)", async () => {
    const map = await fetchAttributionMatchMap("marketing_attribution", async () => []);
    expect(map).not.toBeNull();
    expect(map!.size).toBe(0);
  });
});
