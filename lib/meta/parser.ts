import Papa from "papaparse";
import * as XLSX from "xlsx";
import { HEADER_ALIASES, REQUIRED_FIELDS, resolveHeaderMap } from "@/lib/meta/header-aliases";
import { parseDateString, parseInteger, parseNumeric, parseRequiredNumeric } from "@/lib/meta/number-utils";
import { computeTempAdId } from "@/lib/meta/temp-ad-id";
import type { MetaDailyInsert, ParseResult, RowParseError } from "@/lib/meta/types";

export type AttachmentKind = "csv" | "xlsx";

export function detectAttachmentKind(fileName: string, mimeType?: string): AttachmentKind | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "xlsx";

  if (mimeType) {
    if (mimeType.includes("csv")) return "csv";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "xlsx";
  }

  return null;
}

function extractCsvRecords(buffer: Buffer): Record<string, unknown>[] {
  const text = buffer.toString("utf-8").replace(/^\uFEFF/, "");
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  return result.data.filter((row) => Object.keys(row).length > 0);
}

function extractXlsxRecords(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
}

/**
 * The shared "Meta parser": takes raw records (already extracted from either
 * CSV or XLSX ??see extractCsvRecords/extractXlsxRecords above) and produces
 * normalized meta_daily rows. Both the manual upload path and the Gmail
 * auto-collect path call this exact function ??do not duplicate this logic.
 */
export function normalizeMetaRows(records: Record<string, unknown>[]): ParseResult {
  if (records.length === 0) {
    return { rows: [], rowErrors: [], fatalError: "?뚯씪???곗씠???됱씠 ?놁뒿?덈떎." };
  }

  const headerMap = resolveHeaderMap(Object.keys(records[0]));

  // Meta 기간 합산 보고서 감지
  //
  // 예:
  // 보고 시작 = 2026-08-24
  // 보고 종료 = 2026-08-31
  //
  // 이런 파일은 8일 전체 실적을 하나의 행으로 합산한 보고서일 수 있다.
  // 이를 meta_daily에 8/24 하루치로 저장하면 광고비가 잘못 집계된다.
  const reportingStartHeader = headerMap["reporting_start"];
  const reportingEndHeader = headerMap["reporting_end"];

  if (reportingStartHeader && reportingEndHeader) {
    const rangePairs = new Set(
      records
        .map((record) => {
          const start = String(record[reportingStartHeader] ?? "").trim();
          const end = String(record[reportingEndHeader] ?? "").trim();
          return start && end ? `${start}|${end}` : "";
        })
        .filter(Boolean)
    );

    const hasMultiDayAggregate = [...rangePairs].some((pair) => {
      const [start, end] = pair.split("|");
      return start && end && start !== end;
    });

    if (hasMultiDayAggregate) {
      return {
        rows: [],
        rowErrors: [],
        fatalError:
          "기간 합산 Meta 보고서입니다. 여러 날짜의 광고비를 하루 데이터로 저장하면 집계가 왜곡되므로 저장하지 않았습니다. Meta 보고서를 일별(Day) 기준으로 내보내면 자동으로 정상 저장됩니다.",
      };
    }
  }

  const missingRequired = REQUIRED_FIELDS.filter((field) => !headerMap[field]);
  if (missingRequired.length > 0) {
    return {
      rows: [],
      rowErrors: [],
      fatalError: `?꾩닔 而щ읆???놁뒿?덈떎: ${missingRequired.join(", ")}`,
    };
  }

  const rows: MetaDailyInsert[] = [];
  const rowErrors: RowParseError[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for header row
    const get = (field: string): unknown => {
      const header = headerMap[field];
      return header ? record[header] : undefined;
    };

    const date = parseDateString(get("date"));
    if (!date) {
      rowErrors.push({ rowNumber, message: "?좎쭨 媛믪쓣 ?몄떇?????놁뒿?덈떎." });
      return;
    }

    const campaignName = nullableString(get("campaign_name"));
    const adsetName = nullableString(get("adset_name"));
    const adName = nullableString(get("ad_name"));

    // Meta's report exports frequently include a grand-total row (metrics
    // summed across every ad in the report) with every name column blank.
    // That row is not a real ad ??storing it would double-count spend and
    // impressions on top of the real per-ad rows already in the same file.
    // 광고명/캠페인명이 모두 없는 행은 Meta의 전체 합계행이다.
    // 개별 광고 행의 합과 중복되므로 meta_daily에는 저장하지 않는다.
    if (!campaignName && !adName) {
      return;
    }

    // A real ad_id always wins when present; a missing column or an empty
    // cell for this specific row falls back to a stable hash of
    // campaign/adset/ad name instead of failing the row.
    const realAdId = String(get("ad_id") ?? "").trim();
    const adId =
      realAdId ||
      computeTempAdId(
        campaignName ?? "(전체 캠페인)",
        adsetName ?? "(전체 광고세트)",
        adName ?? "(전체 광고)"
      );
    const isTempAdId = !realAdId;

    rows.push({
      date,
      account_name: nullableString(get("account_name")),
      campaign_id: nullableString(get("campaign_id")),
      campaign_name: campaignName,
      adset_id: nullableString(get("adset_id")),
      adset_name: adsetName,
      ad_id: adId,
      is_temp_ad_id: isTempAdId,
      ad_name: adName,
      spend: parseRequiredNumeric(get("spend")),
      impressions: parseInteger(get("impressions")),
      reach: parseInteger(get("reach")),
      frequency: parseNumeric(get("frequency")),
      clicks: parseInteger(get("clicks")),
      link_clicks: parseInteger(get("link_clicks")),
      ctr: parseNumeric(get("ctr")),
      link_ctr: parseNumeric(get("link_ctr")),
      cpc: parseNumeric(get("cpc")),
      link_cpc: parseNumeric(get("link_cpc")),
      cpm: parseNumeric(get("cpm")),
      video_plays: parseInteger(get("video_plays")),
      video_3s: parseInteger(get("video_3s")),
      video_25: parseInteger(get("video_25")),
      video_50: parseInteger(get("video_50")),
      video_75: parseInteger(get("video_75")),
      video_95: parseInteger(get("video_95")),
      video_100: parseInteger(get("video_100")),
      avg_watch_time: parseNumeric(get("avg_watch_time")),
    });
  });

  return { rows, rowErrors };
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

export interface ParseFileInput {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
}

export function parseMetaReportFile({ buffer, fileName, mimeType }: ParseFileInput): {
  kind: AttachmentKind | null;
  result: ParseResult;
} {
  const kind = detectAttachmentKind(fileName, mimeType);

  if (kind === null) {
    return {
      kind: null,
      result: { rows: [], rowErrors: [], fatalError: "吏?먰븯吏 ?딅뒗 ?뚯씪 ?뺤떇?낅땲??" },
    };
  }

  const records = kind === "csv" ? extractCsvRecords(buffer) : extractXlsxRecords(buffer);
  return { kind, result: normalizeMetaRows(records) };
}

export { HEADER_ALIASES };

