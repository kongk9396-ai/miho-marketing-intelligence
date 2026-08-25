import type { AdOperationalDecision } from "@/lib/ad-performance-summary/operational-decision";

export interface TodayConclusionGroups {
  scaleReview: AdOperationalDecision[];
  keep: AdOperationalDecision[];
  /** System recommends OFF, but the ad is not actually off yet. */
  offReview: AdOperationalDecision[];
  /** Actually turned OFF by a human (lib/ad-operations), regardless of what the system currently recommends. */
  offCompleted: AdOperationalDecision[];
  watch: AdOperationalDecision[];
  creativeFix: AdOperationalDecision[];
  landingFix: AdOperationalDecision[];
}

export interface TodayConclusion {
  groups: TodayConclusionGroups;
  /** 2-4 rule-based sentences — no AI/LLM. Always real per-ad reasons from lib/ad-diagnosis, never invented. */
  summaryText: string;
}

const UTM_CAVEAT =
  "다만 과거 광고별 DB 귀속 데이터는 UTM 미수집으로 제한되어 있어, 최종 예약 효율 비교는 신규 UTM 데이터 축적 후 확인해야 합니다.";

/**
 * Groups every ad's recommendation + real recorded status into the
 * addendum's six buckets (유지 / OFF 검토 / OFF 완료 / 관찰 / 소재 수정 /
 * 랜딩 수정), then writes the "오늘의 운영 결론" summary from real reasons
 * only — an ad already turned OFF by a human always lands in offCompleted,
 * even if the engine's current recommendation differs, so "system suggests"
 * and "actually executed" are never conflated (spec addendum).
 */
export function buildTodayConclusion(decisions: AdOperationalDecision[]): TodayConclusion {
  const groups: TodayConclusionGroups = {
    scaleReview: [],
    keep: [],
    offReview: [],
    offCompleted: [],
    watch: [],
    creativeFix: [],
    landingFix: [],
  };

  for (const d of decisions) {
    if (d.actualStatus?.status === "OFF") {
      groups.offCompleted.push(d);
      continue;
    }
    switch (d.recommendation) {
      case "SCALE_REVIEW":
        groups.scaleReview.push(d);
        break;
      case "KEEP":
        groups.keep.push(d);
        break;
      case "OFF_REVIEW":
        groups.offReview.push(d);
        break;
      case "WATCH":
        groups.watch.push(d);
        break;
      case "CREATIVE_FIX":
        groups.creativeFix.push(d);
        break;
      case "LANDING_FIX":
        groups.landingFix.push(d);
        break;
    }
  }

  const core: string[] = [];

  if (groups.keep.length > 0 || groups.scaleReview.length > 0) {
    const names = [...groups.scaleReview, ...groups.keep].slice(0, 2).map((d) => d.adName ?? d.adId);
    core.push(`현재 ${names.join(", ")} 등은 뚜렷한 문제 신호 없이 유지 상태입니다.`);
  }

  if (groups.offReview.length > 0) {
    const top = groups.offReview[0];
    core.push(`${top.adName ?? top.adId}는 ${top.reasons.slice(0, 2).join(", ")}로 OFF 검토가 필요합니다.`);
  }

  if (groups.creativeFix.length > 0) {
    const top = groups.creativeFix[0];
    core.push(`${top.adName ?? top.adId}는 ${top.reasons.slice(0, 2).join(", ")}로 소재 수정이 필요합니다.`);
  }

  if (groups.landingFix.length > 0) {
    const top = groups.landingFix[0];
    core.push(`${top.adName ?? top.adId}는 ${top.reasons.slice(0, 2).join(", ")}로 랜딩 점검이 필요합니다.`);
  }

  if (groups.offCompleted.length > 0) {
    const names = groups.offCompleted.map((d) => d.adName ?? d.adId);
    core.push(`${names.join(", ")}는 이미 OFF 처리되었습니다.`);
  }

  if (core.length === 0) {
    core.push("현재 판정 가능한 데이터가 부족하거나 뚜렷한 조치가 필요한 광고가 없습니다.");
  }

  const sentences = [...core.slice(0, 3), UTM_CAVEAT];

  return { groups, summaryText: sentences.join(" ") };
}
