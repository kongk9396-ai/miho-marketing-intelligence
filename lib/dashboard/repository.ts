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

export interface LeadsCounts {
  total: number;
  valid: number;
  booked: number;
}

/**
 * `leads.booking_status` has no CHECK constraint / fixed enum in the schema
 * (free text set by whatever ingests leads), so there's no fixed status
 * string to filter on. "예약 수" is defined as leads that have *any*
 * booking_status assigned — i.e. reached the booking stage — rather than
 * matching a guessed status label.
 */
export async function getLeadsCounts(): Promise<LeadsCounts> {
  const supabase = getSupabaseServiceRoleClient();

  const [totalRes, validRes, bookedRes] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("is_valid", true),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .not("booking_status", "is", null)
      .neq("booking_status", ""),
  ]);

  if (totalRes.error) throwSupabaseError("leads 전체 건수 조회", totalRes.error);
  if (validRes.error) throwSupabaseError("leads 유효 건수 조회", validRes.error);
  if (bookedRes.error) throwSupabaseError("leads 예약 건수 조회", bookedRes.error);

  return { total: totalRes.count ?? 0, valid: validRes.count ?? 0, booked: bookedRes.count ?? 0 };
}

export async function getLatestLeadsDate(): Promise<string | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("leads")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throwSupabaseError("leads 조회", error);
  return data?.created_at ?? null;
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
 * Lead counts bucketed by KST calendar date, within [startIso, endIsoExclusive).
 * `created_at` is a timestamp, so bucketing has to happen client-side after
 * fetching — there's no date-only column to group by server-side.
 */
export async function getLeadsCountByKstDate(
  startIso: string,
  endIsoExclusive: string
): Promise<Map<string, number>> {
  const supabase = getSupabaseServiceRoleClient();
  const rows = await fetchAllPages<{ created_at: string }>(
    (from, to) =>
      supabase.from("leads").select("created_at").gte("created_at", startIso).lt("created_at", endIsoExclusive).range(from, to),
    "leads 조회"
  );

  const map = new Map<string, number>();
  for (const row of rows) {
    const day = toKstDateOnly(row.created_at);
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return map;
}
