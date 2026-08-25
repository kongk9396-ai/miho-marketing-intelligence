import { CalendarCheck, DollarSign, Percent, PhoneCall, Target, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { getAllLeadsForAnalysis } from "@/lib/leads-analysis/repository";
import { computeLeadsCpaSummary, computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import { getCampaignBreakdown, type CampaignBreakdownRow } from "@/lib/leads-analysis/campaign-breakdown";
import { getMetaTotals } from "@/lib/dashboard/repository";
import { toKstDateOnly } from "@/lib/date/kst";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

function formatWon(value: number | null): string {
  return value === null ? "-" : `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

function formatPercent(value: number | null, digits = 1): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

function formatCount(value: number): string {
  return value.toLocaleString("ko-KR");
}

export default async function LeadsFunnelPage() {
  const header = <PageHeader title="DB 분석" description="리드(DB) 유입량, 유입 경로, DB 품질을 확인합니다." />;

  let leadsRows;
  let metaTotals;
  try {
    [leadsRows, metaTotals] = await Promise.all([getAllLeadsForAnalysis(), getMetaTotals()]);
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

  if (leadsRows.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={Users}
          title="아직 데이터가 없습니다."
          description="/data/leads-sync에서 Google Sheet 동기화를 먼저 실행해주세요."
        />
      </>
    );
  }

  const kpi = computeLeadsKpiSummary(leadsRows);
  const hasMetaData = metaTotals.rowCount > 0;
  // With no Meta data synced at all, spend is unknown (not zero) — showing
  // "₩0" would read as "free acquisition" rather than "no ad spend data yet".
  const cpa = hasMetaData
    ? computeLeadsCpaSummary(metaTotals.spend, kpi)
    : { dbCpa: null, validDbCpa: null, connectedCpa: null, bookingCpa: null, visitedCpa: null };

  const today = toKstDateOnly(new Date().toISOString());
  const breakdown = await getCampaignBreakdown(leadsRows, "2000-01-01", today);

  const columns: DataTableColumn<CampaignBreakdownRow>[] = [
    {
      key: "campaign",
      header: "캠페인/소재",
      render: (row) => (
        <span className={row.isUnmapped ? "text-amber-600" : "text-gray-900"}>
          {row.campaignLabel}
          {row.contentLabel ? ` / ${row.contentLabel}` : ""}
        </span>
      ),
    },
    { key: "spend", header: "광고비", align: "right", render: (row) => (row.isUnmapped ? "-" : formatWon(row.spend)) },
    { key: "db", header: "DB", align: "right", render: (row) => formatCount(row.kpi.totalDb) },
    { key: "dbCpa", header: "DB CPA", align: "right", render: (row) => formatWon(row.cpa.dbCpa) },
    { key: "validDb", header: "유효 DB", align: "right", render: (row) => formatCount(row.kpi.validDb) },
    { key: "validDbRate", header: "유효 DB율", align: "right", render: (row) => formatPercent(row.kpi.validDbRate) },
    { key: "validCpa", header: "유효 CPA", align: "right", render: (row) => formatWon(row.cpa.validDbCpa) },
    { key: "connected", header: "상담 연결", align: "right", render: (row) => formatCount(row.kpi.connected) },
    { key: "booked", header: "예약 확정", align: "right", render: (row) => formatCount(row.kpi.confirmedBookings) },
    { key: "bookingRate", header: "예약률", align: "right", render: (row) => formatPercent(row.kpi.bookingRate) },
    { key: "bookingCpa", header: "예약 CPA", align: "right", render: (row) => formatWon(row.cpa.bookingCpa) },
  ];

  return (
    <>
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="전체 DB" value={formatCount(kpi.totalDb)} icon={Users} />
        <KpiCard label="유효 DB" value={formatCount(kpi.validDb)} icon={UserCheck} />
        <KpiCard label="유효 DB율" value={formatPercent(kpi.validDbRate)} icon={Percent} />
        <KpiCard
          label="DB CPA"
          value={formatWon(cpa.dbCpa)}
          icon={DollarSign}
          emptyHint={!hasMetaData ? "아직 광고비 데이터가 없습니다." : undefined}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="상담 연결" value={formatCount(kpi.connected)} icon={PhoneCall} />
        <KpiCard label="상담 연결률" value={formatPercent(kpi.connectedRate)} icon={Percent} />
        <KpiCard label="예약 확정" value={formatCount(kpi.confirmedBookings)} icon={CalendarCheck} />
        <KpiCard label="예약 확정률" value={formatPercent(kpi.bookingRate)} icon={Percent} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="내원 완료" value={formatCount(kpi.visited)} icon={Target} />
        <KpiCard label="내원율" value={formatPercent(kpi.visitRate)} icon={Percent} />
        <KpiCard
          label="유효 DB CPA"
          value={formatWon(cpa.validDbCpa)}
          icon={DollarSign}
          emptyHint={!hasMetaData ? "아직 광고비 데이터가 없습니다." : undefined}
        />
        <KpiCard
          label="예약 CPA"
          value={formatWon(cpa.bookingCpa)}
          icon={DollarSign}
          emptyHint={!hasMetaData ? "아직 광고비 데이터가 없습니다." : undefined}
        />
      </div>

      <div className="mt-6">
        <DataTable
          title="캠페인/소재별 DB 성과"
          columns={columns}
          data={breakdown}
          getRowKey={(row) => row.key}
          emptyMessage="아직 데이터가 없습니다."
        />
        {breakdown.some((row) => row.key === "__no_utm__") ? (
          <p className="mt-2 text-xs text-gray-500">
            과거 DB 중 광고 귀속 보류: DBcart 원본 대조로 일부는 복구했지만, 같은 날짜에 리드가 여럿이고
            원본 시각 정보가 부족해 1:1로 정확히 매칭할 근거가 없는 건은 추측하지 않고 귀속을 보류했습니다.
          </p>
        ) : null}
      </div>
    </>
  );
}
