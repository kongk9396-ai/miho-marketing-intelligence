import "server-only";
import { GmailAuthRequiredError, GmailProvider } from "@/lib/mail/gmail-provider";
import type { MailProvider } from "@/lib/mail/types";
import { getMetaSyncSettings, recordImportHistory } from "@/lib/meta/repository";
import { processMetaReportFile } from "@/lib/meta/process-report-file";
import { logSyncEvent } from "@/lib/meta/sync-logger";
import type { MetaImportHistoryRecord } from "@/lib/meta/types";

export type SyncTrigger = "manual" | "cron";

export type SyncStatusCode =
  | "ok"
  | "no_new_reports"
  | "gmail_auth_required"
  | "disabled"
  | "error";

export interface SyncResult {
  status: SyncStatusCode;
  processedFiles: number;
  totalInserted: number;
  totalUpdated: number;
  totalSkipped: number;
  errorCount: number;
  details: MetaImportHistoryRecord[];
  message: string;
}

export interface RunMetaSyncOptions {
  trigger: SyncTrigger;
  /** Injectable for tests; defaults to the real Gmail provider. */
  mailProvider?: MailProvider;
}

function emptyResult(status: SyncStatusCode, message: string): SyncResult {
  return {
    status,
    processedFiles: 0,
    totalInserted: 0,
    totalUpdated: 0,
    totalSkipped: 0,
    errorCount: 0,
    details: [],
    message,
  };
}

export async function runMetaSync({ trigger, mailProvider }: RunMetaSyncOptions): Promise<SyncResult> {
  const startedAt = Date.now();
  logSyncEvent({ event: "sync_start", trigger });

  const settings = await getMetaSyncSettings();

  if (trigger === "cron" && !settings.autoSyncEnabled) {
    return emptyResult("disabled", "자동 수집이 비활성화되어 있습니다.");
  }

  const provider = mailProvider ?? new GmailProvider();

  const connected = await provider.isConnected();
  if (!connected) {
    return emptyResult("gmail_auth_required", "Gmail 연결이 필요합니다.");
  }

  const criteria = {
    subjectKeywords: settings.subjectKeywords,
    lookbackHours: settings.lookbackHours,
    allowedExtensions: settings.allowedExtensions,
  };

  let refs;
  try {
    refs = await provider.findMetaReportEmails(criteria);
  } catch (err) {
    if (err instanceof GmailAuthRequiredError) {
      return emptyResult("gmail_auth_required", "Gmail 연결이 필요합니다.");
    }
    const message = err instanceof Error ? err.message : String(err);
    logSyncEvent({ event: "sync_error", trigger, message });
    return {
      ...emptyResult("error", `이메일 검색에 실패했습니다: ${message}`),
      errorCount: 1,
    };
  }

  logSyncEvent({ event: "emails_found", trigger, emailCount: refs.length });

  if (refs.length === 0) {
    await recordImportHistory({
      source_type: "gmail",
      row_count: 0,
      inserted_count: 0,
      updated_count: 0,
      skipped_count: 0,
      status: "no_new_reports",
    });
    return emptyResult("no_new_reports", "새로운 보고서가 없습니다.");
  }

  const details: MetaImportHistoryRecord[] = [];
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let errorCount = 0;

  for (const ref of refs) {
    try {
      const buffer = await provider.downloadAttachment(ref);
      const record = await processMetaReportFile({
        buffer,
        fileName: ref.fileName,
        mimeType: ref.mimeType,
        sourceType: "gmail",
        messageId: ref.messageId,
        attachmentId: ref.attachmentId,
      });
      details.push(record);
      totalInserted += record.inserted_count;
      totalUpdated += record.updated_count;
      totalSkipped += record.skipped_count;
      if (record.status === "failed") errorCount += 1;
    } catch (err) {
      errorCount += 1;
      const message = err instanceof Error ? err.message : String(err);
      logSyncEvent({ event: "sync_error", trigger, fileName: ref.fileName, message });
    }
  }

  logSyncEvent({ event: "sync_complete", trigger, durationMs: Date.now() - startedAt });

  const status: SyncStatusCode = details.length === 0 && errorCount > 0 ? "error" : "ok";
  const message =
    errorCount > 0
      ? `${details.length}개 파일 처리 완료 (오류 ${errorCount}건)`
      : `${details.length}개 파일을 정상적으로 처리했습니다.`;

  return { status, processedFiles: details.length, totalInserted, totalUpdated, totalSkipped, errorCount, details, message };
}
