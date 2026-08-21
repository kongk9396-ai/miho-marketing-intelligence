import "server-only";
import {
  getGmailCredentials,
  getLatestImportHistory,
  getLatestMetaDailyDate,
  getTodaySuccessCount,
} from "@/lib/meta/repository";
import type { MetaImportHistoryRecord } from "@/lib/meta/types";

export type OverallSyncStatus =
  | "ok"
  | "connection_required"
  | "last_sync_failed"
  | "no_new_reports"
  | "not_yet_run";

export interface MetaSyncStatusView {
  gmailConnected: boolean;
  gmailEmail: string | null;
  overallStatus: OverallSyncStatus;
  lastSyncAt: string | null;
  lastSuccessAt: string | null;
  lastFile: string | null;
  lastRowCount: number | null;
  lastError: string | null;
  todayCount: number;
  latestDataDate: string | null;
  recentHistory: MetaImportHistoryRecord[];
}

export async function getMetaSyncStatusView(): Promise<MetaSyncStatusView> {
  const [credentials, history, todayCount, latestDataDate] = await Promise.all([
    getGmailCredentials(),
    getLatestImportHistory(20),
    getTodaySuccessCount(),
    getLatestMetaDailyDate(),
  ]);

  const gmailConnected = credentials !== null;

  const lastAttempt = history[0] ?? null;
  const lastSuccess = history.find((h) => h.status === "success" || h.status === "partial") ?? null;
  const lastFailed = history.find((h) => h.status === "failed") ?? null;

  let overallStatus: OverallSyncStatus;
  if (!gmailConnected) {
    overallStatus = "connection_required";
  } else if (!lastAttempt) {
    overallStatus = "not_yet_run";
  } else if (lastAttempt.status === "failed") {
    overallStatus = "last_sync_failed";
  } else if (lastAttempt.status === "no_new_reports") {
    overallStatus = "no_new_reports";
  } else {
    overallStatus = "ok";
  }

  return {
    gmailConnected,
    gmailEmail: credentials?.emailAddress ?? null,
    overallStatus,
    lastSyncAt: lastAttempt?.processed_at ?? null,
    lastSuccessAt: lastSuccess?.processed_at ?? null,
    lastFile: lastSuccess?.file_name ?? null,
    lastRowCount: lastSuccess?.row_count ?? null,
    lastError: lastFailed?.error_message ?? null,
    todayCount,
    latestDataDate,
    recentHistory: history,
  };
}
