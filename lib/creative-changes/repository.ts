import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import type {
  CreativeChangeInput,
  CreativeChangeRecord,
  MetaDailyLike,
  MetaDailyWithRates,
} from "@/lib/creative-changes/types";

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
export async function updateCreativeChange(
  id: string,
  input: CreativeChangeInput
): Promise<CreativeChangeRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("creative_changes")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throwSupabaseError("변경 이력 수정", error);
  return data as CreativeChangeRecord;
}

export async function deleteCreativeChange(id: string): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("creative_changes")
    .delete()
    .eq("id", id);

  if (error) throwSupabaseError("변경 이력 삭제", error);
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

/**
 * Same rows as getMetaDailyRowsForAd, plus the raw per-row rate columns
 * (ctr/link_ctr/cpc/link_cpc/cpm) Meta itself reports. Used by the ad
 * auto-diagnosis engine's CTR/CPC fallback: some Meta report exports omit
 * the raw click-count column while still including the rate column, and
 * recomputing CTR/CPC from a missing click count would silently show 0/—
 * even though Meta's own rate is available.
 */
export async function getMetaDailyRawRowsForAd(
  adId: string,
  startDate: string,
  endDate: string
): Promise<MetaDailyWithRates[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("meta_daily")
    .select(
      "date, spend, impressions, reach, frequency, clicks, link_clicks, video_plays, video_3s, video_25, video_50, video_75, video_95, video_100, avg_watch_time, ctr, link_ctr, cpc, link_cpc, cpm"
    )
    .eq("ad_id", adId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throwSupabaseError("meta_daily 조회", error);
  return (data ?? []) as MetaDailyWithRates[];
}

/**
 * Same as getMetaDailyRawRowsForAd, but across every ad_id in `adIds` at
 * once. A single real-world ad can have more than one ad_id in meta_daily —
 * early CSV exports that omitted the "Ad ID" column got a stable temp:
 * hash id (see lib/meta/temp-ad-id.ts), and a later export with the real
 * Meta ad_id doesn't retroactively rewrite those older rows. Reporting on
 * one of those ad_ids alone silently shows only part of that ad's spend and
 * clicks — the auto-diagnosis build groups by (campaign_name, ad_name)
 * first and calls this with every ad_id sharing that identity.
 */
export async function getMetaDailyRawRowsForAds(
  adIds: string[],
  startDate: string,
  endDate: string
): Promise<MetaDailyWithRates[]> {
  if (adIds.length === 0) return [];
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("meta_daily")
    .select(
      "date, spend, impressions, reach, frequency, clicks, link_clicks, video_plays, video_3s, video_25, video_50, video_75, video_95, video_100, avg_watch_time, ctr, link_ctr, cpc, link_cpc, cpm"
    )
    .in("ad_id", adIds)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throwSupabaseError("meta_daily 조회", error);
  return (data ?? []) as MetaDailyWithRates[];
}

const PAGE_SIZE = 1000;

/**
 * All-time rows for one ad, for the video analysis page (no before/after
 * window there). PostgREST caps rows per request, so this pages through
 * rather than trusting a single unbounded `.select()`.
 */
export async function getAllMetaDailyRowsForAd(adId: string): Promise<MetaDailyLike[]> {
  const supabase = getSupabaseServiceRoleClient();
  const rows: MetaDailyLike[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("meta_daily")
      .select(
        "date, spend, impressions, reach, frequency, clicks, link_clicks, video_plays, video_3s, video_25, video_50, video_75, video_95, video_100, avg_watch_time"
      )
      .eq("ad_id", adId)
      .order("date", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throwSupabaseError("meta_daily 조회", error);
    if (!data || data.length === 0) break;
    rows.push(...(data as MetaDailyLike[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
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
    // Meta's grand-total/summary rows (all name columns blank) shouldn't
    // normally reach meta_daily at all (the parser skips them), but this
    // guard also neutralizes any already-stored ones so they never show up
    // as a phantom "ad" or get summed into per-ad/campaign totals.
    if (!row.ad_id || !row.ad_name || !row.campaign_name) continue;
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

