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
      campaign_name: "여름 프로모션",
      spend: 120000,
      impressions: 5000,
      clicks: 120,
    });
  });

  it("필수 컬럼(Day, Ad ID)이 없으면 fatalError를 반환한다", () => {
    const csv = ["Campaign name,Amount spent (KRW)", "여름 프로모션,120000"].join("\n");

    const { result } = parseMetaReportFile({
      buffer: Buffer.from(csv, "utf-8"),
      fileName: "invalid.csv",
    });

    expect(result.rows).toHaveLength(0);
    expect(result.fatalError).toContain("필수 컬럼");
  });

  it("행 단위로 날짜 또는 광고 ID가 비어 있으면 해당 행만 건너뛴다", () => {
    const csv = [
      CSV_HEADERS,
      "2026-08-20,캠페인,1001,광고 A,ad-1,10000,100,5",
      ",캠페인,1001,광고 B,ad-2,10000,100,5", // missing date
      "2026-08-20,캠페인,1001,광고 C,,10000,100,5", // missing ad id
    ].join("\n");

    const { result } = parseMetaReportFile({
      buffer: Buffer.from(csv, "utf-8"),
      fileName: "partial.csv",
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rowErrors).toHaveLength(2);
  });
});

describe("parseMetaReportFile — XLSX", () => {
  it("정상적인 XLSX 첨부파일을 처리한다", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Day", "Ad ID", "Ad name", "Amount spent (KRW)", "Impressions"],
      ["2026-08-20", "ad-9", "가을 광고", "50000", "2000"],
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
