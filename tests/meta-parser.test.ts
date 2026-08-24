import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseMetaReportFile } from "@/lib/meta/parser";

const CSV_HEADERS = "Day,Campaign name,Campaign ID,Ad name,Ad ID,Amount spent (KRW),Impressions,Clicks (all)";

describe("parseMetaReportFile — CSV", () => {
  it("정상적인 CSV 첨부파일을 처리한다", () => {
    const csv = [
      CSV_HEADERS,
      "2026-08-20,여름 프로모션,1001,여름 광고 A,ad-1,120000,5000,120",
      "2026-08-20,여름 프로모션,1001,여름 광고 B,ad-2,98000,4200,95",
    ].join("\n");

    const { kind, result } = parseMetaReportFile({
      buffer: Buffer.from(csv, "utf-8"),
      fileName: "meta_report.csv",
    });

    expect(kind).toBe("csv");
    expect(result.fatalError).toBeUndefined();
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      date: "2026-08-20",
      ad_id: "ad-1",
      is_temp_ad_id: false,
      campaign_name: "여름 프로모션",
      spend: 120000,
      impressions: 5000,
      clicks: 120,
    });
  });

  it("필수 컬럼(date, campaign_name, ad_name)이 없으면 fatalError를 반환한다", () => {
    const csv = ["Amount spent (KRW)", "120000"].join("\n");

    const { result } = parseMetaReportFile({
      buffer: Buffer.from(csv, "utf-8"),
      fileName: "invalid.csv",
    });

    expect(result.rows).toHaveLength(0);
    expect(result.fatalError).toContain("필수 컬럼");
    expect(result.fatalError).toContain("date");
    expect(result.fatalError).toContain("campaign_name");
    expect(result.fatalError).toContain("ad_name");
  });

  it("Ad ID 컬럼이 없어도 필수 컬럼(date/campaign_name/ad_name)만 있으면 fatalError 없이 처리된다", () => {
    const csv = [
      "Day,Campaign name,Ad name,Amount spent (KRW),Impressions",
      "2026-08-20,여름 프로모션,여름 광고 A,120000,5000",
    ].join("\n");

    const { result } = parseMetaReportFile({
      buffer: Buffer.from(csv, "utf-8"),
      fileName: "no_ad_id.csv",
    });

    expect(result.fatalError).toBeUndefined();
    expect(result.rows).toHaveLength(1);
  });

  it("날짜가 비어 있으면 해당 행만 건너뛰고, 광고 ID가 비어 있는 행은 건너뛰지 않고 임시 ID를 생성해 포함한다", () => {
    const csv = [
      CSV_HEADERS,
      "2026-08-20,캠페인,1001,광고 A,ad-1,10000,100,5",
      ",캠페인,1001,광고 B,ad-2,10000,100,5", // missing date -> skipped
      "2026-08-20,캠페인,1001,광고 C,,10000,100,5", // missing ad id -> temp id, not skipped
    ].join("\n");

    const { result } = parseMetaReportFile({
      buffer: Buffer.from(csv, "utf-8"),
      fileName: "partial.csv",
    });

    expect(result.rows).toHaveLength(2);
    expect(result.rowErrors).toHaveLength(1);
    expect(result.rowErrors[0].message).toContain("날짜");

    const realRow = result.rows.find((r) => r.ad_name === "광고 A");
    expect(realRow).toMatchObject({ ad_id: "ad-1", is_temp_ad_id: false });

    const tempRow = result.rows.find((r) => r.ad_name === "광고 C");
    expect(tempRow?.is_temp_ad_id).toBe(true);
    expect(tempRow?.ad_id).toMatch(/^temp:/);
  });
});

describe("parseMetaReportFile — 임시 ad_id 생성 (ad_id 없는 CSV)", () => {
  it("Ad ID 컬럼 자체가 없는 파일의 모든 행에 campaign/adset/ad 이름 기반 임시 ID를 부여한다", () => {
    const csv = [
      "Day,Campaign name,Ad set name,Ad name,Amount spent (KRW)",
      "2026-08-20,여름 프로모션,세트1,여름 광고 A,120000",
      "2026-08-20,여름 프로모션,세트1,여름 광고 B,98000",
    ].join("\n");

    const { result } = parseMetaReportFile({
      buffer: Buffer.from(csv, "utf-8"),
      fileName: "no_ad_id.csv",
    });

    expect(result.fatalError).toBeUndefined();
    expect(result.rows).toHaveLength(2);
    for (const row of result.rows) {
      expect(row.is_temp_ad_id).toBe(true);
      expect(row.ad_id).toMatch(/^temp:[0-9a-f]{64}$/);
    }
    // Different ads (different ad_name) must get different temp ids.
    expect(result.rows[0].ad_id).not.toBe(result.rows[1].ad_id);
  });

  it("같은 campaign/adset/ad 이름 조합이면 서로 다른 업로드에서도 동일한 임시 ID를 생성한다 (재업로드 안정성)", () => {
    const csv = ["Day,Campaign name,Ad name,Amount spent (KRW)", "2026-08-20,여름 프로모션,여름 광고 A,120000"].join(
      "\n"
    );

    const first = parseMetaReportFile({ buffer: Buffer.from(csv, "utf-8"), fileName: "a.csv" });
    const second = parseMetaReportFile({ buffer: Buffer.from(csv, "utf-8"), fileName: "b.csv" });

    expect(first.result.rows[0].ad_id).toBe(second.result.rows[0].ad_id);
  });

  it("실제 Ad ID가 있으면 반드시 실제 값을 우선 사용한다", () => {
    const csv = [
      "Day,Campaign name,Ad name,Ad ID,Amount spent (KRW)",
      "2026-08-20,여름 프로모션,여름 광고 A,real-ad-123,120000",
    ].join("\n");

    const { result } = parseMetaReportFile({ buffer: Buffer.from(csv, "utf-8"), fileName: "real.csv" });

    expect(result.rows[0]).toMatchObject({ ad_id: "real-ad-123", is_temp_ad_id: false });
  });
});

describe("parseMetaReportFile — 한국어 컬럼 alias", () => {
  it("한국어 Meta Ads Manager 컬럼명(일/캠페인 이름/광고 이름 등)을 인식한다", () => {
    const csv = [
      "일,캠페인 이름,광고세트 이름,광고 이름,지출 금액 (KRW),노출,클릭",
      "2026-08-20,여름 프로모션,세트1,여름 광고 A,120000,5000,120",
    ].join("\n");

    const { result } = parseMetaReportFile({ buffer: Buffer.from(csv, "utf-8"), fileName: "korean.csv" });

    expect(result.fatalError).toBeUndefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      date: "2026-08-20",
      campaign_name: "여름 프로모션",
      adset_name: "세트1",
      ad_name: "여름 광고 A",
      spend: 120000,
      impressions: 5000,
      clicks: 120,
    });
  });

  it("'일' 컬럼만으로 날짜를 인식하고, Ad ID 없이도 정상 처리한다 (분석 데이터 분류 CSV)", () => {
    const csv = ["일,캠페인 이름,광고 이름,지출 금액", "2026-08-20,코 첫수술 캠페인,후킹 영상 A,50000"].join("\n");

    const { result } = parseMetaReportFile({ buffer: Buffer.from(csv, "utf-8"), fileName: "analysis.csv" });

    expect(result.fatalError).toBeUndefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe("2026-08-20");
    expect(result.rows[0].is_temp_ad_id).toBe(true);
  });
});

describe("parseMetaReportFile — XLSX", () => {
  it("정상적인 XLSX 첨부파일을 처리한다", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Day", "Campaign name", "Ad name", "Ad ID", "Amount spent (KRW)", "Impressions"],
      ["2026-08-20", "가을 프로모션", "가을 광고", "ad-9", "50000", "2000"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const { kind, result } = parseMetaReportFile({ buffer, fileName: "meta_report.xlsx" });

    expect(kind).toBe("xlsx");
    expect(result.fatalError).toBeUndefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      date: "2026-08-20",
      ad_id: "ad-9",
      ad_name: "가을 광고",
      spend: 50000,
      impressions: 2000,
    });
  });
});

describe("parseMetaReportFile — 지원하지 않는 형식", () => {
  it("csv/xlsx가 아닌 파일은 kind가 null이고 오류를 반환한다", () => {
    const { kind, result } = parseMetaReportFile({
      buffer: Buffer.from("hello"),
      fileName: "notes.txt",
    });

    expect(kind).toBeNull();
    expect(result.fatalError).toBe("지원하지 않는 파일 형식입니다.");
  });
});
