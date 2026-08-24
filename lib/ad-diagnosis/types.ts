export type AdDiagnosisStatus =
  | "HEALTHY"
  | "CREATIVE_PROBLEM"
  | "LANDING_PROBLEM"
  | "FORM_PROBLEM"
  | "TARGETING_PROBLEM"
  | "INSUFFICIENT_DATA";

export type AdDiagnosisAction = "SCALE" | "KEEP" | "WATCH" | "OFF";

/**
 * "count" = recomputed from real per-row click counts (exact).
 * "raw_metric" = raw click counts weren't available in the source data, so
 * this is rebuilt from Meta's own reported rate column instead (see
 * lib/ad-diagnosis/meta-rate-fallback.ts) — still Meta's real number, not a
 * guess, but flagged so the UI can note it's not a from-clicks recompute.
 * "none" = neither exists; the corresponding value is null, never a
 * fabricated 0.
 */
export type MetaRateSource = "count" | "raw_metric" | "none";

export interface AdMetaMetrics {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number | null;
  linkClicks: number;
  /** clicks / impressions * 100 — matches the `ctr` convention used elsewhere in this app. */
  ctr: number | null;
  ctrSource: MetaRateSource;
  /** spend / clicks — matches the `cpc` convention used elsewhere in this app. */
  cpc: number | null;
  cpcSource: MetaRateSource;
  video3s: number;
  video25: number;
  video50: number;
  video75: number;
  video95: number;
  video100: number;
  /** video_100 / video_3s * 100, per this feature's spec (not the same denominator as elsewhere). */
  videoCompletionRate: number | null;
}

export interface AdGa4Metrics {
  /** GA4 sessions on the mapped campaign/content — treated as "랜딩 세션". */
  landingSessions: number;
  /** GA4 page views on the mapped campaign/content — treated as "랜딩 페이지 조회". */
  landingPageViews: number;
  ctaClicks: number;
  formStarts: number;
  formCompletes: number;
  ctaRate: number | null;
  formStartRate: number | null;
  formCompleteRate: number | null;
  landingConversionRate: number | null;
  /**
   * false = GA4 recorded zero form_complete events across every campaign in
   * the analysis window (not just this ad) while form_start events did
   * fire — strong evidence the form_complete tracking event itself isn't
   * wired up on the site, not that completion is genuinely 0%. When false,
   * formCompleteRate/landingConversionRate must never be used as FORM_PROBLEM
   * or zero-conversion OFF evidence, and the UI must show "폼 완료 추적
   * 미연결" rather than "0.0%".
   */
  formCompleteTrackingConnected: boolean;
}

export interface AdTargetingMetrics {
  totalLeads: number;
  validLeads: number;
  validDbRate: number | null;
}

/** The other ad this one is a creative "version" of, for the OFF version-regression check. */
export interface OriginalAdReference {
  adId: string;
  adName: string | null;
  ctr: number | null;
  cpc: number | null;
  costPerLandingPageView: number | null;
}

export interface AdDiagnosisAdInput {
  adId: string;
  adName: string | null;
  campaignName: string | null;
  meta: AdMetaMetrics;
  /** null = no GA4 mapping could be resolved, or the mapping resolved but has zero rows. */
  ga4: AdGa4Metrics | null;
  /** null = no leads could be matched to this ad's UTM values — targeting judgment is withheld, never guessed. */
  targeting: AdTargetingMetrics | null;
  original: OriginalAdReference | null;
}

export interface AdBenchmarkSample {
  adId: string;
  ctr: number | null;
  cpc: number | null;
  costPerLandingPageView: number | null;
  landingConversionRate: number | null;
}

export interface AdGroupBenchmark {
  groupSize: number;
  medianCtr: number | null;
  medianCpc: number | null;
  medianCostPerLandingPageView: number | null;
  avgLandingConversionRate: number | null;
}

export interface AdDiagnosisMetricsView {
  spend: number;
  impressions: number;
  linkClicks: number;
  ctr: number | null;
  ctrSource: MetaRateSource;
  cpc: number | null;
  cpcSource: MetaRateSource;
  landingPageViews: number | null;
  costPerLandingPageView: number | null;
  landingArrivalRate: number | null;
  ctaRate: number | null;
  formStartRate: number | null;
  formCompleteRate: number | null;
  landingConversionRate: number | null;
  formCompleteTrackingConnected: boolean;
  videoCompletionRate: number | null;
}

export interface AdDiagnosisResult {
  adId: string;
  adName: string | null;
  campaignName: string | null;
  status: AdDiagnosisStatus;
  action: AdDiagnosisAction;
  reasons: string[];
  recommendations: string[];
  metrics: AdDiagnosisMetricsView;
}
