import { formatCount, formatPercent, formatWon } from "@/lib/dashboard/format";
import { formatKoreanMonthDay } from "@/lib/date/kst";
import type { AdPerformanceSummary } from "@/lib/ad-performance-summary/types";
import type { WeeklyReportPayload } from "@/lib/reports/weekly";

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

export function TomorrowSummaryCard({
  summary,
  periodReport,
}: {
  summary: AdPerformanceSummary;
  periodReport: WeeklyReportPayload;
}) {
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
    <>
    <section className="mb-5 grid gap-4 lg:grid-cols-3">

  <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
    <p className="mb-2 text-xs font-semibold text-blue-600">
      운영 현황
    </p>

    <h3 className="text-lg font-bold text-gray-900">
      8/17 ~ 8/21
    </h3>

    <div className="mt-4 space-y-2 text-sm text-gray-700">
      <p>
        DB <strong>{formatCount(periodReport.leadsKpi.totalDb)}건</strong>
        · 유효 DB <strong>{formatCount(periodReport.leadsKpi.validDb)}건</strong>
      </p>

      <p>
        예약 확정 <strong>{formatCount(periodReport.leadsKpi.confirmedBookings)}건</strong>
      </p>

      <p>
        기간 광고비 <strong>{formatWon(periodReport.meta.spend)}</strong>
      </p>

      <p>
        기간 일평균 <strong>{formatWon(periodReport.meta.dailyAvgSpend)}</strong>
      </p>

      <p className="pt-2 text-xs text-gray-500">
        현재 계획 일예산 ₩90,000 · 30일 계획 ₩2,700,000
      </p>
    </div>
  </div>

  <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
    <p className="mb-2 text-xs font-semibold text-violet-600">
      영상 · 랜딩 핵심 진단
    </p>

    <h3 className="text-lg font-bold text-gray-900">
      초중반 이탈 개선 필요
    </h3>

    <div className="mt-4 space-y-2 text-sm text-gray-700">
      <p>
        전체 영상 50% 유지율 <strong>73.2%</strong>
      </p>

      <p>
        전체 완주 유지율 <strong>41.0%</strong>
      </p>

      <p>
        최대 이탈 <strong>25% → 50% · 26.8%</strong>
      </p>

      <p>
        B 버전2 50% 유지율 <strong>45.1%</strong>
        · 완주 <strong>23.9%</strong>
      </p>

      <p className="pt-2 text-xs leading-5 text-gray-500">
        GA4 기준 랜딩 초반과 CTA → 폼 시작 구간의 이탈이 커
        랜딩 상단 및 신청 전환 구간 개선 우선순위가 높습니다.
      </p>
    </div>
  </div>

  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
    <p className="mb-2 text-xs font-semibold text-amber-700">
      오늘의 결론
    </p>

    <h3 className="text-lg font-bold text-gray-900">
      랜딩 개선 + B 버전2 검토
    </h3>

    <div className="mt-4 space-y-2 text-sm text-gray-700">
      <p>
        <strong>유지:</strong> 비포애프터
      </p>

      <p>
        <strong>OFF 검토:</strong> B 첫코 케이트 릴스 버전2
      </p>

      <p>
        CTR <strong>0.64%</strong> · CPC <strong>₩3,549</strong>
      </p>

      <p>
        DB 21건 중 <strong>9건 광고 귀속 복구</strong>
      </p>

      <p className="pt-2 text-xs leading-5 text-gray-500">
        현재는 광고 송출보다 랜딩 상단과 신청 전환 구간 개선이 우선이며,
        추후 매출 데이터 연결 후 ROAS까지 확인할 예정입니다.
      </p>
    </div>
  </div>

</section>
<section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">8/17 ~ 8/21 광고 운영 보고</h2>
      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          회의용 전체 보고 · 누적 현황
        </h3>

        <div className="space-y-3 text-sm leading-7 text-gray-700">
          <p>
            보고 대상 기간은 8월 17일 ~ 8월 21일입니다.
            해당 기간 총 DB는 {formatCount(periodReport.leadsKpi.totalDb)}건,
            유효 DB는 {formatCount(periodReport.leadsKpi.validDb)}건,
            예약 확정은 {formatCount(periodReport.leadsKpi.confirmedBookings)}건입니다.
          </p>

          <p>
            영상 시청 데이터는 전체 기준 25% 도달자를 100%로 봤을 때
            50%까지 73.2%, 75%까지 55.2%, 95%까지 43.6%,
            완주까지 41.0%가 유지됐습니다.
            가장 큰 이탈은 25% → 50% 구간에서 26.8% 발생했습니다.
          </p>

          <p>
            소재별로는 A 소재가 50%까지 64.9%, 완주 37.5%,
            B 소재가 50%까지 71.8%, 완주 35.1%,
            B 버전2가 50%까지 45.1%, 완주 23.9%로
            B 버전2의 초반 시청 유지력이 가장 낮았습니다.
            B 버전2는 CTR 0.64%, CPC 3,549원으로 OFF 또는 소재 수정 검토가 필요합니다.
          </p>

          <p>
            GA4에서는 랜딩 진입 후 초반 구간 이탈과 CTA 클릭 이후 실제 폼 시작까지의 이탈이 확인되어,
            현재는 광고 송출보다 랜딩 상단과 신청 전환 구간 개선 우선순위가 높습니다.
          </p>

          <p>
            8월 17일 ~ 8월 21일 기간 Meta 광고 집행비는 {formatWon(periodReport.meta.spend)},
            기간 일평균 집행비는 {formatWon(periodReport.meta.dailyAvgSpend)}입니다.
            현재 계획 일예산은 ₩90,000이며,
            현재 계획 유지 시 30일 계획 광고비는 약 ₩2,700,000입니다.
          </p>

          <p>
            과거 DB 21건 중 9건은 DBcart UTM을 통해 광고 귀속을 복구했고,
            나머지 12건은 1:1 매칭 근거 부족으로 귀속을 보류했습니다.
            추후 매출 데이터가 연결되면 ROAS까지 확장 분석할 예정입니다.
          </p>
        </div>
      </div>
      <div className="mt-2">
        {items.map((item, i) => (
          <Row key={item.label} n={i + 1} item={item} />
        ))}
      </div>
    </section>
    </>
  );
}









