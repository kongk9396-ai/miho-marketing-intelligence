export const CHANGE_TYPES = [
  "video",
  "thumbnail",
  "copy",
  "hook",
  "cta",
  "landing",
  "price",
  "event_text",
  "budget",
  "target",
  "campaign_structure",
  "call_team",
  "other",
] as const;

export type ChangeType = (typeof CHANGE_TYPES)[number];

export interface CreativeChangeRecord {
  id: string;
  campaign_id: string | null;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  ad_id: string;
  ad_name: string | null;
  changed_at: string;
  change_type: ChangeType;
  old_version: string | null;
  new_version: string | null;
  memo: string | null;
  comparison_period_days: number;
  forced: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreativeChangeInput {
  campaign_id: string | null;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  ad_id: string;
  ad_name: string | null;
  changed_at: string;
  change_type: ChangeType;
  old_version: string | null;
  new_version: string | null;
  memo: string | null;
  comparison_period_days: number;
  forced: boolean;
}

export type ObservationStatus =
  | "observing"
  | "insufficient_data"
  | "verdict_ready"
  | "rollback_review"
  | "winner_confirmed";

export type VerdictType = "improved" | "worsened" | "neutral" | "insufficient_data";

export interface VerdictResult {
  verdict: VerdictType;
  headline: string;
  reasons: string[];
  recommendation: string;
}

export interface DateRange {
  start: string; // YYYY-MM-DD, inclusive
  end: string; // YYYY-MM-DD, inclusive
}

export interface MetaDailyLike {
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number | null;
  clicks: number;
  link_clicks: number;
  video_plays: number;
  video_3s: number;
  video_25: number;
  video_50: number;
  video_75: number;
  video_95: number;
  video_100: number;
  avg_watch_time: number | null;
}

export interface PeriodMetrics {
  dayCount: number;
  totalSpend: number;
  totalImpressions: number;
  totalReach: number;
  avgFrequency: number | null;
  totalClicks: number;
  totalLinkClicks: number;
  ctr: number | null;
  linkCtr: number | null;
  cpc: number | null;
  linkCpc: number | null;
  cpm: number | null;
  avgWatchTime: number | null;
  totalVideoPlays: number;
  video3s: RetentionRate;
  video25: RetentionRate;
  video50: RetentionRate;
  video75: RetentionRate;
  video95: RetentionRate;
  video100: RetentionRate;
}

export interface RetentionRate {
  count: number;
  rate: number | null;
  reliable: boolean;
}

export type MetricPolarity = "higher_is_better" | "lower_is_better";

export type MetricSection = "delivery" | "click" | "video";

export interface MetricComparisonRow {
  key: string;
  label: string;
  section: MetricSection;
  polarity: MetricPolarity;
  beforeValue: number | null;
  afterValue: number | null;
  beforeDisplay: string;
  afterDisplay: string;
  diffDisplay: string;
  changePercent: number | null;
  changePercentDisplay: string;
  status: "improved" | "worsened" | "flat" | "unavailable";
  statusLabel: string;
}
