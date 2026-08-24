import type {
  AdBenchmarkSample,
  AdDiagnosisAction,
  AdDiagnosisAdInput,
  AdDiagnosisResult,
  AdDiagnosisStatus,
  AdGroupBenchmark,
} from "@/lib/ad-diagnosis/types";

/**
 * Deterministic, code-configured rules — no AI/LLM involved. Calibrate these
 * constants as real-world results come in; nothing else needs to change.
 * Mirrors the thresholds requested for the auto-diagnosis feature.
 */
export const AD_DIAGNOSIS_THRESHOLDS = {
  minImpressions: 1000,
  minLinkClicks: 20,
  minLandingPageViews: 20,

  creativeProblem: {
    ctrAtMost: 0.8,
    cpcVsMedianRatioAtLeast: 1.3,
    landingArrivalRateAtLeast: 75,
  },
  landingProblem: {
    ctrAtLeast: 0.8,
    landingArrivalRateAtLeast: 75,
    minLandingSessions: 100,
    ctaRateAtMost: 10,
  },
  formProblem: {
    ctaRateAtLeast: 10,
    formStartRateLowAtMost: 30,
    formCompleteRateLowAtMost: 30,
  },
  targetingProblem: {
    minLeadsForJudgment: 5,
    validDbRateLowAtMost: 30,
  },
  off: {
    /** Minimum spend before "zero conversions" is trusted as a real signal rather than noise. */
    minSpendForZeroConversionCheck: 100_000,
    /** All three of ctr/cpc/cost-per-landing-view must be this many times worse than the group median. */
    allMetricsWorseRatio: 1.3,
    versionCtrLowerAtLeast: 25,
    versionCostHigherAtLeast: 40,
  },
  scale: {
    minGroupSizeForRanking: 2,
  },
} as const;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Median/average across a comparison group (typically ads in the same campaign). */
export function computeGroupBenchmark(samples: AdBenchmarkSample[]): AdGroupBenchmark {
  return {
    groupSize: samples.length,
    medianCtr: median(samples.map((s) => s.ctr).filter((v): v is number => v !== null)),
    medianCpc: median(samples.map((s) => s.cpc).filter((v): v is number => v !== null)),
    medianCostPerLandingPageView: median(
      samples.map((s) => s.costPerLandingPageView).filter((v): v is number => v !== null)
    ),
    avgLandingConversionRate: average(
      samples.map((s) => s.landingConversionRate).filter((v): v is number => v !== null)
    ),
  };
}

function formatPercent(value: number | null, digits = 2): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

function formatWon(value: number | null): string {
  return value === null ? "—" : `${Math.round(value).toLocaleString("ko-KR")}원`;
}

interface DerivedMetrics {
  landingPageViews: number | null;
  costPerLandingPageView: number | null;
  landingArrivalRate: number | null;
}

function deriveMetrics(input: AdDiagnosisAdInput): DerivedMetrics {
  if (!input.ga4) {
    return { landingPageViews: null, costPerLandingPageView: null, landingArrivalRate: null };
  }
  const landingPageViews = input.ga4.landingPageViews;
  const costPerLandingPageView = landingPageViews > 0 ? input.meta.spend / landingPageViews : null;
  const landingArrivalRate =
    input.meta.linkClicks > 0 ? (landingPageViews / input.meta.linkClicks) * 100 : null;
  return { landingPageViews, costPerLandingPageView, landingArrivalRate };
}

function buildMetricsView(input: AdDiagnosisAdInput, derived: DerivedMetrics) {
  return {
    spend: input.meta.spend,
    impressions: input.meta.impressions,
    linkClicks: input.meta.linkClicks,
    ctr: input.meta.ctr,
    ctrSource: input.meta.ctrSource,
    cpc: input.meta.cpc,
    cpcSource: input.meta.cpcSource,
    landingPageViews: derived.landingPageViews,
    costPerLandingPageView: derived.costPerLandingPageView,
    landingArrivalRate: derived.landingArrivalRate,
    ctaRate: input.ga4?.ctaRate ?? null,
    formStartRate: input.ga4?.formStartRate ?? null,
    formCompleteRate: input.ga4?.formCompleteRate ?? null,
    landingConversionRate: input.ga4?.landingConversionRate ?? null,
    formCompleteTrackingConnected: input.ga4?.formCompleteTrackingConnected ?? true,
    videoCompletionRate: input.meta.videoCompletionRate,
  };
}

interface StatusResult {
  status: AdDiagnosisStatus;
  reasons: string[];
}

function diagnoseStatus(
  input: AdDiagnosisAdInput,
  benchmark: AdGroupBenchmark,
  derived: DerivedMetrics
): StatusResult {
  const t = AD_DIAGNOSIS_THRESHOLDS;
  const { meta, ga4 } = input;

  // --- INSUFFICIENT_DATA guards first — never infer a problem from missing data. ---
  if (meta.impressions < t.minImpressions) {
    return {
      status: "INSUFFICIENT_DATA",
      reasons: [`노출 ${meta.impressions.toLocaleString("ko-KR")}회로 판정 최소 기준(${t.minImpressions.toLocaleString("ko-KR")}회) 미만`],
    };
  }
  if (meta.linkClicks < t.minLinkClicks) {
    return {
      status: "INSUFFICIENT_DATA",
      reasons: [`링크 클릭 ${meta.linkClicks.toLocaleString("ko-KR")}회로 판정 최소 기준(${t.minLinkClicks}회) 미만`],
    };
  }
  if (!ga4) {
    return {
      status: "INSUFFICIENT_DATA",
      reasons: ["GA4 데이터 없음", "랜딩 판정 보류"],
    };
  }
  if (derived.landingPageViews === null || derived.landingPageViews < t.minLandingPageViews) {
    return {
      status: "INSUFFICIENT_DATA",
      reasons: [
        `랜딩 페이지 조회 ${(derived.landingPageViews ?? 0).toLocaleString("ko-KR")}회로 판정 최소 기준(${t.minLandingPageViews}회) 미만`,
        "랜딩 판정 보류",
      ],
    };
  }

  const ctr = meta.ctr;
  const cpc = meta.cpc;
  const landingArrivalRate = derived.landingArrivalRate;
  const ctaRate = ga4.ctaRate;

  // --- CREATIVE_PROBLEM: click-side is weak, landing delivery is fine. ---
  const ctrLow = ctr !== null && ctr < t.creativeProblem.ctrAtMost;
  const cpcHighVsMedian =
    cpc !== null &&
    benchmark.medianCpc !== null &&
    benchmark.medianCpc > 0 &&
    cpc >= benchmark.medianCpc * t.creativeProblem.cpcVsMedianRatioAtLeast;
  const landingArrivalOk =
    landingArrivalRate !== null && landingArrivalRate >= t.creativeProblem.landingArrivalRateAtLeast;

  if ((ctrLow || cpcHighVsMedian) && landingArrivalOk) {
    const reasons = [`CTR ${formatPercent(ctr)}`, `CPC ${formatWon(cpc)}`];
    if (cpcHighVsMedian) reasons.push(`CPC가 그룹 중앙값(${formatWon(benchmark.medianCpc)}) 대비 30% 이상 높음`);
    reasons.push(`랜딩 도달률 ${formatPercent(landingArrivalRate, 1)} (정상)`);
    return { status: "CREATIVE_PROBLEM", reasons };
  }

  // --- LANDING_PROBLEM: clicks arrive at the landing page, but nobody acts on it. ---
  const ctrOk = ctr !== null && ctr >= t.landingProblem.ctrAtLeast;
  const landingArrivalOk2 =
    landingArrivalRate !== null && landingArrivalRate >= t.landingProblem.landingArrivalRateAtLeast;
  const sessionsSufficient = ga4.landingSessions >= t.landingProblem.minLandingSessions;
  const ctaLow = ctaRate !== null && ctaRate < t.landingProblem.ctaRateAtMost;

  if (ctrOk && landingArrivalOk2 && sessionsSufficient && ctaLow) {
    return {
      status: "LANDING_PROBLEM",
      reasons: [
        `CTR ${formatPercent(ctr)} (정상)`,
        `랜딩 도달률 ${formatPercent(landingArrivalRate, 1)} (정상)`,
        `CTA 전환율 ${formatPercent(ctaRate, 1)} (기준 10% 미만)`,
      ],
    };
  }

  // --- FORM_PROBLEM: CTA is fine, but the form leaks people. ---
  const ctaOk = ctaRate !== null && ctaRate >= t.formProblem.ctaRateAtLeast;
  const hasFormStarts = ga4.formStarts > 0;
  const formStartRateLow =
    ga4.formStartRate !== null && ga4.formStartRate < t.formProblem.formStartRateLowAtMost;
  // Never treat a 0% completion rate as a real signal when GA4 hasn't
  // recorded a single form_complete event anywhere in the window — that
  // means the tracking event itself isn't connected, not that this ad's
  // completion is genuinely 0%.
  const formCompleteRateLow =
    ga4.formCompleteTrackingConnected &&
    ga4.formCompleteRate !== null &&
    ga4.formCompleteRate < t.formProblem.formCompleteRateLowAtMost;

  if (ctaOk && hasFormStarts && (formStartRateLow || formCompleteRateLow)) {
    const reasons = [`CTA 전환율 ${formatPercent(ctaRate, 1)} (정상)`];
    if (formStartRateLow) reasons.push(`폼 시작률 ${formatPercent(ga4.formStartRate, 1)} (기준 30% 미만)`);
    if (formCompleteRateLow) reasons.push(`폼 완료율 ${formatPercent(ga4.formCompleteRate, 1)} (기준 30% 미만)`);
    if (!ga4.formCompleteTrackingConnected) reasons.push("폼 완료 추적 미연결 (참고용, 판정 근거 아님)");
    return { status: "FORM_PROBLEM", reasons };
  }

  // --- TARGETING_PROBLEM: funnel behavior is fine, but lead quality is not. Withheld without data. ---
  if (input.targeting && input.targeting.totalLeads >= t.targetingProblem.minLeadsForJudgment) {
    const funnelLooksFine = !ctaLow && !formStartRateLow && !formCompleteRateLow;
    const validRateLow =
      input.targeting.validDbRate !== null &&
      input.targeting.validDbRate < t.targetingProblem.validDbRateLowAtMost;
    if (funnelLooksFine && validRateLow) {
      return {
        status: "TARGETING_PROBLEM",
        reasons: [
          `유효 DB율 ${formatPercent(input.targeting.validDbRate, 1)} (기준 30% 미만)`,
          `리드 ${input.targeting.totalLeads.toLocaleString("ko-KR")}건 중 유효 ${input.targeting.validLeads.toLocaleString("ko-KR")}건`,
          "클릭/랜딩 단계 지표는 정상",
        ],
      };
    }
  }

  // --- HEALTHY: sufficient data, no problem rule fired. ---
  const reasons: string[] = [`CTR ${formatPercent(ctr)}`, `CPC ${formatWon(cpc)}`];
  if (derived.costPerLandingPageView !== null) {
    reasons.push(`랜딩 조회당 비용 ${formatWon(derived.costPerLandingPageView)}`);
  }
  return { status: "HEALTHY", reasons };
}

function decideAction(
  input: AdDiagnosisAdInput,
  benchmark: AdGroupBenchmark,
  status: AdDiagnosisStatus,
  derived: DerivedMetrics
): { action: AdDiagnosisAction; reasons: string[] } {
  const t = AD_DIAGNOSIS_THRESHOLDS;
  const { meta, ga4 } = input;

  if (status === "INSUFFICIENT_DATA") {
    return { action: "WATCH", reasons: ["데이터가 충분하지 않아 관찰이 필요합니다"] };
  }

  // --- OFF checks (require sufficient data, independent of which problem status fired) ---

  // a) all three of ctr/cpc/cost-per-landing-view are clearly worse than the group median.
  if (
    meta.ctr !== null &&
    meta.cpc !== null &&
    derived.costPerLandingPageView !== null &&
    benchmark.medianCtr !== null &&
    benchmark.medianCtr > 0 &&
    benchmark.medianCpc !== null &&
    benchmark.medianCostPerLandingPageView !== null &&
    meta.ctr <= benchmark.medianCtr / t.off.allMetricsWorseRatio &&
    meta.cpc >= benchmark.medianCpc * t.off.allMetricsWorseRatio &&
    derived.costPerLandingPageView >= benchmark.medianCostPerLandingPageView * t.off.allMetricsWorseRatio
  ) {
    return {
      action: "OFF",
      reasons: ["CTR/CPC/랜딩 조회당 비용이 모두 그룹 대비 명확히 열세"],
    };
  }

  // b) version vs. original creative regression.
  if (input.original && meta.ctr !== null && input.original.ctr !== null && input.original.ctr > 0) {
    const ctrDropPercent = ((input.original.ctr - meta.ctr) / input.original.ctr) * 100;
    const cpcUpPercent =
      meta.cpc !== null && input.original.cpc !== null && input.original.cpc > 0
        ? ((meta.cpc - input.original.cpc) / input.original.cpc) * 100
        : null;
    const costPerLpvUpPercent =
      derived.costPerLandingPageView !== null &&
      input.original.costPerLandingPageView !== null &&
      input.original.costPerLandingPageView > 0
        ? ((derived.costPerLandingPageView - input.original.costPerLandingPageView) /
            input.original.costPerLandingPageView) *
          100
        : null;

    if (
      ctrDropPercent >= t.off.versionCtrLowerAtLeast &&
      ((cpcUpPercent !== null && cpcUpPercent >= t.off.versionCostHigherAtLeast) ||
        (costPerLpvUpPercent !== null && costPerLpvUpPercent >= t.off.versionCostHigherAtLeast))
    ) {
      return {
        action: "OFF",
        reasons: [
          `원본(${input.original.adName ?? input.original.adId}) 대비 CTR ${ctrDropPercent.toFixed(1)}% 낮음`,
          "원본 대비 비용 40% 이상 높음",
        ],
      };
    }
  }

  // c) spend cleared a minimum bar but produced zero conversions. Withheld
  // when form_complete tracking itself isn't connected sitewide — a global
  // tracking gap, not evidence this specific ad converted 0 people.
  if (
    meta.spend >= t.off.minSpendForZeroConversionCheck &&
    ga4 &&
    ga4.formCompleteTrackingConnected &&
    ga4.formCompletes === 0
  ) {
    return {
      action: "OFF",
      reasons: [`광고비 ${formatWon(meta.spend)} 지출에도 전환 0건`],
    };
  }

  if (status !== "HEALTHY") {
    return { action: "WATCH", reasons: ["문제 신호가 있어 추가 관찰이 필요합니다"] };
  }

  // --- SCALE: best-in-group on cost efficiency AND at-or-above-average GA4 conversion. ---
  if (benchmark.groupSize >= t.scale.minGroupSizeForRanking) {
    const isTopCtr = meta.ctr !== null && benchmark.medianCtr !== null && meta.ctr >= benchmark.medianCtr;
    const isLowCpc = meta.cpc !== null && benchmark.medianCpc !== null && meta.cpc <= benchmark.medianCpc;
    const isLowCostPerLpv =
      derived.costPerLandingPageView !== null &&
      benchmark.medianCostPerLandingPageView !== null &&
      derived.costPerLandingPageView <= benchmark.medianCostPerLandingPageView;
    const conversionAboveAvg =
      ga4?.landingConversionRate !== null &&
      ga4?.landingConversionRate !== undefined &&
      benchmark.avgLandingConversionRate !== null &&
      ga4.landingConversionRate >= benchmark.avgLandingConversionRate;

    if (isTopCtr && isLowCpc && isLowCostPerLpv && conversionAboveAvg) {
      return {
        action: "SCALE",
        reasons: ["CTR/CPC/랜딩 조회당 비용 모두 그룹 상위권이며 GA4 전환율도 평균 이상"],
      };
    }
  }

  return { action: "KEEP", reasons: ["비교군 평균 이상이며 문제 판정 없음"] };
}

const RECOMMENDATIONS: Record<AdDiagnosisStatus, Record<AdDiagnosisAction, string[]>> = {
  HEALTHY: {
    SCALE: ["예산 확대 검토", "유사 소재/타겟으로 확장 테스트"],
    KEEP: ["유지", "신규 소재 테스트의 컨트롤 광고로 사용"],
    WATCH: ["1~2주 추가 관찰"],
    OFF: ["OFF"],
  },
  CREATIVE_PROBLEM: {
    SCALE: ["예산 확대 검토"],
    KEEP: ["소재 후킹/썸네일 교체 검토"],
    WATCH: ["소재 후킹/썸네일 교체 검토", "1~2주 추가 관찰 후 재판정"],
    OFF: ["OFF", "후킹/CTA 교체 후 신규 광고로 재테스트"],
  },
  LANDING_PROBLEM: {
    SCALE: ["예산 확대 검토"],
    KEEP: ["랜딩 페이지 점검"],
    WATCH: ["랜딩 페이지 개선 필요 (후킹/속도/신뢰 요소 점검)", "GA4 스크롤/이탈 지점 추가 분석"],
    OFF: ["OFF", "랜딩 페이지 개선 후 재테스트"],
  },
  FORM_PROBLEM: {
    SCALE: ["예산 확대 검토"],
    KEEP: ["폼 UX 점검"],
    WATCH: ["폼 UX 점검 (단계 수, 필드 수, 로딩 속도)", "폼 이탈 구간 GA4에서 추가 분석"],
    OFF: ["OFF", "폼 개편 후 재테스트"],
  },
  TARGETING_PROBLEM: {
    SCALE: ["예산 확대 검토"],
    KEEP: ["타겟팅 점검"],
    WATCH: ["타겟팅 재검토 (연령/지역/관심사)", "리드 품질 기준 재확인"],
    OFF: ["OFF", "타겟팅 재설정 후 재테스트"],
  },
  INSUFFICIENT_DATA: {
    SCALE: ["데이터 축적 후 재판정"],
    KEEP: ["데이터 축적 후 재판정"],
    WATCH: ["데이터 축적 후 재판정", "예산/노출 확대 후 재확인"],
    OFF: ["데이터 축적 후 재판정"],
  },
};

function buildRecommendations(status: AdDiagnosisStatus, action: AdDiagnosisAction): string[] {
  return RECOMMENDATIONS[status][action];
}

/** Pure diagnosis for a single ad, given its own metrics and its comparison group's benchmark. */
export function diagnoseAd(input: AdDiagnosisAdInput, benchmark: AdGroupBenchmark): AdDiagnosisResult {
  const derived = deriveMetrics(input);
  const { status, reasons: statusReasons } = diagnoseStatus(input, benchmark, derived);
  const { action, reasons: actionReasons } = decideAction(input, benchmark, status, derived);

  return {
    adId: input.adId,
    adName: input.adName,
    campaignName: input.campaignName,
    status,
    action,
    reasons: [...statusReasons, ...actionReasons].slice(0, 4),
    recommendations: buildRecommendations(status, action),
    metrics: buildMetricsView(input, derived),
  };
}
