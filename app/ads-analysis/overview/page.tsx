import { ChartLine } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { getDashboardKpiSummary } from "@/lib/dashboard/kpi";
import { formatCount, formatPercent, formatWon } from "@/lib/dashboard/format";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

export default async function AdsOverviewPage() {
  const header = (
    <PageHeader
      title="전체 성과"
      description="모든 Meta 광고 계정과 캠페인의 성과를 종합적으로 보여줍니다."
    />
  );

  let kpi;
  try {
    kpi = await getDashboardKpiSummary();
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          {header}
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }
    throw err;
  }

  if (!kpi.hasMetaData) {
    return (
      <>
        {header}
        <EmptyState
          icon={ChartLine}
          title="아직 데이터가 없습니다."
          description="데이터 → Meta CSV 업로드에서 광고 데이터를 업로드하면 여기에 표시됩니다."
        />
      </>
    );
  }

  return (
    <>
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="총 광고비" value={formatWon(kpi.totalSpend)} />
        <KpiCard label="노출" value={formatCount(kpi.impressions)} />
        <KpiCard label="링크 클릭" value={formatCount(kpi.linkClicks)} />
        <KpiCard label="CTR" value={formatPercent(kpi.ctr)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="CPC" value={kpi.cpc !== null ? formatWon(kpi.cpc) : "데이터 없음"} />
        <KpiCard label="CPM" value={kpi.cpm !== null ? formatWon(kpi.cpm) : "데이터 없음"} />
        <KpiCard label="DB" value={formatCount(kpi.totalLeads)} />
        <KpiCard label="유효 DB" value={formatCount(kpi.validLeads)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="예약 확정" value={formatCount(kpi.confirmedBookings)} />
        <KpiCard label="DB CPA" value={kpi.avgCpa !== null ? formatWon(kpi.avgCpa) : "데이터 없음"} />
        <KpiCard label="유효 DB CPA" value={kpi.validCpa !== null ? formatWon(kpi.validCpa) : "데이터 없음"} />
        <KpiCard label="예약 CPA" value={kpi.bookingCpa !== null ? formatWon(kpi.bookingCpa) : "데이터 없음"} />
      </div>

      <p className="mt-4 text-xs text-gray-400">
        CTR/CPC는 /report, 대시보드와 동일한 공통 집계 함수(computeMetaRateFallback)를 사용합니다.
        {kpi.ctrSource === "raw_metric" || kpi.cpcSource === "raw_metric" ? " (일부 값은 Meta 원본 비율값 기준)" : null}
      </p>
    </>
  );
}
