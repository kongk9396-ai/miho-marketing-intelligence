import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import type { Ga4DailyLike, Ga4DailyUpsertRow } from "@/lib/ga4/types";

export interface UpsertResult {
  inserted: number;
  updated: number;
}

export async function upsertGa4DailyRows(rows: Ga4DailyUpsertRow[]): Promise<UpsertResult> {
  if (rows.length === 0) return { inserted: 0, updated: 0 };

  const supabase = getSupabaseServiceRoleClient();
  const dates = [...new Set(rows.map((r) => r.date))];

  const { data: existingRows, error: lookupError } = await supabase
    .from("ga4_daily")
    .select("date, campaign, content, landing_page")
    .in("date", dates);

  if (lookupError) throwSupabaseError("ga4_daily 조회", lookupError);

  const existingKeys = new Set(
    (existingRows ?? []).map((r) => `${r.date}|${r.campaign}|${r.content}|${r.landing_page}`)
  );
  const updated = rows.filter(
    (r) => existingKeys.has(`${r.date}|${r.campaign}|${r.content}|${r.landing_page}`)
  ).length;
  const inserted = rows.length - updated;

  const { error: upsertError } = await supabase
    .from("ga4_daily")
    .upsert(rows, { onConflict: "date,campaign,content,landing_page" });

  if (upsertError) throwSupabaseError("ga4_daily 저장", upsertError);

  return { inserted, updated };
}

export interface Ga4SyncHistoryInput {
  sync_date: string | null;
  row_count: number;
  inserted_count: number;
  updated_count: number;
  status: "success" | "failed";
  error_message?: string | null;
}

export interface Ga4SyncHistoryRecord extends Ga4SyncHistoryInput {
  id: string;
  processed_at: string;
  created_at: string;
}

export async function recordGa4SyncHistory(input: Ga4SyncHistoryInput): Promise<Ga4SyncHistoryRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("ga4_sync_history").insert(input).select("*").single();

  if (error) throwSupabaseError("GA4 동기화 이력 저장", error);
  return data as Ga4SyncHistoryRecord;
}

export async function getLatestGa4SyncHistory(limit = 20): Promise<Ga4SyncHistoryRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("ga4_sync_history")
    .select("*")
    .order("processed_at", { ascending: false })
    .limit(limit);

  if (error) throwSupabaseError("GA4 동기화 이력 조회", error);
  return (data ?? []) as Ga4SyncHistoryRecord[];
}

/** Row count in ga4_daily for `date >= startDate`, used for the "최근 7일 수집 행 수" stat. */
export async function getGa4RowCountSince(startDate: string): Promise<number> {
  const supabase = getSupabaseServiceRoleClient();
  const { count, error } = await supabase
    .from("ga4_daily")
    .select("*", { count: "exact", head: true })
    .gte("date", startDate);

  if (error) throwSupabaseError("ga4_daily 행 수 조회", error);
  return count ?? 0;
}

export async function getLatestGa4DataDate(): Promise<string | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("ga4_daily")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throwSupabaseError("ga4_daily 조회", error);
  return data?.date ?? null;
}

export interface Ga4FilterOptions {
  campaign?: string;
  content?: string;
  startDate?: string;
  endDate?: string;
  /** ILIKE pattern (e.g. "%chatko%") matched against ga4_daily.landing_page — used by lib/landing-changes for before/after comparisons scoped to one landing page. */
  landingPagePattern?: string;
}

export async function getGa4DailyRows(filters: Ga4FilterOptions = {}): Promise<Ga4DailyLike[]> {
  const supabase = getSupabaseServiceRoleClient();
  let query = supabase
    .from("ga4_daily")
    .select(
      "date, sessions, users, engaged_sessions, page_views, cta_clicks, form_starts, form_completes, landing_page"
    );

  if (filters.campaign) query = query.eq("campaign", filters.campaign);
  if (filters.content) query = query.eq("content", filters.content);
  if (filters.startDate) query = query.gte("date", filters.startDate);
  if (filters.endDate) query = query.lte("date", filters.endDate);
  if (filters.landingPagePattern) query = query.ilike("landing_page", filters.landingPagePattern);

  const { data, error } = await query.order("date", { ascending: true });
  if (error) throwSupabaseError("ga4_daily 조회", error);
  return (data ?? []) as Ga4DailyLike[];
}

export interface Ga4CampaignContentOption {
  campaign: string;
  content: string;
}

export async function getDistinctGa4CampaignContent(): Promise<Ga4CampaignContentOption[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("ga4_daily")
    .select("campaign, content")
    .order("date", { ascending: false })
    .limit(5000);

  if (error) throwSupabaseError("ga4_daily 조회", error);

  const seen = new Map<string, Ga4CampaignContentOption>();
  for (const row of data ?? []) {
    const key = `${row.campaign}|${row.content}`;
    if (!seen.has(key)) seen.set(key, { campaign: row.campaign, content: row.content });
  }
  return [...seen.values()];
}

/** GA4 rows for a specific campaign+content pair, used by the Meta+GA4 combined view. */
export async function getGa4RowsForCampaignContent(
  campaign: string,
  content: string,
  dateRange?: { startDate: string; endDate: string }
): Promise<Ga4DailyLike[]> {
  return getGa4DailyRows({ campaign, content, startDate: dateRange?.startDate, endDate: dateRange?.endDate });
}
