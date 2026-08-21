import type { BookingStatus, ConsultationStatus, OutcomeStatus, VisitStatus } from "@/lib/leads-sync/status-mapping";

export interface LeadsSheetConfig {
  id: string;
  sheet_name: string;
  procedure_label: string | null;
  enabled: boolean;
  column_overrides: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface LeadsSheetConfigInput {
  sheet_name: string;
  procedure_label: string | null;
  enabled: boolean;
  column_overrides: Record<string, string>;
}

export interface LeadUpsertRow {
  lead_key: string;
  source_row_number: number | null;
  applied_at: string;
  preferred_visit_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  landing_name: string | null;
  procedure: string | null;
  is_valid: boolean;
  invalid_reason: string | null;
  outcome_status: OutcomeStatus;
  consultant: string | null;
  consultation_status: ConsultationStatus;
  booking_status: BookingStatus;
  visit_status: VisitStatus;
  source: string;
}

export interface RowSkipReason {
  sheetName: string;
  rowNumber: number;
  reason: string;
}

export interface MapSheetRowsResult {
  rows: LeadUpsertRow[];
  skipped: RowSkipReason[];
}

export interface LeadsSyncHistoryInput {
  row_count: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  status: "success" | "partial" | "failed";
  error_message?: string | null;
}

export interface LeadsSyncHistoryRecord extends LeadsSyncHistoryInput {
  id: string;
  processed_at: string;
  created_at: string;
}

export interface UpsertResult {
  inserted: number;
  updated: number;
}
