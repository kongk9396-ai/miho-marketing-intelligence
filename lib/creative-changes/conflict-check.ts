import { computeObservationProgress } from "@/lib/creative-changes/period";
import { CHANGE_TYPE_LABELS } from "@/lib/creative-changes/change-type-labels";
import { formatKoreanMonthDay } from "@/lib/date/kst";
import type { CreativeChangeRecord } from "@/lib/creative-changes/types";

export interface ConflictInfo {
  change: CreativeChangeRecord;
  warningMessage: string;
}

/**
 * The first still-observing change (by changed_at desc) among candidates
 * that share the same ad or campaign as the one being registered. Callers
 * fetch `recentChanges` scoped to the relevant ad_id/campaign_id — this
 * function is the pure "which of these are still active" decision so it's
 * directly testable without a database.
 */
export function findActiveObservationConflict(
  recentChanges: CreativeChangeRecord[],
  now: Date = new Date()
): ConflictInfo | null {
  for (const change of recentChanges) {
    const progress = computeObservationProgress(change.changed_at, change.comparison_period_days, now);
    if (!progress.isObservationWindowComplete) {
      return { change, warningMessage: buildConflictWarningMessage(change) };
    }
  }
  return null;
}

function buildConflictWarningMessage(change: CreativeChangeRecord): string {
  const dateLabel = formatKoreanMonthDay(change.changed_at);
  const typeLabel = CHANGE_TYPE_LABELS[change.change_type];
  return `현재 이 광고는 ${dateLabel} ${typeLabel} 변경 효과를 관찰 중입니다. 추가 변경 시 기존 변경 효과를 분리하여 분석하기 어려울 수 있습니다.`;
}
