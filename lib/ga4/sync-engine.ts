import "server-only";
import { fetchGa4EventCounts, fetchGa4MainReport } from "@/lib/ga4/report";
import { mergeGa4Reports } from "@/lib/ga4/merge";
import { recordGa4SyncHistory, upsertGa4DailyRows } from "@/lib/ga4/repository";
import { categorizeGa4Error } from "@/lib/ga4/errors";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";
import type { Ga4DailyUpsertRow, Ga4MergedRow } from "@/lib/ga4/types";

export interface Ga4SyncResult {
  status: "success" | "failed";
  syncDate: string;
  rowCount: number;
  inserted: number;
  updated: number;
  message: string;
}

export interface RunGa4SyncOptions {
  targetDate?: string;
  /** Injectable for tests; default to the real GA4 API calls. */
  fetchMain?: typeof fetchGa4MainReport;
  fetchEvents?: typeof fetchGa4EventCounts;
}

function toUpsertRows(rows: Ga4MergedRow[]): Ga4DailyUpsertRow[] {
  return rows.map((row) => ({
    date: row.date,
    source: row.source,
    medium: row.medium,
    campaign: row.campaign,
    content: row.content,
    landing_page: row.landingPage,
    sessions: row.sessions,
    users: row.totalUsers,
    engaged_sessions: row.engagedSessions,
    engagement_rate: row.engagementRate,
    avg_session_duration: row.avgSessionDuration,
    page_views: row.screenPageViews,
    landing_views: row.screenPageViews,
    cta_clicks: row.ctaClicks,
    form_starts: row.formStarts,
    form_completes: row.formCompletes,
    scroll_depth_events: row.scrollDepthEvents,
    key_events: row.keyEvents,
  }));
}

/** Defaults to yesterday (KST) when no target date is given. */
export async function runGa4Sync(options: RunGa4SyncOptions = {}): Promise<Ga4SyncResult> {
  const fetchMain = options.fetchMain ?? fetchGa4MainReport;
  const fetchEvents = options.fetchEvents ?? fetchGa4EventCounts;
  const syncDate = options.targetDate ?? addDaysToDateOnly(toKstDateOnly(new Date().toISOString()), -1);

  try {
    const [mainRows, eventRows] = await Promise.all([
      fetchMain(syncDate, syncDate),
      fetchEvents(syncDate, syncDate),
    ]);

    const merged = mergeGa4Reports(mainRows, eventRows);
    const upsertRows = toUpsertRows(merged);
    const { inserted, updated } = await upsertGa4DailyRows(upsertRows);

    await recordGa4SyncHistory({
      sync_date: syncDate,
      row_count: upsertRows.length,
      inserted_count: inserted,
      updated_count: updated,
      status: "success",
    });

    return {
      status: "success",
      syncDate,
      rowCount: upsertRows.length,
      inserted,
      updated,
      message: `${syncDate} 데이터 ${upsertRows.length}행을 정상적으로 가져왔습니다.`,
    };
  } catch (err) {
    const { message } = categorizeGa4Error(err);

    // Best-effort: a failure recording the failure shouldn't mask the real error.
    await recordGa4SyncHistory({
      sync_date: syncDate,
      row_count: 0,
      inserted_count: 0,
      updated_count: 0,
      status: "failed",
      error_message: message,
    }).catch(() => {});

    return { status: "failed", syncDate, rowCount: 0, inserted: 0, updated: 0, message };
  }
}
