export interface CombinedMetaSummary {
  spend: number;
  impressions: number;
  ctr: number | null;
  cpc: number | null;
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
