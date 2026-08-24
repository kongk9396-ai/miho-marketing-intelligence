export interface MetaDailyInsert {
  date: string;
  account_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  ad_id: string;
  /** True when ad_id was generated from campaign_name+adset_name+ad_name because the file had no real Ad ID for this row. */
  is_temp_ad_id: boolean;
  ad_name: string | null;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number | null;
  clicks: number;
  link_clicks: number;
  ctr: number | null;
  link_ctr: number | null;
  cpc: number | null;
  link_cpc: number | null;
  cpm: number | null;
  video_plays: number;
  video_3s: number;
  video_25: number;
  video_50: number;
  video_75: number;
  video_95: number;
  video_100: number;
  avg_watch_time: number | null;
}

export interface RowParseError {
  rowNumber: number;
  message: string;
}

export interface ParseResult {
  rows: MetaDailyInsert[];
  rowErrors: RowParseError[];
  /** Set when the file is missing a required column (date, campaign_name, or ad_name) — parsing aborted entirely. */
  fatalError?: string;
}

export type MetaImportSourceType = "manual" | "gmail";

export type MetaImportStatus =
  | "success"
  | "partial"
  | "failed"
  | "duplicate"
  | "unsupported"
  | "no_new_reports";

export interface MetaImportHistoryInput {
  source_type: MetaImportSourceType;
  message_id?: string | null;
  attachment_id?: string | null;
  file_name?: string | null;
  file_hash?: string | null;
  report_start_date?: string | null;
  report_end_date?: string | null;
  row_count: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  status: MetaImportStatus;
  error_message?: string | null;
}

export interface MetaImportHistoryRecord extends MetaImportHistoryInput {
  id: string;
  processed_at: string;
  created_at: string;
}

export interface MetaSyncSettings {
  subjectKeywords: string[];
  lookbackHours: number;
  allowedExtensions: string[];
  autoSyncEnabled: boolean;
}

export interface GmailCredentials {
  emailAddress: string | null;
  accessToken: string | null;
  refreshToken: string;
  tokenExpiry: string | null;
  scope: string | null;
}

export interface UpsertResult {
  inserted: number;
  updated: number;
}
