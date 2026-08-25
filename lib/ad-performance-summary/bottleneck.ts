import type { AdDiagnosisStatus } from "@/lib/ad-diagnosis/types";
import type { DbProblemResult } from "@/lib/leads-analysis/problem-classification";
import type { BottleneckCategory, BottleneckDiagnosis } from "@/lib/ad-performance-summary/types";

const CATEGORY_LABELS: Record<BottleneckCategory, string> = {
  CREATIVE: "소재 문제",
  LANDING: "랜딩 문제",
  FORM: "폼 문제",
  DB_QUALITY: "DB 품질 문제",
  CONSULTATION_BOOKING: "예약/상담 문제",
  INSUFFICIENT_DATA: "데이터 부족",
  HEALTHY: "특이 병목 없음",
};

export { CATEGORY_LABELS as BOTTLENECK_CATEGORY_LABELS };

/**
 * Combines the existing per-ad auto-diagnosis engine (lib/ad-diagnosis) with
 * the existing funnel-level DB problem classifier (lib/leads-analysis/problem-classification)
 * into one "current bottleneck" verdict. No new judgment rules are invented
 * here — this only picks among outcomes those two engines already produce.
 *
 * Priority: majority INSUFFICIENT_DATA first (nothing else is trustworthy
 * yet) -> the largest per-ad problem count (creative/landing/form/DB
 * quality — funnel order, upstream problems surface first) -> the
 * funnel-level consultation/booking signal only when ad-level diagnosis
 * shows no clear per-ad problem -> healthy.
 */
export function determineBottleneck(
  adDiagnosisCounts: Record<AdDiagnosisStatus, number>,
  dbProblem: DbProblemResult | null
): BottleneckDiagnosis {
  const totalAds =
    adDiagnosisCounts.HEALTHY +
    adDiagnosisCounts.CREATIVE_PROBLEM +
    adDiagnosisCounts.LANDING_PROBLEM +
    adDiagnosisCounts.FORM_PROBLEM +
    adDiagnosisCounts.TARGETING_PROBLEM +
    adDiagnosisCounts.INSUFFICIENT_DATA;

  if (totalAds === 0) {
    return {
      category: "INSUFFICIENT_DATA",
      headline: "진단할 광고 데이터가 없습니다.",
      reasons: [],
      adDiagnosisCounts,
    };
  }

  if (adDiagnosisCounts.INSUFFICIENT_DATA >= totalAds / 2) {
    return {
      category: "INSUFFICIENT_DATA",
      headline: `광고 ${totalAds}개 중 ${adDiagnosisCounts.INSUFFICIENT_DATA}개가 데이터 부족 상태라 병목을 판정하기 이릅니다.`,
      reasons: [`데이터 부족 ${adDiagnosisCounts.INSUFFICIENT_DATA}개 / 전체 ${totalAds}개`],
      adDiagnosisCounts,
    };
  }

  const perAdProblems: [BottleneckCategory, number][] = [
    ["CREATIVE", adDiagnosisCounts.CREATIVE_PROBLEM],
    ["LANDING", adDiagnosisCounts.LANDING_PROBLEM],
    ["FORM", adDiagnosisCounts.FORM_PROBLEM],
    ["DB_QUALITY", adDiagnosisCounts.TARGETING_PROBLEM],
  ];
  const [topCategory, topCount] = perAdProblems.reduce((max, cur) => (cur[1] > max[1] ? cur : max));

  if (topCount > 0) {
    return {
      category: topCategory,
      headline: `현재 병목은 ${CATEGORY_LABELS[topCategory]}입니다 (광고 ${totalAds}개 중 ${topCount}개 해당).`,
      reasons: [`${CATEGORY_LABELS[topCategory]} ${topCount}개 / 전체 ${totalAds}개`],
      adDiagnosisCounts,
    };
  }

  if (dbProblem && (dbProblem.classification === "consultation_connection_problem" || dbProblem.classification === "booking_conversion_problem")) {
    return {
      category: "CONSULTATION_BOOKING",
      headline: dbProblem.headline,
      reasons: dbProblem.reasons,
      adDiagnosisCounts,
    };
  }

  if (dbProblem && dbProblem.classification === "lead_quality_problem") {
    return {
      category: "DB_QUALITY",
      headline: dbProblem.headline,
      reasons: dbProblem.reasons,
      adDiagnosisCounts,
    };
  }

  return {
    category: "HEALTHY",
    headline: "광고 소재·랜딩·폼·DB 품질 모두 뚜렷한 병목 신호가 없습니다.",
    reasons: [],
    adDiagnosisCounts,
  };
}
