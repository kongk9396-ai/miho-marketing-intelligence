import { formatCount, formatPercent, formatWon } from "@/lib/dashboard/format";
import { formatKoreanMonthDay } from "@/lib/date/kst";
import type { AdPerformanceSummary } from "@/lib/ad-performance-summary/types";

/**
 * "한눈에 보는 결론" — 3-5 sentence rule-based meeting summary, assembled
 * entirely from fields the rest of build.ts already computed (todayConclusion,
 * account, db, bookingRates, videoMaxDropoffLabel, landingChange, account.budget).
 * No new data fetching or business rules — pure text composition, reusing the
 * same numbers shown elsewhere on the page so nothing here can contradict them.
 */
export function buildMeetingConclusion(summary: AdPerformanceSummary): string {
  const sentences: string[] = [];

  if (summary.account.officialStartDate && summary.account.operatingDayCount !== null) {
    sentences.push(
      `Meta 광고는 ${formatKoreanMonthDay(summary.account.officialStartDate)}부터 현재 ${summary.account.operatingDayCount}일째 운영 중입니다.`
    );
  } else if (summary.account.dataFirstDate) {
    sentences.push(`Meta 광고 데이터 기준 최초 집행일은 ${formatKoreanMonthDay(summary.account.dataFirstDate)}입니다 (공식 시작일 미등록).`);
  }

  if (summary.db.totalDb > 0) {
    const bookingPart =
      summary.bookingRates.validToBookingRate !== null
        ? `유효 DB 대비 예약 성공률은 ${formatPercent(summary.bookingRates.validToBookingRate, 1)}입니다.`
        : "유효 DB가 없어 예약 성공률은 계산하지 않았습니다.";
    sentences.push(
      `현재 총 DB ${formatCount(summary.db.totalDb)}건, 유효 DB ${formatCount(summary.db.validDb)}건, 예약 확정 ${formatCount(summary.db.confirmedBookings)}건으로 ${bookingPart}`
    );
  }

  if (summary.videoMaxDropoffLabel) {
    sentences.push(`영상에서는 ${summary.videoMaxDropoffLabel}이 나타났습니다.`);
  }
  const offReviewAd = summary.todayConclusion.groups.offReview[0];
  if (offReviewAd) {
    sentences.push(
      `${offReviewAd.adName ?? offReviewAd.adId} 소재는 ${offReviewAd.reasons.slice(0, 2).join(", ")}로 OFF 검토가 필요합니다.`
    );
  }

  if (summary.landingChange.available && summary.landingChange.reportLine) {
    sentences.push(summary.landingChange.reportLine);
  }

  if (summary.account.newCampaignBudget.actualTotalSpend > 0) {
    const planPart =
      summary.account.newCampaignBudget.plannedDailyBudget !== null &&
      summary.account.newCampaignBudget.plannedMonthlyBudget !== null
        ? `현재 계획 일예산은 ${formatWon(summary.account.newCampaignBudget.plannedDailyBudget)}이며, 현재 상태 유지 시 30일 계획 광고비는 약 ${formatWon(summary.account.newCampaignBudget.plannedMonthlyBudget)}입니다.`
        : "계획 예산이 등록되지 않아 계획 기준 30일 예상은 표시하지 않습니다.";
    sentences.push(`신규 광고 실제 집행비는 ${formatWon(summary.account.newCampaignBudget.actualTotalSpend)}이며, ${planPart}`);
  }

  return sentences.slice(0, 6).join(" ");
}
