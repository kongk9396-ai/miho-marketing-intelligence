export interface AdAccountSettings {
  id: 1;
  official_start_date: string | null;
  planned_monthly_budget: number | null;
  planned_daily_budget: number | null;
  updated_at: string;
}

export interface AdAccountSettingsInput {
  official_start_date: string | null;
  planned_monthly_budget: number | null;
  planned_daily_budget: number | null;
}

export interface CampaignSettingsRecord {
  id: string;
  campaign_name: string;
  campaign_id: string | null;
  official_start_date: string | null;
  planned_daily_budget: number | null;
  planned_monthly_budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignSettingsInput {
  campaign_name: string;
  campaign_id: string | null;
  official_start_date: string | null;
  planned_daily_budget: number | null;
  planned_monthly_budget: number | null;
}

export const AD_OPERATIONAL_STATUSES = ["ACTIVE", "PAUSED", "OFF", "TESTING"] as const;
export type AdOperationalStatusValue = (typeof AD_OPERATIONAL_STATUSES)[number];

export interface AdOperationalStatusRecord {
  id: string;
  campaign_name: string;
  ad_name: string;
  ad_id: string | null;
  status: AdOperationalStatusValue;
  status_changed_at: string;
  reason: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdOperationalStatusInput {
  campaign_name: string;
  ad_name: string;
  ad_id: string | null;
  status: AdOperationalStatusValue;
  status_changed_at: string;
  reason: string | null;
  memo: string | null;
}

export interface AdOffSnapshotRecord {
  id: string;
  ad_operational_status_id: string | null;
  campaign_name: string | null;
  ad_name: string | null;
  spend: number | null;
  ctr: number | null;
  cpc: number | null;
  video_100_rate: number | null;
  landing_conversion_rate: number | null;
  db_count: number | null;
  valid_db_count: number | null;
  confirmed_bookings: number | null;
  snapshot_at: string;
}

export interface AdOffSnapshotInput {
  ad_operational_status_id: string;
  campaign_name: string | null;
  ad_name: string | null;
  spend: number | null;
  ctr: number | null;
  cpc: number | null;
  video_100_rate: number | null;
  landing_conversion_rate: number | null;
  db_count: number | null;
  valid_db_count: number | null;
  confirmed_bookings: number | null;
}
