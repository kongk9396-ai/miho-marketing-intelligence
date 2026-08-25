import {
  BadgeCheck,
  CalendarCheck,
  DollarSign,
  MousePointerClick,
  Percent,
  Target,
  UserCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { MetricComparisonCard } from "@/components/ui/metric-comparison-card";
import { SpendTrendChart } from "@/components/charts/spend-trend-chart";
import { ObservingChangesCard } from "@/components/creative-changes/observing-changes-card";
import { RecentImpactCard } from "@/components/creative-changes/recent-impact-card";
import { ProblemAreaCard } from "@/components/combined-analysis/problem-area-card";
import { DataFreshnessCard } from "@/components/dashboard/data-freshness-card";
import {
  getLatestChangeCtrComparison,
  getObservingChanges,
  getRecentChangeImpacts,
} from "@/lib/creative-changes/dashboard-summary";
import { getProblemAreaEstimates } from "@/lib/combined-analysis/problem-summary";
import { getDashboardKpiSummary } from "@/lib/dashboard/kpi";
import { getRecentSpendAndLeadsTrend } from "@/lib/dashboard/trend";
import { getDashboardFreshness } from "@/lib/dashboard/freshness";
import { formatCount, formatPercent, formatWon } from "@/lib/dashboard/format";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";
import type {
  LatestChangeCtrComparison,
  ObservingChangeSummary,
  RecentChangeImpactSummary,
} from "@/lib/creative-changes/dashboard-summary";
import type { ProblemAreaEstimate } from "@/lib/combined-analysis/problem-summary";
import type { DashboardKpiSummary } from "@/lib/dashboard/kpi";
import type { DashboardTrendPoint } from "@/lib/dashboard/trend";
import type { DashboardFreshness } from "@/lib/dashboard/freshness";

export const dynamic = "force-dynamic";

const NO_META_DATA_HINT = "아직 데이터가 없습니다.";
const NO_LEADS_HINT = "아직 데이터가 없습니다.";

export default async function DashboardPage() {
  let observingChanges: ObservingChangeSummary[] = [];
  let recentImpacts: RecentChangeImpactSummary[] = [];
  let latestChangeCtr: LatestChangeCtrComparison | null = null;
  let problemAreas: ProblemAreaEstimate[] = [];
  let schemaNotReadyMessage: string | null = null;

  try {
    [observingChanges, recentImpacts, latestChangeCtr] = await Promise.all([
      getObservingChanges(3),
      getRecentChangeImpacts(3),
      getLatestChangeCtrComparison(),
    ]);
  } catch (err) {
    if (!(err instanceof SchemaNotReadyError)) throw err;
    schemaNotReadyMessage = err.message;
  }
  try {
    problemAreas = await getProblemAreaEstimates(3);
  } catch (err) {
    if (!(err instanceof SchemaNotReadyError)) throw err;
  }

  let kpi: DashboardKpiSummary | null = null;
  let trend: DashboardTrendPoint[] = [];
  let freshness: DashboardFreshness | null = null;
  try {
    [kpi, trend, freshness] = await Promise.all([
      getDashboardKpiSummary(),
      getRecentSpendAndLeadsTrend(7),
      getDashboardFreshness(),
    ]);
  } catch (err) {
    if (!(err instanceof SchemaNotReadyError)) throw err;
    schemaNotReadyMessage = err.message;
  }

  return (
    <>
      <PageHeader
        title="대시보드"
        description="연결된 모든 Meta 광고 계정의 스냅샷입니다."
      />

      {schemaNotReadyMessage ? (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {schemaNotReadyMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="총 광고비"
          value={formatWon(kpi?.totalSpend ?? 0)}
          icon={DollarSign}
          emptyHint={!kpi?.hasMetaData ? NO_META_DATA_HINT : undefined}
        />
        <KpiCard
          label="DB 수"
          value={formatCount(kpi?.totalLeads ?? 0)}
          icon={Users}
          emptyHint={!kpi || kpi.totalLeads === 0 ? NO_LEADS_HINT : undefined}
        />
        <KpiCard
          label="평균 CPA"
          value={kpi?.avgCpa != null ? formatWon(kpi.avgCpa) : "-"}
          icon={Target}
        />
        <KpiCard
          label="클릭률(CTR)"
          value={formatPercent(kpi?.ctr ?? null)}
          icon={MousePointerClick}
          emptyHint={!kpi?.hasMetaData ? NO_META_DATA_HINT : undefined}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="유효 DB"
          value={formatCount(kpi?.validLeads ?? 0)}
          icon={UserCheck}
          emptyHint={!kpi || kpi.totalLeads === 0 ? NO_LEADS_HINT : undefined}
        />
        <KpiCard label="유효 DB율" value={formatPercent(kpi?.validDbRate ?? null)} icon={Percent} />
        <KpiCard
          label="유효 CPA"
          value={kpi?.validCpa != null ? formatWon(kpi.validCpa) : "-"}
          icon={BadgeCheck}
        />
        <KpiCard
          label="예약 확정"
          value={formatCount(kpi?.confirmedBookings ?? 0)}
          icon={CalendarCheck}
          emptyHint={!kpi || kpi.totalLeads === 0 ? NO_LEADS_HINT : undefined}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="예약 CPA"
          value={kpi?.bookingCpa != null ? formatWon(kpi.bookingCpa) : "-"}
          icon={DollarSign}
        />
        <KpiCard
          label="랜딩 전환율"
          value={
            kpi?.hasGa4Data && !kpi.formCompleteTrackingConnected
              ? "폼 완료 추적 미연결"
              : formatPercent(kpi?.landingConversionRate ?? null)
          }
          icon={Percent}
          emptyHint={!kpi?.hasGa4Data ? "아직 데이터가 없습니다." : undefined}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendTrendChart data={trend} />
        </div>
        {latestChangeCtr ? (
          <MetricComparisonCard
            metricLabel="최근 소재 교체 후 CTR"
            before={formatPercent(latestChangeCtr.beforeCtr, 2)}
            after={formatPercent(latestChangeCtr.afterCtr, 2)}
            change={
              latestChangeCtr.changePercent === null
                ? undefined
                : {
                    value: `${latestChangeCtr.changePercent > 0 ? "+" : ""}${latestChangeCtr.changePercent.toFixed(1)}%`,
                    direction:
                      latestChangeCtr.changePercent > 0
                        ? "up"
                        : latestChangeCtr.changePercent < 0
                          ? "down"
                          : "flat",
                  }
            }
          />
        ) : (
          <MetricComparisonCard
            metricLabel="최근 소재 교체 후 CTR"
            before=""
            after=""
            emptyMessage="최근 소재 변경 이력이 없습니다."
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ObservingChangesCard items={observingChanges} />
        <RecentImpactCard items={recentImpacts} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProblemAreaCard items={problemAreas} />
        {freshness ? <DataFreshnessCard freshness={freshness} /> : null}
      </div>
    </>
  );
}
