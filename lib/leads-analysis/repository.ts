import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import type { LeadAnalysisRow } from "@/lib/leads-analysis/types";

const PAGE_SIZE = 1000;
const SELECT_COLUMNS =
  "utm_source, utm_medium, utm_campaign, utm_content, procedure, is_valid, outcome_status, consultation_status, booking_status, visit_status, applied_at";

/**
 * Leads with applied_at in [startIso, endIsoExclusive). Paginated — a
 * high-volume clinic's lead sheet can easily exceed PostgREST's per-request
 * row cap over a 30-day window.
 */
export async function getLeadsInRange(startIso: string, endIsoExclusive: string): Promise<LeadAnalysisRow[]> {
  const supabase = getSupabaseServiceRoleClient();
  const rows: LeadAnalysisRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("leads")
      .select(SELECT_COLUMNS)
      .gte("applied_at", startIso)
      .lt("applied_at", endIsoExclusive)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throwSupabaseError("leads 조회", error);
    if (!data || data.length === 0) break;
    rows.push(...(data as LeadAnalysisRow[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

/** All-time leads (no date filter) — for the dashboard's all-time KPI convention. */
export async function getAllLeadsForAnalysis(): Promise<LeadAnalysisRow[]> {
  const supabase = getSupabaseServiceRoleClient();
  const rows: LeadAnalysisRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase.from("leads").select(SELECT_COLUMNS).range(from, from + PAGE_SIZE - 1);

    if (error) throwSupabaseError("leads 조회", error);
    if (!data || data.length === 0) break;
    rows.push(...(data as LeadAnalysisRow[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}
