import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import type { CreativeChangeInput, CreativeChangeRecord, MetaDailyLike } from "@/lib/creative-changes/types";

export async function listCreativeChanges(limit = 100): Promise<CreativeChangeRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("creative_changes")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) throwSupabaseError("변경 이력 조회", error);
  return (data ?? []) as CreativeChangeRecord[];
}

export async function getCreativeChangeById(id: string): Promise<CreativeChangeRecord | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("creative_changes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throwSupabaseError("변경 이력 조회", error);
  return data as CreativeChangeRecord | null;
}

export async function insertCreativeChange(input: CreativeChangeInput): Promise<CreativeChangeRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("creative_changes")
    .insert(input)
    .select("*")
    .single();

  if (error) throwSupabaseError("변경 이력 저장", error);
  return data as CreativeChangeRecord;
}

/** Recent changes touching this ad or campaign, for the conflict check (section 3). */
export async function getRecentChangesForAdOrCampaign(
  adId: string,
  campaignId: string | null,
  sinceDays = 30
): Promise<CreativeChangeRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();

  const orFilter = campaignId
    ? `ad_id.eq.${adId},campaign_id.eq.${campaignId}`
    : `ad_id.eq.${adId}`;

  const { data, error } = await supabase
    .from("creative_changes")
    .select("*")
    .or(orFilter)
    .gte("changed_at", since)
    .order("changed_at", { ascending: false });

  if (error) throwSupabaseError("변경 이력 조회", error);
  return (data ?? []) as CreativeChangeRecord[];
}

export async function getMetaDailyRowsForAd(
  adId: string,
  startDate: string,
  endDate: string
): Promise<MetaDailyLike[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("meta_daily")
    .select(
      "date, spend, impressions, reach, frequency, clicks, link_clicks, video_plays, video_3s, video_25, video_50, video_75, video_95, video_100, avg_watch_time"
    )
    .eq("ad_id", adId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throwSupabaseError("meta_daily 조회", error);
  return (data ?? []) as MetaDailyLike[];
}

export interface AdHierarchyRow {
  campaignId: string | null;
  campaignName: string | null;
  adsetId: string | null;
  adsetName: string | null;
  adId: string;
  adName: string | null;
}

/** Distinct campaign/ad set/ad combinations, for the registration form's cascading selects. */
export async function getMetaAdHierarchy(): Promise<AdHierarchyRow[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("meta_daily")
    .select("campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name")
    .order("date", { ascending: false })
    .limit(5000);

  if (error) throwSupabaseError("광고 목록 조회", error);

  const seen = new Map<string, AdHierarchyRow>();
  for (const row of data ?? []) {
    if (!row.ad_id) continue;
    if (!seen.has(row.ad_id)) {
      seen.set(row.ad_id, {
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        adsetId: row.adset_id,
        adsetName: row.adset_name,
        adId: row.ad_id,
        adName: row.ad_name,
      });
    }
  }
  return [...seen.values()];
}
