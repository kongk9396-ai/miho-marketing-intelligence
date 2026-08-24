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
  const text = buffer.toString("utf-8").replace(/^﻿/, "");
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
 * CSV or XLSX — see extractCsvRecords/extractXlsxRecords above) and produces
 * normalized meta_daily rows. Both the manual upload path and the Gmail
 * auto-collect path call this exact function — do not duplicate this logic.
 */
export function normalizeMetaRows(records: Record<string, unknown>[]): ParseResult {
  if (records.length === 0) {
    return { rows: [], rowErrors: [], fatalError: "파일에 데이터 행이 없습니다." };
  }

  const headerMap = resolveHeaderMap(Object.keys(records[0]));
  const missingRequired = REQUIRED_FIELDS.filter((field) => !headerMap[field]);
  if (missingRequired.length > 0) {
    return {
      rows: [],
      rowErrors: [],
      fatalError: `필수 컬럼이 없습니다: ${missingRequired.join(", ")}`,
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
      rowErrors.push({ rowNumber, message: "날짜 값을 인식할 수 없습니다." });
      return;
    }

    const campaignName = nullableString(get("campaign_name"));
    const adsetName = nullableString(get("adset_name"));
    const adName = nullableString(get("ad_name"));

    // Meta's report exports frequently include a grand-total row (metrics
    // summed across every ad in the report) with every name column blank.
    // That row is not a real ad — storing it would double-count spend and
    // impressions on top of the real per-ad rows already in the same file.
    if (!campaignName && !adName) {
      rowErrors.push({ rowNumber, message: "캠페인/광고 이름이 없는 합계(요약) 행으로 판단되어 건너뜁니다." });
      return;
    }

    // A real ad_id always wins when present; a missing column or an empty
    // cell for this specific row falls back to a stable hash of
    // campaign/adset/ad name instead of failing the row.
    const realAdId = String(get("ad_id") ?? "").trim();
    const adId = realAdId || computeTempAdId(campaignName, adsetName, adName);
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
      result: { rows: [], rowErrors: [], fatalError: "지원하지 않는 파일 형식입니다." },
    };
  }

  const records = kind === "csv" ? extractCsvRecords(buffer) : extractXlsxRecords(buffer);
  return { kind, result: normalizeMetaRows(records) };
}

export { HEADER_ALIASES };
