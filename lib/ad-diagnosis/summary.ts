import type { AdDiagnosisAction, AdDiagnosisResult, AdDiagnosisStatus } from "@/lib/ad-diagnosis/types";

export interface CampaignDiagnosisSummary {
  campaignName: string;
  adCount: number;
  statusCounts: Record<AdDiagnosisStatus, number>;
  actionCounts: Record<AdDiagnosisAction, number>;
  summaryText: string;
}

function emptyStatusCounts(): Record<AdDiagnosisStatus, number> {
  return {
    HEALTHY: 0,
    CREATIVE_PROBLEM: 0,
    LANDING_PROBLEM: 0,
    FORM_PROBLEM: 0,
    TARGETING_PROBLEM: 0,
    INSUFFICIENT_DATA: 0,
  };
}

function emptyActionCounts(): Record<AdDiagnosisAction, number> {
  return { SCALE: 0, KEEP: 0, WATCH: 0, OFF: 0 };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

const DOMINANT_PROBLEM_TEXT: Record<"CREATIVE_PROBLEM" | "LANDING_PROBLEM" | "FORM_PROBLEM" | "TARGETING_PROBLEM", string> = {
  CREATIVE_PROBLEM: "현재 문제는 랜딩보다 광고 소재 간 편차가 더 큽니다.",
  LANDING_PROBLEM: "현재 문제는 광고 소재보다 랜딩 단계 이탈이 더 큽니다.",
  FORM_PROBLEM: "현재 문제는 랜딩보다 폼 단계 이탈이 더 큽니다.",
  TARGETING_PROBLEM: "현재 문제는 클릭/랜딩 단계보다 리드(타겟팅) 품질에서 더 크게 나타납니다.",
};

/**
 * Produces the 2-4 sentence Korean summary shown at the top of a campaign's
 * auto-diagnosis section — a plain-language answer to "소재를 바꿔야 하는지,
 * 랜딩을 수정해야 하는지, 폼을 수정해야 하는지, 현재 유지해야 하는지".
 *
 * The data-sufficiency sentence is always evaluated first and independently
 * of the problem/health verdict below it — a campaign whose ads are mostly
 * INSUFFICIENT_DATA must never be described as "안정적", since "안정적" is a
 * judgment about the ads that were actually judgable, not an absence of data.
 */
export function summarizeCampaignDiagnosis(
  campaignName: string,
  results: AdDiagnosisResult[]
): CampaignDiagnosisSummary {
  const statusCounts = emptyStatusCounts();
  const actionCounts = emptyActionCounts();
  for (const r of results) {
    statusCounts[r.status] += 1;
    actionCounts[r.action] += 1;
  }

  const sentences: string[] = [];
  const insufficientCount = statusCounts.INSUFFICIENT_DATA;
  const judgable = results.filter((r) => r.status !== "INSUFFICIENT_DATA");

  if (results.length > 0 && insufficientCount === results.length) {
    sentences.push("현재 캠페인은 판정 가능한 데이터가 부족합니다. 데이터가 더 쌓인 후 재확인이 필요합니다.");
    return {
      campaignName,
      adCount: results.length,
      statusCounts,
      actionCounts,
      summaryText: sentences.join(" "),
    };
  }

  if (insufficientCount > 0) {
    sentences.push("일부 광고는 아직 표본이 부족합니다. 판정 가능한 광고를 기준으로 성과를 확인하세요.");
  }

  const problemCounts: [keyof typeof DOMINANT_PROBLEM_TEXT, number][] = [
    ["CREATIVE_PROBLEM", statusCounts.CREATIVE_PROBLEM],
    ["LANDING_PROBLEM", statusCounts.LANDING_PROBLEM],
    ["FORM_PROBLEM", statusCounts.FORM_PROBLEM],
    ["TARGETING_PROBLEM", statusCounts.TARGETING_PROBLEM],
  ];
  const [dominantKey, dominantCount] = problemCounts.reduce((max, cur) => (cur[1] > max[1] ? cur : max));

  if (dominantCount > 0) {
    sentences.push(DOMINANT_PROBLEM_TEXT[dominantKey]);
  } else if (judgable.length > 0 && judgable.every((r) => r.status === "HEALTHY")) {
    sentences.push("판정 가능한 광고는 뚜렷한 문제 신호 없이 안정적인 성과를 보이고 있습니다. 소재/랜딩/폼 전면 수정 없이 현재 세팅을 유지하세요.");
  }

  const offAds = results.filter((r) => r.action === "OFF").map((r) => r.adName ?? r.adId);
  const keepAds = results.filter((r) => r.action === "KEEP" || r.action === "SCALE");
  if (offAds.length > 0) {
    sentences.push(
      `일부 광고에서 성과 악화 신호가 감지되었습니다 — ${offAds.slice(0, 3).join(", ")}${offAds.length > 3 ? ` 외 ${offAds.length - 3}건` : ""}은 중단(OFF)을 권장합니다.` +
        (keepAds.length > 0 ? " 나머지 소재는 유지하며 비교 기준으로 사용하세요." : "")
    );
  }

  if (actionCounts.SCALE > 0) {
    const scaleAds = results.filter((r) => r.action === "SCALE").map((r) => r.adName ?? r.adId);
    sentences.push(`일부 광고에서 개선 신호가 확인됩니다 — ${scaleAds.slice(0, 3).join(", ")} 예산 확대를 검토하세요.`);
  }

  const arrivalRates = judgable
    .map((r) => r.metrics.landingArrivalRate)
    .filter((v): v is number => v !== null);
  const avgArrival = average(arrivalRates);
  if (avgArrival !== null) {
    sentences.push(
      avgArrival >= 75
        ? "클릭→랜딩 도달률은 정상 범위이므로 랜딩 전면 수정은 보류하고 GA4 CTA 및 폼 전환율을 기준으로 추가 판단하세요."
        : "클릭→랜딩 도달률이 낮게 나타나 랜딩 페이지 로딩 속도/연결 상태 점검이 필요합니다."
    );
  }

  return {
    campaignName,
    adCount: results.length,
    statusCounts,
    actionCounts,
    summaryText: sentences.join(" "),
  };
}
