import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import { getGa4DailyRows } from "@/lib/ga4/repository";
import { getLeadsInRange } from "@/lib/leads-analysis/repository";
import type { Ga4DailyLike } from "@/lib/ga4/types";
import type { LeadAnalysisRow } from "@/lib/leads-analysis/types";
import type { LandingChangeInput, LandingChangeRecord } from "@/lib/landing-changes/types";

export async function listLandingChanges(limit = 100): Promise<LandingChangeRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("landing_changes")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) throwSupabaseError("랜딩 변경 이력 조회", error);
  return (data ?? []) as LandingChangeRecord[];
}

export async function getLandingChangeById(id: string): Promise<LandingChangeRecord | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("landing_changes").select("*").eq("id", id).maybeSingle();

  if (error) throwSupabaseError("랜딩 변경 이력 조회", error);
  return data as LandingChangeRecord | null;
}

export async function insertLandingChange(input: LandingChangeInput): Promise<LandingChangeRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("landing_changes").insert(input).select("*").single();

  if (error) throwSupabaseError("랜딩 변경 이력 저장", error);
  return data as LandingChangeRecord;
}

/** Distinct landing_page values seen in ga4_daily, for the registration form's pattern picker. */
export async function getDistinctLandingPages(limit = 500): Promise<string[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("ga4_daily")
    .select("landing_page")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throwSupabaseError("ga4_daily 랜딩 페이지 목록 조회", error);
  return [...new Set((data ?? []).map((r) => r.landing_page as string).filter(Boolean))];
}

/**
 * GA4 rows for a landing change's before/after windows. `pattern` null means
 * "compare all GA4 rows" (sitewide) — matches landing_changes.landing_page_pattern
 * being null.
 */
export async function getGa4RowsForLandingChange(
  pattern: string | null,
  startDate: string,
  endDate: string
): Promise<Ga4DailyLike[]> {
  return getGa4DailyRows({
    startDate,
    endDate,
    landingPagePattern: pattern ?? undefined,
  });
}

/**
 * utm_campaign values used by any ad in this Meta campaign, per utm_mappings.
 * Falls back to the campaign name itself (matching resolveUtmForAd's
 * auto_match default) when no manual mapping exists for it. Exported for
 * reuse by lib/ad-performance-summary's per-campaign DB/booking rollup.
 */
export async function resolveUtmCampaignsForCampaignName(campaignName: string): Promise<string[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("utm_mappings")
    .select("utm_campaign")
    .eq("campaign_name", campaignName);

  if (error) throwSupabaseError("UTM 매핑 조회", error);
  const mapped = [...new Set((data ?? []).map((r) => r.utm_campaign as string))];
  return mapped.length > 0 ? mapped : [campaignName];
}

/**
 * Leads for a landing change's linked campaign, in [startIso, endIsoExclusive).
 * Returns null (never an empty array standing in for "no data") when no
 * campaign is linked — the caller must show "DB 귀속 불가", not 0 counts.
 */
export async function getLeadsForLinkedCampaign(
  linkedCampaignName: string | null,
  startIso: string,
  endIsoExclusive: string
): Promise<LeadAnalysisRow[] | null> {
  if (!linkedCampaignName) return null;

  const utmCampaigns = await resolveUtmCampaignsForCampaignName(linkedCampaignName);
  const rows = await getLeadsInRange(startIso, endIsoExclusive);
  return rows.filter((r) => r.utm_campaign !== null && utmCampaigns.includes(r.utm_campaign));
}
