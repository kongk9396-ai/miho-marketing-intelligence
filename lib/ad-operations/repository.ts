import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import type {
  AdAccountSettings,
  AdAccountSettingsInput,
  AdOffSnapshotInput,
  AdOffSnapshotRecord,
  AdOperationalStatusInput,
  AdOperationalStatusRecord,
  CampaignSettingsInput,
  CampaignSettingsRecord,
} from "@/lib/ad-operations/types";

/** Singleton settings row (id=1). Null when the user has never saved settings yet — never a fabricated default. */
export async function getAdAccountSettings(): Promise<AdAccountSettings | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("ad_account_settings").select("*").eq("id", 1).maybeSingle();

  if (error) throwSupabaseError("광고 계정 설정 조회", error);
  return data as AdAccountSettings | null;
}

export async function upsertAdAccountSettings(input: AdAccountSettingsInput): Promise<AdAccountSettings> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("ad_account_settings")
    .upsert({ id: 1, ...input }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throwSupabaseError("광고 계정 설정 저장", error);
  return data as AdAccountSettings;
}

export async function listCampaignSettings(): Promise<CampaignSettingsRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("campaign_settings")
    .select("*")
    .order("campaign_name", { ascending: true });

  if (error) throwSupabaseError("캠페인 설정 조회", error);
  return (data ?? []) as CampaignSettingsRecord[];
}

export async function upsertCampaignSetting(input: CampaignSettingsInput): Promise<CampaignSettingsRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("campaign_settings")
    .upsert(input, { onConflict: "campaign_name" })
    .select("*")
    .single();

  if (error) throwSupabaseError("캠페인 설정 저장", error);
  return data as CampaignSettingsRecord;
}

export async function listAdOperationalStatuses(): Promise<AdOperationalStatusRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("ad_operational_status")
    .select("*")
    .order("status_changed_at", { ascending: false });

  if (error) throwSupabaseError("광고 운영 상태 조회", error);
  return (data ?? []) as AdOperationalStatusRecord[];
}

export async function upsertAdOperationalStatus(
  input: AdOperationalStatusInput
): Promise<AdOperationalStatusRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("ad_operational_status")
    .upsert(input, { onConflict: "campaign_name,ad_name" })
    .select("*")
    .single();

  if (error) throwSupabaseError("광고 운영 상태 저장", error);
  return data as AdOperationalStatusRecord;
}

export async function insertAdOffSnapshot(input: AdOffSnapshotInput): Promise<AdOffSnapshotRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("ad_off_snapshots").insert(input).select("*").single();

  if (error) throwSupabaseError("OFF 스냅샷 저장", error);
  return data as AdOffSnapshotRecord;
}

/** All OFF snapshots, keyed by ad_operational_status_id (most recent only per status). */
export async function getOffSnapshotsByStatusId(): Promise<Map<string, AdOffSnapshotRecord>> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("ad_off_snapshots")
    .select("*")
    .order("snapshot_at", { ascending: false });

  if (error) throwSupabaseError("OFF 스냅샷 조회", error);

  const map = new Map<string, AdOffSnapshotRecord>();
  for (const row of (data ?? []) as AdOffSnapshotRecord[]) {
    if (row.ad_operational_status_id && !map.has(row.ad_operational_status_id)) {
      map.set(row.ad_operational_status_id, row);
    }
  }
  return map;
}

export async function getLatestOffSnapshotForStatus(
  adOperationalStatusId: string
): Promise<AdOffSnapshotRecord | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("ad_off_snapshots")
    .select("*")
    .eq("ad_operational_status_id", adOperationalStatusId)
    .order("snapshot_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throwSupabaseError("OFF 스냅샷 조회", error);
  return data as AdOffSnapshotRecord | null;
}
