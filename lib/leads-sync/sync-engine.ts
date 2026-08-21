import "server-only";
import { fetchSheetRecords } from "@/lib/leads-sync/sheets-client";
import { categorizeSheetsError } from "@/lib/leads-sync/errors";
import { mapSheetRows } from "@/lib/leads-sync/row-mapper";
import { listEnabledLeadsSheetConfigs, recordLeadsSyncHistory, upsertLeads } from "@/lib/leads-sync/repository";
import type { LeadsSheetConfig, LeadUpsertRow, RowSkipReason } from "@/lib/leads-sync/types";

export interface LeadsSyncResult {
  status: "success" | "partial" | "failed";
  rowCount: number;
  inserted: number;
  updated: number;
  skipped: number;
  errorCount: number;
  message: string;
  skippedDetails: RowSkipReason[];
}

export interface RunLeadsSyncOptions {
  /** Injectable for tests; default to the real Supabase-backed config list. */
  getSheetConfigs?: () => Promise<LeadsSheetConfig[]>;
  /** Injectable for tests; default to the real Google Sheets API call. */
  fetchRecords?: (sheetName: string) => Promise<Record<string, unknown>[]>;
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
    return { status: "failed", rowCount: 0, inserted: 0, updated: 0, skipped: 0, errorCount: 0, message, skippedDetails: [] };
  }

  const allRows: LeadUpsertRow[] = [];
  const allSkipped: RowSkipReason[] = [];
  let errorCount = 0;
  const errorMessages: string[] = [];

  for (const config of configs) {
    try {
      const records = await fetchRecords(config.sheet_name);
      const { rows, skipped } = mapSheetRows(records, {
        sheetName: config.sheet_name,
        procedureLabel: config.procedure_label,
        columnOverrides: config.column_overrides,
      });
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
  };
}
