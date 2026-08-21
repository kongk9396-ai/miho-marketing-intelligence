import "server-only";
import { isSheetsConfigured } from "@/lib/leads-sync/sheets-client";
import {
  getLatestLeadsAppliedAt,
  getLatestLeadsSyncHistory,
  listLeadsSheetConfigs,
} from "@/lib/leads-sync/repository";
import type { LeadsSheetConfig, LeadsSyncHistoryRecord } from "@/lib/leads-sync/types";

export interface LeadsSyncStatusView {
  configured: boolean;
  sheetConfigs: LeadsSheetConfig[];
  lastSyncAt: string | null;
  lastSyncStatus: "success" | "partial" | "failed" | null;
  lastRowCount: number | null;
  lastInserted: number | null;
  lastUpdated: number | null;
  lastSkipped: number | null;
  lastErrorCount: number | null;
  lastError: string | null;
  latestDataAt: string | null;
  recentHistory: LeadsSyncHistoryRecord[];
}

export async function getLeadsSyncStatusView(): Promise<LeadsSyncStatusView> {
  const [history, latestDataAt, sheetConfigs] = await Promise.all([
    getLatestLeadsSyncHistory(20),
    getLatestLeadsAppliedAt(),
    listLeadsSheetConfigs(),
  ]);

  const lastAttempt = history[0] ?? null;
  const lastFailed = history.find((h) => h.status === "failed") ?? null;

  return {
    configured: isSheetsConfigured(),
    sheetConfigs,
    lastSyncAt: lastAttempt?.processed_at ?? null,
    lastSyncStatus: lastAttempt?.status ?? null,
    lastRowCount: lastAttempt?.row_count ?? null,
    lastInserted: lastAttempt?.inserted_count ?? null,
    lastUpdated: lastAttempt?.updated_count ?? null,
    lastSkipped: lastAttempt?.skipped_count ?? null,
    lastErrorCount: lastAttempt?.error_count ?? null,
    lastError: lastFailed?.error_message ?? null,
    latestDataAt,
    recentHistory: history,
  };
}
