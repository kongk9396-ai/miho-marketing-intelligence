export const LANDING_CHANGE_TYPES = ["layout", "copy", "cta", "price", "structure", "other"] as const;
export type LandingChangeType = (typeof LANDING_CHANGE_TYPES)[number];

export interface LandingChangeRecord {
  id: string;
  landing_name: string;
  landing_page_pattern: string | null;
  linked_campaign_name: string | null;
  changed_at: string;
  change_type: LandingChangeType;
  old_version: string | null;
  new_version: string | null;
  memo: string | null;
  comparison_period_days: number;
  forced: boolean;
  created_at: string;
  updated_at: string;
}

export interface LandingChangeInput {
  landing_name: string;
  landing_page_pattern: string | null;
  linked_campaign_name: string | null;
  changed_at: string;
  change_type: LandingChangeType;
  old_version: string | null;
  new_version: string | null;
  memo: string | null;
  comparison_period_days: number;
  forced: boolean;
}

/** The GA4-side equivalent of lib/creative-changes' PeriodMetrics — aggregated over one before/after window for one landing (or sitewide, when landing_page_pattern is null). */
export interface LandingPeriodMetrics {
  dayCount: number;
  landingViews: number;
  ctaClicks: number;
  ctaRate: number | null;
  formStarts: number;
  formStartRate: number | null;
  formCompletes: number;
  formCompleteRate: number | null;
  /** 100 - ctaRate. Null when ctaRate is null. */
  landingToCtaDropoffRate: number | null;
  /** 100 - formStartRate. Null when formStartRate is null. */
  ctaToFormStartDropoffRate: number | null;
}

/** DB/valid-DB/booking counts for one window, only ever populated when a landing change is linked to a campaign. */
export interface LandingDbSnapshot {
  totalDb: number;
  validDb: number;
  confirmedBookings: number;
}
