import "server-only";
import { hashFileBuffer } from "@/lib/meta/file-hash";
import { parseMetaReportFile } from "@/lib/meta/parser";
import {
  findImportHistoryByMessageAttachment,
  findSuccessfulImportByFileHash,
  recordImportHistory,
  upsertMetaDailyRows,
} from "@/lib/meta/repository";
import { logSyncEvent } from "@/lib/meta/sync-logger";
import { listAdOperationalStatuses, upsertAdOperationalStatus } from "@/lib/ad-operations/repository";
import type { MetaImportHistoryRecord, MetaImportSourceType } from "@/lib/meta/types";

export interface ProcessReportFileInput {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
  sourceType: MetaImportSourceType;
  messageId?: string;
  attachmentId?: string;
}

/**
 * The single place that turns a raw file (from either the manual upload
 * form or the Gmail sync loop) into a meta_daily upsert + a
 * meta_import_history row. Both callers share this exact function — do not
 * fork the parsing/validation/upsert logic per source.
 */
export async function processMetaReportFile(
  input: ProcessReportFileInput
): Promise<MetaImportHistoryRecord> {
  const { buffer, fileName, mimeType, sourceType, messageId, attachmentId } = input;
  const startedAt = Date.now();

  // Terminal outcomes for this exact Gmail attachment are never re-run; a
  // previous 'failed' attempt is retried (recordImportHistory upserts it).
  if (messageId && attachmentId) {
    const existing = await findImportHistoryByMessageAttachment(messageId, attachmentId);
    if (existing && existing.status !== "failed") {
      return existing;
    }
  }

  const fileHash = hashFileBuffer(buffer);

  const existingByHash = await findSuccessfulImportByFileHash(fileHash);
  if (existingByHash) {
    return recordImportHistory({
      source_type: sourceType,
      message_id: messageId ?? null,
      attachment_id: attachmentId ?? null,
      file_name: fileName,
      file_hash: fileHash,
      row_count: 0,
      inserted_count: 0,
      updated_count: 0,
      skipped_count: 0,
      status: "duplicate",
      error_message: "이미 처리된 파일입니다.",
    });
  }

  const { kind, result } = parseMetaReportFile({ buffer, fileName, mimeType });

  if (kind === null) {
    return recordImportHistory({
      source_type: sourceType,
      message_id: messageId ?? null,
      attachment_id: attachmentId ?? null,
      file_name: fileName,
      file_hash: fileHash,
      row_count: 0,
      inserted_count: 0,
      updated_count: 0,
      skipped_count: 0,
      status: "unsupported",
      error_message: "지원하지 않는 파일 형식입니다. (.csv, .xlsx만 지원)",
    });
  }

  if (result.fatalError) {
    return recordImportHistory({
      source_type: sourceType,
      message_id: messageId ?? null,
      attachment_id: attachmentId ?? null,
      file_name: fileName,
      file_hash: fileHash,
      row_count: 0,
      inserted_count: 0,
      updated_count: 0,
      skipped_count: 0,
      status: "failed",
      error_message: result.fatalError,
    });
  }

  if (result.rows.length === 0) {
    return recordImportHistory({
      source_type: sourceType,
      message_id: messageId ?? null,
      attachment_id: attachmentId ?? null,
      file_name: fileName,
      file_hash: fileHash,
      row_count: 0,
      inserted_count: 0,
      updated_count: 0,
      skipped_count: result.rowErrors.length,
      status: "failed",
      error_message: "유효한 데이터 행이 없습니다.",
    });
  }

  let upsertOutcome: { inserted: number; updated: number };
  try {
    upsertOutcome = await upsertMetaDailyRows(result.rows);
  } catch (err) {
    return recordImportHistory({
      source_type: sourceType,
      message_id: messageId ?? null,
      attachment_id: attachmentId ?? null,
      file_name: fileName,
      file_hash: fileHash,
      row_count: result.rows.length,
      inserted_count: 0,
      updated_count: 0,
      skipped_count: result.rowErrors.length,
      status: "failed",
      error_message: err instanceof Error ? err.message : String(err),
    });
  }

  // Meta 보고서에서 처음 발견된 광고를 자동 등록한다.
  // 기존 운영 상태는 절대 덮어쓰지 않는다.
  const existingStatuses = await listAdOperationalStatuses();
  const existingKeys = new Set(
    existingStatuses.map((row) => `${row.campaign_name}|||${row.ad_name}`)
  );

  const uniqueAds = new Map<
    string,
    { campaignName: string; adName: string; adId: string | null }
  >();

  for (const row of result.rows) {
    if (!row.campaign_name || !row.ad_name) continue;

    const key = `${row.campaign_name}|||${row.ad_name}`;
    if (uniqueAds.has(key)) continue;

    uniqueAds.set(key, {
      campaignName: row.campaign_name,
      adName: row.ad_name,
      adId: row.is_temp_ad_id ? null : row.ad_id,
    });
  }

  for (const [key, ad] of uniqueAds) {
    if (existingKeys.has(key)) continue;

    await upsertAdOperationalStatus({
      campaign_name: ad.campaignName,
      ad_name: ad.adName,
      ad_id: ad.adId,
      status: "ACTIVE",
      status_changed_at: new Date().toISOString(),
      reason: "Meta 동기화 자동 등록",
      memo: null,
    });

    existingKeys.add(key);
  }

  const dates = result.rows.map((r) => r.date).sort();
  const record = await recordImportHistory({
    source_type: sourceType,
    message_id: messageId ?? null,
    attachment_id: attachmentId ?? null,
    file_name: fileName,
    file_hash: fileHash,
    report_start_date: dates[0] ?? null,
    report_end_date: dates[dates.length - 1] ?? null,
    row_count: result.rows.length,
    inserted_count: upsertOutcome.inserted,
    updated_count: upsertOutcome.updated,
    skipped_count: result.rowErrors.length,
    status: result.rowErrors.length > 0 ? "partial" : "success",
  });

  logSyncEvent({
    event: "file_processed",
    fileName,
    rowCount: result.rows.length,
    status: record.status,
    durationMs: Date.now() - startedAt,
  });

  return record;
}
