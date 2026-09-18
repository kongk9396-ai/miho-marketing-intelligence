import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { startOfTodayKst } from "@/lib/date/kst";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import type {
  GmailCredentials,
  MetaDailyInsert,
  MetaImportHistoryInput,
  MetaImportHistoryRecord,
  MetaSyncSettings,
  UpsertResult,
} from "@/lib/meta/types";

const DEFAULT_SETTINGS: MetaSyncSettings = {
  subjectKeywords: ["MIHO Meta Daily", "Meta 광고 보고서"],
  lookbackHours: 48,
  allowedExtensions: ["csv", "xlsx"],
  autoSyncEnabled: false,
};

// --- meta_daily -------------------------------------------------------------

export async function upsertMetaDailyRows(rows: MetaDailyInsert[]): Promise<UpsertResult> {
  if (rows.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  const supabase = getSupabaseServiceRoleClient();

  const adIds = [...new Set(rows.map((r) => r.ad_id))];
  const dates = [...new Set(rows.map((r) => r.date))];

  const { data: existingRows, error: lookupError } = await supabase
    .from("meta_daily")
    .select("date, ad_id")
    .in("ad_id", adIds)
    .in("date", dates);

  if (lookupError) {
    throwSupabaseError("meta_daily 조회", lookupError);
  }

  const existingKeys = new Set((existingRows ?? []).map((r) => `${r.date}|${r.ad_id}`));
  const updated = rows.filter((r) => existingKeys.has(`${r.date}|${r.ad_id}`)).length;
  const inserted = rows.length - updated;

  const { error: upsertError } = await supabase
    .from("meta_daily")
    .upsert(rows, { onConflict: "date,ad_id" });

  if (upsertError) {
    throwSupabaseError("meta_daily 저장", upsertError);
  }

  return { inserted, updated };
}

// --- meta_import_history ------------------------------------------------------

export async function findImportHistoryByMessageAttachment(
  messageId: string,
  attachmentId: string
): Promise<MetaImportHistoryRecord | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("meta_import_history")
    .select("*")
    .eq("message_id", messageId)
    .eq("attachment_id", attachmentId)
    .maybeSingle();

  if (error) throwSupabaseError("가져오기 이력 조회", error);
  return data as MetaImportHistoryRecord | null;
}

export async function findSuccessfulImportByFileHash(
  fileHash: string
): Promise<MetaImportHistoryRecord | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("meta_import_history")
    .select("*")
    .eq("file_hash", fileHash)
    .eq("status", "success")
    .limit(1)
    .maybeSingle();

  if (error) throwSupabaseError("가져오기 이력 조회", error);
  return data as MetaImportHistoryRecord | null;
}

/**
 * Records one import attempt. When both message_id and attachment_id are
 * present, this upserts on that pair (DB-enforced unique key) instead of a
 * plain insert — so a Gmail attachment that previously failed can be
 * retried and its history row overwritten in place, while a second attempt
 * at an already-succeeded attachment safely converges to the same row
 * instead of erroring or duplicating.
 */
export async function recordImportHistory(
  input: MetaImportHistoryInput
): Promise<MetaImportHistoryRecord> {
  const supabase = getSupabaseServiceRoleClient();

  if (input.message_id && input.attachment_id) {
    const { data, error } = await supabase
      .from("meta_import_history")
      .upsert(
        { ...input, processed_at: new Date().toISOString() },
        { onConflict: "message_id,attachment_id" }
      )
      .select("*")
      .single();

    if (error) throwSupabaseError("가져오기 이력 저장", error);
    return data as MetaImportHistoryRecord;
  }

  const { data, error } = await supabase
    .from("meta_import_history")
    .insert(input)
    .select("*")
    .single();

  if (error) throwSupabaseError("가져오기 이력 저장", error);
  return data as MetaImportHistoryRecord;
}

export async function getLatestImportHistory(limit = 20): Promise<MetaImportHistoryRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("meta_import_history")
    .select("*")
    .order("processed_at", { ascending: false })
    .limit(limit);

  if (error) throwSupabaseError("가져오기 이력 조회", error);
  return (data ?? []) as MetaImportHistoryRecord[];
}

export async function getTodaySuccessCount(): Promise<number> {
  const supabase = getSupabaseServiceRoleClient();
  const since = startOfTodayKst().toISOString();

  const { count, error } = await supabase
    .from("meta_import_history")
    .select("id", { count: "exact", head: true })
    .eq("status", "success")
    .gte("processed_at", since);

  if (error) throwSupabaseError("오늘 수집 건수 조회", error);
  return count ?? 0;
}

export async function getLatestMetaDailyDate(): Promise<string | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("meta_daily")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throwSupabaseError("meta_daily 조회", error);
  return data?.date ?? null;
}

// --- meta_sync_settings -------------------------------------------------------

interface SettingsRow {
  subject_keywords: string[];
  lookback_hours: number;
  allowed_extensions: string[];
  auto_sync_enabled: boolean;
}

function mapSettingsRow(row: SettingsRow): MetaSyncSettings {
  return {
    subjectKeywords: row.subject_keywords,
    lookbackHours: row.lookback_hours,
    allowedExtensions: row.allowed_extensions,
    autoSyncEnabled: row.auto_sync_enabled,
  };
}

export async function getMetaSyncSettings(): Promise<MetaSyncSettings> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("meta_sync_settings")
    .select("subject_keywords, lookback_hours, allowed_extensions, auto_sync_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (error) throwSupabaseError("수집 설정 조회", error);
  if (!data) return DEFAULT_SETTINGS;
  return mapSettingsRow(data as SettingsRow);
}

export async function updateMetaSyncSettings(
  patch: Partial<MetaSyncSettings>
): Promise<MetaSyncSettings> {
  const supabase = getSupabaseServiceRoleClient();

  const updatePayload: Partial<SettingsRow> = {};
  if (patch.subjectKeywords) updatePayload.subject_keywords = patch.subjectKeywords;
  if (patch.lookbackHours !== undefined) updatePayload.lookback_hours = patch.lookbackHours;
  if (patch.allowedExtensions) updatePayload.allowed_extensions = patch.allowedExtensions;
  if (patch.autoSyncEnabled !== undefined) updatePayload.auto_sync_enabled = patch.autoSyncEnabled;

  const { data, error } = await supabase
    .from("meta_sync_settings")
    .update(updatePayload)
    .eq("id", 1)
    .select("subject_keywords, lookback_hours, allowed_extensions, auto_sync_enabled")
    .single();

  if (error) throwSupabaseError("수집 설정 저장", error);
  return mapSettingsRow(data as SettingsRow);
}

// --- gmail_credentials --------------------------------------------------------

interface GmailCredentialsRow {
  email_address: string | null;
  access_token: string | null;
  refresh_token: string;
  token_expiry: string | null;
  scope: string | null;
}

export async function getGmailCredentials(): Promise<GmailCredentials | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("gmail_credentials")
    .select("email_address, access_token, refresh_token, token_expiry, scope")
    .eq("id", 1)
    .maybeSingle();

  if (error) throwSupabaseError("Gmail 연결 정보 조회", error);
  if (!data) return null;

  const row = data as GmailCredentialsRow;
  return {
    emailAddress: row.email_address,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiry: row.token_expiry,
    scope: row.scope,
  };
}

export async function saveGmailCredentials(input: {
  emailAddress?: string | null;
  accessToken?: string | null;
  refreshToken: string;
  tokenExpiry?: string | null;
  scope?: string | null;
}): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from("gmail_credentials").upsert(
    {
      id: 1,
      email_address: input.emailAddress ?? null,
      access_token: input.accessToken ?? null,
      refresh_token: input.refreshToken,
      token_expiry: input.tokenExpiry ?? null,
      scope: input.scope ?? null,
    },
    { onConflict: "id" }
  );

  if (error) throwSupabaseError("Gmail 연결 정보 저장", error);
}

export async function updateGmailAccessToken(input: {
  accessToken: string;
  tokenExpiry?: string | null;
}): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("gmail_credentials")
    .update({ access_token: input.accessToken, token_expiry: input.tokenExpiry ?? null })
    .eq("id", 1);

  if (error) throwSupabaseError("Gmail 토큰 갱신", error);
}
