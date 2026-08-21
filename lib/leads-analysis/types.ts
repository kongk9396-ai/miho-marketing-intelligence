export interface LeadAnalysisRow {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  procedure: string | null;
  is_valid: boolean;
  outcome_status: string;
  consultation_status: string;
  booking_status: string;
  visit_status: string;
  applied_at: string;
}

export interface DateRange {
  start: string; // YYYY-MM-DD, inclusive
  end: string; // YYYY-MM-DD, inclusive
}
