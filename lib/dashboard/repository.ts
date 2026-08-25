import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import { toKstDateOnly } from "@/lib/date/kst";
import type { MetaDailyLike } from "@/lib/creative-changes/types";

const PAGE_SIZE = 1000;

/**
 * PostgREST caps rows per request (and this project's Supabase instance has
 * aggregate functions like sum() disabled), so full-table totals are built
 * by paging through every row and summing client-side rather than trusting
 * a single unbounded `.select()` to return everything.
 */
async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  errorContext: string
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throwSupabaseError(errorContext, error);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

export interface MetaTotals {
  rowCount: number;
  spend: number;
  impressions: number;
  clicks: number;
  /** Real link-click count, used as the CTR/CPC fallback (lib/ad-diagnosis/meta-rate-fallback.ts) when the raw "clicks (all)" column is 0/unpopulated in the source export. */
  linkClicks: number;
}

/** All-time Meta totals (no date filter) — backs "총 광고비" and the non-averaged CTR KPI. */
export async function getMetaTotals(): Promise<MetaTotals> {
  const supabase = getSupabaseServiceRoleClient();
  // Excludes Meta grand-total/summary rows (blank ad_name/campaign_name) —
  // those hold the same report's totals a second time, so including them
  // would double-count spend/impressions/clicks on top of the real per-ad
  // rows already in the same file.
  const rows = await fetchAllPages<{ spend: number; impressions: number; clicks: number; link_clicks: number }>(
    (from, to) =>
      supabase
        .from("meta_daily")
        .select("spend, impressions, clicks, link_clicks")
        .not("ad_name", "is", null)
        .not("campaign_name", "is", null)
        .range(from, to),
    "meta_daily 집계 조회"
  );

  return {
    rowCount: rows.length,
    spend: rows.reduce((acc, r) => acc + (r.spend ?? 0), 0),
    impressions: rows.reduce((acc, r) => acc + (r.impressions ?? 0), 0),
    clicks: rows.reduce((acc, r) => acc + (r.clicks ?? 0), 0),
    linkClicks: rows.reduce((acc, r) => acc + (r.link_clicks ?? 0), 0),
  };
}

export interface Ga4LandingTotals {
  rowCount: number;
  landingViews: number;
  formCompletes: number;
  /** Used to detect a disconnected form_complete tracking event (formStarts>0 but formCompletes stuck at 0) — see lib/dashboard/kpi.ts. */
  formStarts: number;
}

/** All-time GA4 totals — backs the "랜딩 전환율" KPI. */
export async function getGa4LandingTotals(): Promise<Ga4LandingTotals> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<{ landing_views: number; form_completes: number; form_starts: number }>(
    (from, to) => supabase.from("ga4_daily").select("landing_views, form_completes, form_starts").range(from, to),
    "ga4_daily 집계 조회"
  );

  return {
    rowCount: rows.length,
    landingViews: rows.reduce((acc, r) => acc + (r.landing_views ?? 0), 0),
    formCompletes: rows.reduce((acc, r) => acc + (r.form_completes ?? 0), 0),
    formStarts: rows.reduce((acc, r) => acc + (r.form_starts ?? 0), 0),
  };
}


export interface MetaDateRange {
  firstDate: string | null;
  lastDate: string | null;
  /** Count of distinct dates with at least one real ad row — not (lastDate - firstDate), which would include any gap days. */
  distinctDayCount: number;
}

/**
 * Earliest/latest Meta ad date and how many distinct calendar days actually
 * have data — backs "집행 시작일" / "총 집행일수" on the ad performance
 * summary. Excludes the same grand-total/summary rows getMetaTotals does.
 */
export async function getMetaDateRange(): Promise<MetaDateRange> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<{ date: string }>(
    (from, to) =>
      supabase
        .from("meta_daily")
        .select("date")
        .not("ad_name", "is", null)
        .not("campaign_name", "is", null)
        .range(from, to),
    "meta_daily 날짜 범위 조회"
  );

  if (rows.length === 0) return { firstDate: null, lastDate: null, distinctDayCount: 0 };

  const distinctDates = new Set(rows.map((r) => r.date));
  const sorted = [...distinctDates].sort();
  return { firstDate: sorted[0], lastDate: sorted[sorted.length - 1], distinctDayCount: distinctDates.size };
}

const META_DAILY_LIKE_COLUMNS =
  "date, spend, impressions, reach, frequency, clicks, link_clicks, video_plays, video_3s, video_25, video_50, video_75, video_95, video_100, avg_watch_time";

/**
 * Every real (non-grand-total) meta_daily row across all ads within
 * [startDate, endDate] inclusive — the all-ads counterpart to
 * lib/creative-changes/repository.ts's per-ad row fetchers. Feeds
 * lib/creative-changes/metrics.ts's aggregatePeriodMetrics for
 * account/day-level reports (daily/weekly reports, the comprehensive
 * summary's full funnel).
 */
export async function getMetaDailyRowsInRange(
  startDate: string,
  endDate: string
): Promise<MetaDailyLike[]> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<MetaDailyLike>(
    (from, to) =>
      supabase
        .from("meta_daily")
        .select(META_DAILY_LIKE_COLUMNS)
        .gte("date", startDate)
        .lte("date", endDate)
        .not("ad_name", "is", null)
        .not("campaign_name", "is", null)
        .range(from, to),
    "meta_daily 기간 조회"
  );
  return rows;
}

export interface MetaCampaignDailyRow extends MetaDailyLike {
  campaign_name: string | null;
}

/** Same rows as getMetaDailyRowsInRange, plus campaign_name — for the weekly report's per-campaign breakdown. */
export async function getMetaCampaignDailyRowsInRange(
  startDate: string,
  endDate: string
): Promise<MetaCampaignDailyRow[]> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<MetaCampaignDailyRow>(
    (from, to) =>
      supabase
        .from("meta_daily")
        .select(`campaign_name, ${META_DAILY_LIKE_COLUMNS}`)
        .gte("date", startDate)
        .lte("date", endDate)
        .not("ad_name", "is", null)
        .not("campaign_name", "is", null)
        .range(from, to),
    "meta_daily 캠페인별 기간 조회"
  );
  return rows;
}

/** Meta spend summed per date, within [startDate, endDate] inclusive (YYYY-MM-DD). */
export async function getMetaSpendByDate(startDate: string, endDate: string): Promise<Map<string, number>> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<{ date: string; spend: number }>(
    (from, to) =>
      supabase
        .from("meta_daily")
        .select("date, spend")
        .gte("date", startDate)
        .lte("date", endDate)
        .not("ad_name", "is", null)
        .not("campaign_name", "is", null)
        .range(from, to),
    "meta_daily 조회"
  );

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.date, (map.get(row.date) ?? 0) + (row.spend ?? 0));
  }
  return map;
}

/**
 * Lead counts bucketed by KST calendar date, within [startIso, endIsoExclusive),
 * keyed off applied_at (the sheet's "신청날짜" business date — see
 * lib/leads-sync) rather than created_at (this row's insert time).
 * `applied_at` is a timestamp, so bucketing has to happen client-side after
 * fetching — there's no date-only column to group by server-side.
 */
export async function getLeadsCountByKstDate(
  startIso: string,
  endIsoExclusive: string
): Promise<Map<string, number>> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<{ applied_at: string }>(
    (from, to) =>
      supabase.from("leads").select("applied_at").gte("applied_at", startIso).lt("applied_at", endIsoExclusive).range(from, to),
    "leads 조회"
  );

  const map = new Map<string, number>();
  for (const row of rows) {
    const day = toKstDateOnly(row.applied_at);
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return map;
}
