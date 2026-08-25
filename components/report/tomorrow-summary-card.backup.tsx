import { formatCount, formatPercent, formatWon } from "@/lib/dashboard/format";
import { formatKoreanMonthDay } from "@/lib/date/kst";
import type { AdPerformanceSummary } from "@/lib/ad-performance-summary/types";

interface Item {
  label: string;
  value: string;
  note?: string;
}

function Row({ n, item }: { n: number; item: Item }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between">
      <p className="text-sm font-medium text-gray-500">
        {n}. {item.label}
      </p>
      <div className="text-right">
        <p className="text-base font-semibold text-gray-900">{item.value}</p>
        {item.note ? <p className="text-xs text-gray-400">{item.note}</p> : null}
      </div>
    </div>
  );
}

export function TomorrowSummaryCard({ summary }: { summary: AdPerformanceSummary }) {
  const items: Item[] = [
    {
      label: "Meta 광고 시작일",
      value:
        summary.account.officialStartDate && summary.account.operatingDayCount !== null
          ? `${formatKoreanMonthDay(summary.account.officialStartDate)} (운영 ${summary.account.operatingDayCount}일째)`
          : summary.account.dataFirstDate
            ? `공식 시작일 미등록 · 데이터 기준 최초 집행일 ${formatKoreanMonthDay(summary.account.dataFirstDate)}`
            : "데이터 없음",
    },
    {
      label: "들어온 DB",
      value: `총 ${formatCount(summary.db.totalDb)}건 · 유효 ${formatCount(summary.db.validDb)}건`,
      note:
        summary.db.validDbRate !== null
          ? `유효 DB율 ${formatPercent(summary.db.validDbRate, 1)}`
          : undefined,
    },
    {
      label: "상담 예약 성공률",
      value: `예약 확정 ${formatCount(summary.db.confirmedBookings)}건`,
      note: [
        summary.bookingRates.totalToBookingRate !== null
          ? `전체 DB 대비 ${formatPercent(summary.bookingRates.totalToBookingRate, 1)}`
          : null,
        summary.bookingRates.validToBookingRate !== null
          ? `유효 DB 대비 ${formatPercent(summary.bookingRates.validToBookingRate, 1)}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      label: "릴스 수정 전후",
      value: summary.creativeChange.available ? "아래 상세 참고" : "등록된 변경 이력 없음",
      note: summary.creativeChange.reportLine,
    },
    {
      label: "랜딩 수정 전후",
      value: summary.landingChange.available ? "아래 상세 참고" : "등록된 변경 이력 없음",
      note: summary.landingChange.reportLine,
    },
    {
      label: "한 달 예상 광고 집행비 (신규 캠페인, 계획 유지 시)",
      value:
        summary.account.newCampaignBudget.plannedMonthlyBudget !== null
          ? formatWon(summary.account.newCampaignBudget.plannedMonthlyBudget)
          : "계획 예산 미등록",
      note: [
        summary.account.newCampaignBudget.plannedDailyBudget !== null
          ? `계획 일예산 ${formatWon(summary.account.newCampaignBudget.plannedDailyBudget)}`
          : null,
        summary.account.newCampaignBudget.actualDailyAvgSpend !== null
          ? `실제 일평균 ${formatWon(summary.account.newCampaignBudget.actualDailyAvgSpend)} (${summary.account.newCampaignBudget.actualDataDayCount}일 실데이터, 계획 대비 실제 집행 속도)`
          : null,
        summary.account.excludedCampaignNames.length > 0
          ? `${summary.account.excludedCampaignNames.join(", ")}은 기존 장기 운영 광고로 제외 (전체 Meta 집행비 ${formatWon(summary.account.budget.actualTotalSpend)}는 참고용 별도 표시)`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    },
  ];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">내일 보고 요약</h2>
      <div className="mt-2">
        {items.map((item, i) => (
          <Row key={item.label} n={i + 1} item={item} />
        ))}
      </div>
    </section>
  );
}
