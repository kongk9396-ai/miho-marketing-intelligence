import type { AdDiagnosisResult } from "@/lib/ad-diagnosis/types";
import type { AdOffSnapshotRecord, AdOperationalStatusRecord } from "@/lib/ad-operations/types";

/**
 * The 6-state recommendation from spec section 14. A pure relabeling of the
 * existing ad-diagnosis engine's (status, action) output — the engine itself
 * (lib/ad-diagnosis/engine.ts) is not modified. "_REVIEW" suffixes make
 * explicit that these are recommendations, never auto-executed.
 */
export type OperationalRecommendation =
  | "SCALE_REVIEW"
  | "KEEP"
  | "WATCH"
  | "CREATIVE_FIX"
  | "LANDING_FIX"
  | "OFF_REVIEW";

export function mapToOperationalRecommendation(result: AdDiagnosisResult): OperationalRecommendation {
  if (result.action === "OFF") return "OFF_REVIEW";
  if (result.action === "SCALE") return "SCALE_REVIEW";
  if (result.action === "KEEP") return "KEEP";
  // action is WATCH here — narrow further by status where the spec's split (소재 수정 vs 랜딩 수정) applies.
  if (result.status === "CREATIVE_PROBLEM") return "CREATIVE_FIX";
  if (result.status === "LANDING_PROBLEM") return "LANDING_FIX";
  return "WATCH";
}

export const OPERATIONAL_RECOMMENDATION_LABELS: Record<OperationalRecommendation, string> = {
  SCALE_REVIEW: "예산 확대 검토",
  KEEP: "유지",
  WATCH: "관찰",
  CREATIVE_FIX: "소재 수정",
  LANDING_FIX: "랜딩 수정",
  OFF_REVIEW: "OFF 검토",
};

export interface AdOperationalDecision {
  adId: string;
  adName: string | null;
  campaignName: string | null;
  recommendation: OperationalRecommendation;
  /** Real evidence for the recommendation, always >=2 when the engine had enough data to judge at all. */
  reasons: string[];
  /** The human-recorded real status (ACTIVE/PAUSED/OFF/TESTING) — distinct from `recommendation`, which is only ever a system suggestion. Null when never recorded. */
  actualStatus: AdOperationalStatusRecord | null;
  offSnapshot: AdOffSnapshotRecord | null;
}

/**
 * Pairs each ad-diagnosis result with its recommendation and the real
 * recorded operational status, so "system says OFF_REVIEW" and "user already
 * turned it OFF" are never conflated (spec addendum: OFF_REVIEW != OFF).
 */
export function buildAdOperationalDecisions(
  results: AdDiagnosisResult[],
  statusesByKey: Map<string, AdOperationalStatusRecord>,
  snapshotsByStatusId: Map<string, AdOffSnapshotRecord>
): AdOperationalDecision[] {
  return results.map((result) => {
    const key = `${result.campaignName ?? ""}|||${result.adName ?? ""}`;
    const actualStatus = statusesByKey.get(key) ?? null;
    const offSnapshot = actualStatus ? (snapshotsByStatusId.get(actualStatus.id) ?? null) : null;

    return {
      adId: result.adId,
      adName: result.adName,
      campaignName: result.campaignName,
      recommendation: mapToOperationalRecommendation(result),
      reasons: result.reasons,
      actualStatus,
      offSnapshot,
    };
  });
}
