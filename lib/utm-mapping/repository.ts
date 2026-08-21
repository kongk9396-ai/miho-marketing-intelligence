import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import type { UtmMappingInput, UtmMappingRecord } from "@/lib/utm-mapping/types";

export async function listUtmMappings(): Promise<UtmMappingRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("utm_mappings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throwSupabaseError("UTM 매핑 조회", error);
  return (data ?? []) as UtmMappingRecord[];
}

export async function upsertUtmMapping(input: UtmMappingInput): Promise<UtmMappingRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("utm_mappings")
    .upsert(input, { onConflict: "campaign_name,ad_name" })
    .select("*")
    .single();

  if (error) throwSupabaseError("UTM 매핑 저장", error);
  return data as UtmMappingRecord;
}

export async function deleteUtmMapping(id: string): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from("utm_mappings").delete().eq("id", id);
  if (error) throwSupabaseError("UTM 매핑 삭제", error);
}

export async function findUtmMappingForAd(
  campaignName: string,
  adName: string
): Promise<UtmMappingRecord | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("utm_mappings")
    .select("*")
    .eq("campaign_name", campaignName)
    .eq("ad_name", adName)
    .maybeSingle();

  if (error) throwSupabaseError("UTM 매핑 조회", error);
  return data as UtmMappingRecord | null;
}
