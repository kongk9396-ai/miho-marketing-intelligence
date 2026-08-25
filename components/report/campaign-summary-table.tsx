import { formatCount, formatWon } from "@/lib/dashboard/format";
import type { CampaignReportSummary } from "@/lib/ad-performance-summary/types";

export function CampaignSummaryTable({ campaigns }: { campaigns: CampaignReportSummary[] }) {
  if (campaigns.length === 0) {
    return <p className="text-sm text-gray-500">캠페인 데이터가 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {campaigns.map((c) => (
        <div key={c.campaignName} className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">{c.campaignName}</p>
            <p className="text-xs text-gray-400">
              {c.operatingDayCount !== null ? `운영 ${c.operatingDayCount}일째` : "공식 시작일 미등록"} · 광고 {c.adCount}개
            </p>
          </div>
          <p className="mt-2 text-sm text-gray-600">{c.diagnosisSummaryText}</p>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-gray-500">최근 30일 지출</dt>
              <dd className="font-medium text-gray-900">{formatWon(c.spend)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">CTR / CPC / CPM</dt>
              <dd className="font-medium text-gray-900">
                {c.ctr !== null ? `${c.ctr.toFixed(2)}%` : "—"} / {c.cpc !== null ? formatWon(c.cpc) : "—"} /{" "}
                {c.cpm !== null ? formatWon(c.cpm) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">영상 최대 이탈 구간</dt>
              <dd className="font-medium text-gray-900">{c.videoMaxDropoffLabel ?? "표본 부족"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">DB / 예약</dt>
              <dd className="font-medium text-gray-900">
                {c.db.available
                  ? `${formatCount(c.db.totalDb ?? 0)}건 / ${formatCount(c.db.confirmedBookings ?? 0)}건`
                  : "UTM 매핑 미등록"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">계획 월 예산</dt>
              <dd className="font-medium text-gray-900">
                {c.budget.plannedMonthlyBudget !== null ? formatWon(c.budget.plannedMonthlyBudget) : "미등록"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">예산 소진율</dt>
              <dd className="font-medium text-gray-900">
                {c.budget.budgetUsageRate !== null ? `${c.budget.budgetUsageRate.toFixed(1)}%` : "계획 예산 미등록"}
              </dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

