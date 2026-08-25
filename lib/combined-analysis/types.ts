export interface CombinedMetaSummary {
  spend: number;
  impressions: number;
  ctr: number | null;
  /** "count" = from real click counts (all-clicks or link-clicks), "raw_metric" = rebuilt from Meta's own reported rate column, "none" = neither exists. See lib/ad-diagnosis/meta-rate-fallback.ts. */
  ctrSource: "count" | "raw_metric" | "none";
  cpc: number | null;
  cpcSource: "count" | "raw_metric" | "none";
  video50Rate: number | null;
}

export interface CombinedGa4Summary {
  sessions: number;
  ctaClicks: number;
  ctaRate: number | null;
  formStarts: number;
  formStartRate: number | null;
  formCompletes: number;
  formCompleteRate: number | null;
  /** False = form_start events fired sitewide in this window but form_complete never did — a disconnected tracking event, not genuine 0% completion. The UI must show "추적 미연결", never "0", when this is false. */
  formCompleteTrackingConnected: boolean;
}

export interface CombinedAdSummary {
  adId: string;
  adName: string | null;
  campaignName: string | null;
  meta: CombinedMetaSummary;
  ga4: CombinedGa4Summary | null;
  utmSource: "manual_mapping" | "auto_match" | null;
}

export type ProblemClassification =
  | "creative_problem"
  | "landing_problem"
  | "both_problem"
  | "insufficient_data"
  | "no_issue";

export interface ProblemClassificationResult {
  classification: ProblemClassification;
  headline: string;
  reasons: string[];
}
