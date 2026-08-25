import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import type {
  LeadsSheetConfig,
  LeadsSheetConfigInput,
  LeadsSyncHistoryInput,
  LeadsSyncHistoryRecord,
  LeadUpsertRow,
  UpsertResult,
} from "@/lib/leads-sync/types";

// --- leads_sheet_configs -----------------------------------------------------

export async function listLeadsSheetConfigs(): Promise<LeadsSheetConfig[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("leads_sheet_configs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throwSupabaseError("시트 설정 조회", error);
  return (data ?? []) as LeadsSheetConfig[];
}

export async function listEnabledLeadsSheetConfigs(): Promise<LeadsSheetConfig[]> {
  const configs = await listLeadsSheetConfigs();
  return configs.filter((c) => c.enabled);
}

export async function upsertLeadsSheetConfig(input: LeadsSheetConfigInput): Promise<LeadsSheetConfig> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("leads_sheet_configs")
    .upsert(input, { onConflict: "sheet_name" })
    .select("*")
    .single();

  if (error) throwSupabaseError("시트 설정 저장", error);
  return data as LeadsSheetConfig;
}

export async function deleteLeadsSheetConfig(id: string): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from("leads_sheet_configs").delete().eq("id", id);
  if (error) throwSupabaseError("시트 설정 삭제", error);
}

// --- leads --------------------------------------------------------------------

/**
 * Idempotent upsert on lead_key: syncing the same sheet rows again updates
 * those rows in place instead of duplicating them, which is exactly what
 * running this on a cron schedule requires.
 */
export async function upsertLeads(rows: LeadUpsertRow[]): Promise<UpsertResult> {
  if (rows.length === 0) return { inserted: 0, updated: 0 };

  const supabase = getSupabaseServiceRoleClient();

  // Existing sheet rows must keep their original lead_key even when
  // attribution/UTM values are added later. source + source_row_number is
  // the stable consultation-sheet identity.
  const sources = [...new Set(rows.map((r) => r.source).filter(Boolean))];

  const { data: existingSourceRows, error: sourceLookupError } = await supabase
    .from("leads")
    .select("lead_key, source, source_row_number")
    .in("source", sources);

  if (sourceLookupError) throwSupabaseError("leads 기존 행 조회", sourceLookupError);

  const existingBySourceRow = new Map<string, string>();

  for (const row of existingSourceRows ?? []) {
    if (!row.source || row.source_row_number == null) continue;
    existingBySourceRow.set(
      `${row.source}|||${row.source_row_number}`,
      row.lead_key as string
    );
  }

  const resolvedRows = rows.map((row) => {
    const existingKey = existingBySourceRow.get(
      `${row.source}|||${row.source_row_number}`
    );

    return existingKey
      ? { ...row, lead_key: existingKey }
      : row;
  });

  const leadKeys = resolvedRows.map((r) => r.lead_key);

  const { data: existingRows, error: lookupError } = await supabase
    .from("leads")
    .select("lead_key")
    .in("lead_key", leadKeys);

  if (lookupError) throwSupabaseError("leads 조회", lookupError);

  const existingKeys = new Set(
    (existingRows ?? []).map((r) => r.lead_key as string)
  );

  const updated = resolvedRows.filter((r) =>
    existingKeys.has(r.lead_key)
  ).length;
  const inserted = resolvedRows.length - updated;

  const now = new Date().toISOString();
  const payload = resolvedRows.map((row) => ({
    ...row,
    synced_at: now,
  }));

  const { error: upsertError } = await supabase
    .from("leads")
    .upsert(payload, { onConflict: "lead_key" });

  if (upsertError) throwSupabaseError("leads 저장", upsertError);

  return { inserted, updated };
}
export async function getLatestLeadsAppliedAt(): Promise<string | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("leads")
    .select("applied_at")
    .order("applied_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throwSupabaseError("leads 조회", error);
  return data?.applied_at ?? null;
}

// --- leads_sync_history ---------------------------------------------------------

export async function recordLeadsSyncHistory(input: LeadsSyncHistoryInput): Promise<LeadsSyncHistoryRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("leads_sync_history").insert(input).select("*").single();

  if (error) throwSupabaseError("DB 동기화 이력 저장", error);
  return data as LeadsSyncHistoryRecord;
}

export async function getLatestLeadsSyncHistory(limit = 20): Promise<LeadsSyncHistoryRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("leads_sync_history")
    .select("*")
    .order("processed_at", { ascending: false })
    .limit(limit);

  if (error) throwSupabaseError("DB 동기화 이력 조회", error);
  return (data ?? []) as LeadsSyncHistoryRecord[];
}

