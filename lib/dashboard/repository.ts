import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import { toKstDateOnly } from "@/lib/date/kst";

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
}

/** All-time Meta totals (no date filter) — backs "총 광고비" and the non-averaged CTR KPI. */
export async function getMetaTotals(): Promise<MetaTotals> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<{ spend: number; impressions: number; clicks: number }>(
    (from, to) => supabase.from("meta_daily").select("spend, impressions, clicks").range(from, to),
    "meta_daily 집계 조회"
  );

  return {
    rowCount: rows.length,
    spend: rows.reduce((acc, r) => acc + (r.spend ?? 0), 0),
    impressions: rows.reduce((acc, r) => acc + (r.impressions ?? 0), 0),
    clicks: rows.reduce((acc, r) => acc + (r.clicks ?? 0), 0),
  };
}

export interface Ga4LandingTotals {
  rowCount: number;
  landingViews: number;
  formCompletes: number;
}

/** All-time GA4 totals — backs the "랜딩 전환율" KPI. */
export async function getGa4LandingTotals(): Promise<Ga4LandingTotals> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<{ landing_views: number; form_completes: number }>(
    (from, to) => supabase.from("ga4_daily").select("landing_views, form_completes").range(from, to),
    "ga4_daily 집계 조회"
  );

  return {
    rowCount: rows.length,
    landingViews: rows.reduce((acc, r) => acc + (r.landing_views ?? 0), 0),
    formCompletes: rows.reduce((acc, r) => acc + (r.form_completes ?? 0), 0),
  };
}


/** Meta spend summed per date, within [startDate, endDate] inclusive (YYYY-MM-DD). */
export async function getMetaSpendByDate(startDate: string, endDate: string): Promise<Map<string, number>> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<{ date: string; spend: number }>(
    (from, to) =>
      supabase.from("meta_daily").select("date, spend").gte("date", startDate).lte("date", endDate).range(from, to),
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
