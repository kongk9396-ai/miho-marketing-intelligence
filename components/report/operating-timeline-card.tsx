import { formatWon } from "@/lib/dashboard/format";
import { formatKoreanMonthDay } from "@/lib/date/kst";
import type { AccountOperatingSummary } from "@/lib/ad-performance-summary/types";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-gray-900">{value}</dd>
      {hint ? <p className="mt-0.5 text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}

export function OperatingTimelineCard({ account }: { account: AccountOperatingSummary }) {
  const { budget, newCampaignBudget } = account;
  const hasExcluded = account.excludedCampaignNames.length > 0;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">광고 시작일 / 예산 소진</h3>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat
          label="Meta 공식 시작일"
          value={account.officialStartDate ? formatKoreanMonthDay(account.officialStartDate) : "미등록"}
        />
        <Stat
          label="운영 일수"
          value={account.operatingDayCount !== null ? `${account.operatingDayCount}일째` : "공식 시작일 미등록"}
        />
        <Stat
          label="데이터 기준 최초 집행일"
          value={account.dataFirstDate ? formatKoreanMonthDay(account.dataFirstDate) : "데이터 없음"}
        />
        <Stat
          label={hasExcluded ? "신규 캠페인 계획 일예산" : "계획 월 예산"}
          value={
            hasExcluded
              ? newCampaignBudget.plannedDailyBudget !== null
                ? formatWon(newCampaignBudget.plannedDailyBudget)
                : "미등록"
              : budget.plannedMonthlyBudget !== null
                ? formatWon(budget.plannedMonthlyBudget)
                : "미등록"
          }
          hint={
            hasExcluded && newCampaignBudget.plannedMonthlyBudget !== null
              ? `현재 상태 유지 시 30일 계획 광고비 ${formatWon(newCampaignBudget.plannedMonthlyBudget)}`
              : undefined
          }
        />
        <Stat
          label={hasExcluded ? "신규 캠페인 누적 집행비" : "누적 실제 집행비"}
          value={formatWon(hasExcluded ? newCampaignBudget.actualTotalSpend : budget.actualTotalSpend)}
          hint={hasExcluded ? `전체 Meta(참고): ${formatWon(budget.actualTotalSpend)}` : undefined}
        />
        <Stat
          label={hasExcluded ? "신규 캠페인 일평균 광고비" : "실제 일평균 광고비"}
          value={
            (hasExcluded ? newCampaignBudget.actualDailyAvgSpend : budget.actualDailyAvgSpend) !== null
              ? formatWon((hasExcluded ? newCampaignBudget : budget).actualDailyAvgSpend as number)
              : "데이터 없음"
          }
          hint={`현재 ${(hasExcluded ? newCampaignBudget : budget).actualDataDayCount}일 실데이터 기준`}
        />
        <Stat
          label={hasExcluded ? "신규 캠페인 30일 예상 광고비" : "30일 예상 광고비"}
          value={
            (hasExcluded ? newCampaignBudget.projected30DaySpend : budget.projected30DaySpend) !== null
              ? formatWon((hasExcluded ? newCampaignBudget : budget).projected30DaySpend as number)
              : "데이터 없음"
          }
          hint={`현재 ${(hasExcluded ? newCampaignBudget : budget).actualDataDayCount}일 실데이터 기준 예상`}
        />
        <Stat
          label="예산 대비 잔여/초과"
          value={
            budget.budgetRemainingOrOverage !== null
              ? `${budget.budgetRemainingOrOverage >= 0 ? "잔여" : "초과"} ${formatWon(Math.abs(budget.budgetRemainingOrOverage))}`
              : "계획 예산 미등록"
          }
        />
        <Stat
          label="예산 소진율"
          value={budget.budgetUsageRate !== null ? `${budget.budgetUsageRate.toFixed(1)}%` : "계획 예산 미등록"}
        />
      </dl>
      {hasExcluded ? (
        <p className="mt-3 text-xs text-gray-400">
          {account.excludedCampaignNames.join(", ")}은 기존 장기 운영 광고로, 신규 캠페인 집행비/일평균/30일
          예상에서는 제외했습니다. 전체 Meta 집행비는 참고용으로 별도 표시됩니다.
        </p>
      ) : null}
    </section>
  );
}
