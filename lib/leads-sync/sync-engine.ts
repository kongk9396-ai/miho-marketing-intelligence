import "server-only";
import { ensureAttributionSheetExists, fetchSheetRecords } from "@/lib/leads-sync/sheets-client";
import { categorizeSheetsError } from "@/lib/leads-sync/errors";
import { mapSheetRows, type AttributionEnrichment } from "@/lib/leads-sync/row-mapper";
import { ATTRIBUTION_SHEET_HEADERS, fetchAttributionMatchMap } from "@/lib/leads-sync/attribution-repository";
import { listEnabledLeadsSheetConfigs, recordLeadsSyncHistory, upsertLeads } from "@/lib/leads-sync/repository";
import type { LeadsSheetConfig, LeadUpsertRow, RowSkipReason } from "@/lib/leads-sync/types";

const DEFAULT_ATTRIBUTION_SHEET_NAME = "marketing_attribution";

export type AttributionSheetStatus = "created" | "already_existed" | "permission_denied" | "error";

/**
 * Best-effort, idempotent: creates the marketing_attribution tab (with its
 * header row) if it's missing. Never throws — a permission error (service
 * account only has Viewer, not Editor, access) is expected until someone
 * re-shares the spreadsheet (see docs/lead-attribution-setup.md) and must
 * not fail the rest of the sync.
 */
async function ensureAttributionSheet(sheetName: string): Promise<AttributionSheetStatus> {
  try {
    const result = await ensureAttributionSheetExists(sheetName, ATTRIBUTION_SHEET_HEADERS);
    return result.created ? "created" : "already_existed";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return message.includes("permission") || message.includes("PERMISSION") ? "permission_denied" : "error";
  }
}

/**
 * Fetches the DBcart-fed attribution match map once per sync run. Never
 * throws: the attribution tab not existing yet (or not being in the
 * expected shape) just means "no enrichment this run" — the
 * consultation-sheet sync must never fail or degrade because of this
 * optional, additive feature. See docs/lead-attribution-setup.md.
 */
async function loadAttributionEnrichment(
  sheetName: string,
  fetchRecords: (sheetName: string) => Promise<Record<string, unknown>[]>
): Promise<AttributionEnrichment | null> {
  const matchMap = await fetchAttributionMatchMap(sheetName, fetchRecords);
  if (!matchMap) return null;

  return { matchMap };
}

export interface LeadsSyncResult {
  status: "success" | "partial" | "failed";
  rowCount: number;
  inserted: number;
  updated: number;
  skipped: number;
  errorCount: number;
  message: string;
  skippedDetails: RowSkipReason[];
  attributionSheetStatus: AttributionSheetStatus;
}

export interface RunLeadsSyncOptions {
  /** Injectable for tests; default to the real Supabase-backed config list. */
  getSheetConfigs?: () => Promise<LeadsSheetConfig[]>;
  /** Injectable for tests; default to the real Google Sheets API call. */
  fetchRecords?: (sheetName: string) => Promise<Record<string, unknown>[]>;
  /** Injectable for tests; default to the real marketing_attribution tab provisioning. */
  ensureAttributionSheet?: (sheetName: string) => Promise<AttributionSheetStatus>;
}

/**
 * Reads every enabled configured sheet, maps its rows, and upserts them all
 * into leads in one idempotent write. A per-sheet fetch/parse failure
 * doesn't abort the other sheets — the run status becomes "partial" rather
 * than "failed" as long as at least one row still made it through.
 */
export async function runLeadsSync(options: RunLeadsSyncOptions = {}): Promise<LeadsSyncResult> {
  const getSheetConfigs = options.getSheetConfigs ?? listEnabledLeadsSheetConfigs;
  const fetchRecords = options.fetchRecords ?? fetchSheetRecords;
  const ensureSheet = options.ensureAttributionSheet ?? ensureAttributionSheet;
  const attributionSheetName = process.env.LEADS_ATTRIBUTION_SHEET_NAME || DEFAULT_ATTRIBUTION_SHEET_NAME;

  const attributionSheetStatus = await ensureSheet(attributionSheetName);

  const configs = await getSheetConfigs();

  if (configs.length === 0) {
    const message = "동기화할 시트가 설정되어 있지 않습니다. 매핑 설정에서 시트를 추가해주세요.";
    await recordLeadsSyncHistory({
      row_count: 0,
      inserted_count: 0,
      updated_count: 0,
      skipped_count: 0,
      error_count: 0,
      status: "failed",
      error_message: message,
    });
    return {
      status: "failed",
      rowCount: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errorCount: 0,
      message,
      skippedDetails: [],
      attributionSheetStatus,
    };
  }

  const attribution = await loadAttributionEnrichment(attributionSheetName, fetchRecords);

  const allRows: LeadUpsertRow[] = [];
  const allSkipped: RowSkipReason[] = [];
  let errorCount = 0;
  const errorMessages: string[] = [];

  for (const config of configs) {
    try {
      const records = await fetchRecords(config.sheet_name);
      const { rows, skipped } = mapSheetRows(
        records,
        {
          sheetName: config.sheet_name,
          procedureLabel: config.procedure_label,
          columnOverrides: config.column_overrides,
        },
        attribution
      );
      allRows.push(...rows);
      allSkipped.push(...skipped);
    } catch (err) {
      errorCount += 1;
      const { message } = categorizeSheetsError(err);
      errorMessages.push(`${config.sheet_name}: ${message}`);
    }
  }

  let inserted = 0;
  let updated = 0;
  try {
    const result = await upsertLeads(allRows);
    inserted = result.inserted;
    updated = result.updated;
  } catch (err) {
    errorCount += 1;
    errorMessages.push(err instanceof Error ? err.message : String(err));
  }

  const status: LeadsSyncResult["status"] =
    errorCount === 0 ? "success" : inserted + updated > 0 ? "partial" : "failed";
  const message =
    errorCount === 0
      ? `${allRows.length}행 처리 완료 (신규 ${inserted} · 업데이트 ${updated} · 건너뜀 ${allSkipped.length})`
      : `오류와 함께 처리되었습니다: ${errorMessages.join("; ")}`;

  await recordLeadsSyncHistory({
    row_count: allRows.length,
    inserted_count: inserted,
    updated_count: updated,
    skipped_count: allSkipped.length,
    error_count: errorCount,
    status,
    error_message: errorMessages.length > 0 ? errorMessages.join("; ") : null,
  });

  return {
    status,
    rowCount: allRows.length,
    inserted,
    updated,
    skipped: allSkipped.length,
    errorCount,
    message,
    skippedDetails: allSkipped,
    attributionSheetStatus,
  };
}
