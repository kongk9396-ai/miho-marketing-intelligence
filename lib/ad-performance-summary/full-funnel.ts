export interface FullFunnelStage {
  key: string;
  label: string;
  /** Null = data unavailable (source not yet collected) — never a fabricated 0. */
  count: number | null;
  /** % of the immediately previous stage. Null when the two stages come from different tracking sources and can't be reliably chained (spec section 7 — never forced). */
  conversionFromPrevious: number | null;
  /** Present only at a source boundary, explaining why conversionFromPrevious is null there. */
  note?: string;
}

export interface FullFunnelInput {
  hasMetaData: boolean;
  metaImpressions: number;
  metaVideoPlays3s: number;
  metaLinkClicks: number;
  hasGa4Data: boolean;
  ga4LandingViews: number;
  ga4CtaClicks: number;
  ga4FormStarts: number;
  hasLeadsData: boolean;
  totalDb: number;
  validDb: number;
  confirmedBookings: number;
}

function pctOf(numerator: number, denominator: number): number | null {
  return denominator > 0 ? (numerator / denominator) * 100 : null;
}

/**
 * Meta 광고 → 영상 시청 → 광고 클릭 → GA4 랜딩 → CTA → form_start → DB →
 * 유효 DB → 예약 확정 (spec section 7), built entirely from sitewide totals
 * already computed elsewhere (dashboard/ad-diagnosis/leads-analysis
 * aggregates) — this module only assembles and labels them. Conversion %
 * is computed only within one tracking source (Meta-internal, GA4-internal,
 * leads-internal); the two cross-source boundaries (Meta clicks -> GA4
 * sessions, GA4 form_start -> DB) show both counts side by side without an
 * invented conversion rate between them.
 */
export function buildFullFunnel(input: FullFunnelInput): FullFunnelStage[] {
  const stages: FullFunnelStage[] = [];

  stages.push({
    key: "impressions",
    label: "Meta 노출",
    count: input.hasMetaData ? input.metaImpressions : null,
    conversionFromPrevious: null,
  });
  stages.push({
    key: "video3s",
    label: "영상 3초 시청",
    count: input.hasMetaData ? input.metaVideoPlays3s : null,
    conversionFromPrevious: input.hasMetaData ? pctOf(input.metaVideoPlays3s, input.metaImpressions) : null,
  });
  stages.push({
    key: "linkClicks",
    label: "광고 클릭",
    count: input.hasMetaData ? input.metaLinkClicks : null,
    conversionFromPrevious: input.hasMetaData ? pctOf(input.metaLinkClicks, input.metaVideoPlays3s) : null,
  });
  stages.push({
    key: "landingViews",
    label: "GA4 랜딩 조회",
    count: input.hasGa4Data ? input.ga4LandingViews : null,
    conversionFromPrevious: null,
    note: "Meta 클릭수와 GA4 랜딩 조회수는 서로 다른 추적 시스템 값으로, 전환율을 억지로 계산하지 않습니다.",
  });
  stages.push({
    key: "ctaClicks",
    label: "CTA 클릭",
    count: input.hasGa4Data ? input.ga4CtaClicks : null,
    conversionFromPrevious: input.hasGa4Data ? pctOf(input.ga4CtaClicks, input.ga4LandingViews) : null,
  });
  stages.push({
    key: "formStarts",
    label: "폼 시작",
    count: input.hasGa4Data ? input.ga4FormStarts : null,
    conversionFromPrevious: input.hasGa4Data ? pctOf(input.ga4FormStarts, input.ga4CtaClicks) : null,
  });
  stages.push({
    key: "totalDb",
    label: "DB",
    count: input.hasLeadsData ? input.totalDb : null,
    conversionFromPrevious: null,
    note: "GA4 폼 시작과 DB(리드 시트)는 서로 다른 추적 시스템 값으로, 전환율을 억지로 계산하지 않습니다. 과거 DB는 UTM 미수집으로 광고별 귀속이 불가해 전체 집계로 표시됩니다.",
  });
  stages.push({
    key: "validDb",
    label: "유효 DB",
    count: input.hasLeadsData ? input.validDb : null,
    conversionFromPrevious: input.hasLeadsData ? pctOf(input.validDb, input.totalDb) : null,
  });
  stages.push({
    key: "confirmedBookings",
    label: "예약 확정",
    count: input.hasLeadsData ? input.confirmedBookings : null,
    conversionFromPrevious: input.hasLeadsData ? pctOf(input.confirmedBookings, input.validDb) : null,
  });

  return stages;
}
