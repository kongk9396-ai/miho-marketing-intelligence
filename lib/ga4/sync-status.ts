import "server-only";
import { getGa4PropertyId, isGa4Configured } from "@/lib/ga4/client";
import {
  getGa4RowCountSince,
  getLatestGa4DataDate,
  getLatestGa4SyncHistory,
  type Ga4SyncHistoryRecord,
} from "@/lib/ga4/repository";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";

export interface Ga4SyncStatusView {
  configured: boolean;
  propertyId: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: "success" | "failed" | null;
  lastRowCount: number | null;
  lastError: string | null;
  latestDataDate: string | null;
  recent7DayRowCount: number;
  recentHistory: Ga4SyncHistoryRecord[];
}

export async function getGa4SyncStatusView(): Promise<Ga4SyncStatusView> {
  const configured = isGa4Configured();
  let propertyId: string | null = null;
  if (configured) {
    try {
      propertyId = getGa4PropertyId();
    } catch {
      propertyId = null;
    }
  }

  const sevenDaysAgo = addDaysToDateOnly(toKstDateOnly(new Date().toISOString()), -6);

  const [history, latestDataDate, recent7DayRowCount] = await Promise.all([
    getLatestGa4SyncHistory(20),
    getLatestGa4DataDate(),
    getGa4RowCountSince(sevenDaysAgo),
  ]);

  const lastAttempt = history[0] ?? null;
  const lastFailed = history.find((h) => h.status === "failed") ?? null;

  return {
    configured,
    propertyId,
    lastSyncAt: lastAttempt?.processed_at ?? null,
    lastSyncStatus: lastAttempt?.status ?? null,
    lastRowCount: lastAttempt?.row_count ?? null,
    lastError: lastFailed?.error_message ?? null,
    latestDataDate,
    recent7DayRowCount,
    recentHistory: history,
  };
}
