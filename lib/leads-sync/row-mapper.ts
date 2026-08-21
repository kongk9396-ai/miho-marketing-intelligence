import { LEADS_REQUIRED_FIELDS, resolveLeadsHeaderMap } from "@/lib/leads-sync/header-aliases";
import { parseSheetDateTime } from "@/lib/leads-sync/parse-date";
import { computeLeadKey } from "@/lib/leads-sync/lead-key";
import {
  deriveBookingStatus,
  deriveIsValid,
  normalizeConsultationStatus,
  normalizeOutcomeStatus,
} from "@/lib/leads-sync/status-mapping";
import type { LeadUpsertRow, MapSheetRowsResult } from "@/lib/leads-sync/types";

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

export interface SheetRowSource {
  sheetName: string;
  procedureLabel: string | null;
  columnOverrides: Record<string, string>;
}

/**
 * Raw sheet records (header -> cell text, from row-oriented conversion of
 * the sheet's values) -> normalized leads upsert rows. A row without a
 * recognizable applied_at is skipped, never inserted with a guessed date.
 *
 * Patient name / birth date / raw phone number are never read into the
 * returned rows — phone is read only to feed computeLeadKey and is
 * discarded immediately after.
 */
export function mapSheetRows(records: Record<string, unknown>[], source: SheetRowSource): MapSheetRowsResult {
  if (records.length === 0) return { rows: [], skipped: [] };

  const headerMap = resolveLeadsHeaderMap(Object.keys(records[0]), source.columnOverrides);
  const missingRequired = LEADS_REQUIRED_FIELDS.filter((field) => !headerMap[field]);
  if (missingRequired.length > 0) {
    return {
      rows: [],
      skipped: [
        {
          sheetName: source.sheetName,
          rowNumber: 0,
          reason: `필수 컬럼을 찾을 수 없습니다: ${missingRequired.join(", ")}`,
        },
      ],
    };
  }

  const rows: LeadUpsertRow[] = [];
  const skipped: MapSheetRowsResult["skipped"] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for header row
    const get = (field: string): unknown => {
      const header = headerMap[field];
      return header ? record[header] : undefined;
    };

    const appliedAtIso = parseSheetDateTime(get("applied_at"));
    if (!appliedAtIso) {
      skipped.push({ sheetName: source.sheetName, rowNumber, reason: "신청날짜 값을 인식할 수 없습니다." });
      return;
    }

    const utmCampaign = nullableString(get("utm_campaign"));
    const utmContent = nullableString(get("utm_content"));
    const phone = nullableString(get("phone"));
    const leadKey = computeLeadKey({ appliedAtIso, phone, utmCampaign, utmContent });

    const outcomeRaw = nullableString(get("outcome_raw"));
    const outcomeStatus = normalizeOutcomeStatus(outcomeRaw);

    const latestCallResultRaw =
      [get("call_result_4"), get("call_result_3"), get("call_result_2"), get("call_result_1")]
        .map(nullableString)
        .find((v) => v !== null) ?? null;
    const consultationStatus = normalizeConsultationStatus(latestCallResultRaw);
    const bookingStatus = deriveBookingStatus(outcomeStatus, consultationStatus);

    rows.push({
      lead_key: leadKey,
      source_row_number: rowNumber,
      applied_at: appliedAtIso,
      preferred_visit_at: parseSheetDateTime(get("preferred_visit_at")),
      utm_source: nullableString(get("utm_source")),
      utm_medium: nullableString(get("utm_medium")),
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      landing_name: nullableString(get("landing_name")),
      procedure: source.procedureLabel,
      is_valid: deriveIsValid(outcomeStatus),
      invalid_reason: outcomeStatus === "invalid" ? outcomeRaw : null,
      outcome_status: outcomeStatus,
      consultant: nullableString(get("consultant")),
      consultation_status: consultationStatus,
      booking_status: bookingStatus,
      // No visit-tracking column has been identified in the sheet yet — left
      // at its schema default rather than guessed from unrelated columns.
      visit_status: "none",
      source: source.sheetName,
    });
  });

  return { rows, skipped };
}
