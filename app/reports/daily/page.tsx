import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GenerateReportButton } from "@/components/reports/generate-report-button";
import { generateDailyReportAction } from "@/app/reports/daily/actions";
import { initialGenerateReportState } from "@/app/reports/daily/action-state";
import { listAnalysisReports } from "@/lib/reports/repository";
import { formatCount, formatWon } from "@/lib/dashboard/format";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";
import type { DailyReportPayload } from "@/lib/reports/daily";

export const dynamic = "force-dynamic";

interface DailyReportsPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DailyReportsPage({ searchParams }: DailyReportsPageProps) {
  const params = await searchParams;
  const header = (
    <PageHeader
      title="일일 리포트"
      description="전일 00:00~23:59(KST) 기준 성과를 자동 생성합니다. 버튼을 눌러 즉시 생성하거나, Render Cron으로 자동화할 수 있습니다."
      actions={
        <GenerateReportButton
          action={generateDailyReportAction}
          initialState={initialGenerateReportState}
          label="일일 보고 생성"
        />
      }
    />
  );

  let reports;
  try {
    reports = await listAnalysisReports("daily", 30);
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

  if (reports.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={FileText}
          title="아직 생성된 일일 보고가 없습니다."
          description="'일일 보고 생성' 버튼을 눌러 즉시 생성해보세요."
        />
      </>
    );
  }

  const selected = reports.find((r) => r.start_date === params.date) ?? reports[0];
  const payload = selected.metrics_json as DailyReportPayload;

  return (
    <>
      {header}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white lg:col-span-1">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">최근 일일 보고</h3>
          </div>
          <ul className="max-h-[32rem] divide-y divide-gray-100 overflow-y-auto">
            {reports.map((r) => (
              <li key={r.id}>
                <a
                  href={`/reports/daily?date=${r.start_date}`}
                  className={`block px-4 py-2.5 text-sm ${r.id === selected.id ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {r.start_date}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            {payload.summaryText}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="광고비" value={formatWon(payload.meta.spend)} />
            <StatCard label="노출" value={formatCount(payload.meta.impressions)} />
            <StatCard label="CTR" value={payload.meta.ctr !== null ? `${payload.meta.ctr.toFixed(2)}%` : "데이터 없음"} />
            <StatCard label="CPC" value={payload.meta.cpc !== null ? formatWon(payload.meta.cpc) : "데이터 없음"} />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">DB / 예약</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              <Stat label="총 DB" value={formatCount(payload.leadsKpi.totalDb)} />
              <Stat label="유효 DB" value={formatCount(payload.leadsKpi.validDb)} />
              <Stat label="예약 확정" value={formatCount(payload.leadsKpi.confirmedBookings)} />
              <Stat label="예약 CPA" value={payload.leadsCpa.bookingCpa !== null ? formatWon(payload.leadsCpa.bookingCpa) : "데이터 없음"} />
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">영상 시청 구간</h3>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-sm sm:grid-cols-7">
              {payload.videoFunnel.map((stage) => (
                <div key={stage.key}>
                  <dt className="text-gray-500">{stage.label}</dt>
                  <dd className="font-medium text-gray-900">
                    {typeof stage.cumulativeRetentionRate === "number" ? `${stage.cumulativeRetentionRate.toFixed(1)}%` : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">주요 변화</h3>
            {payload.keyChanges.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">전일 대비 비교할 데이터가 부족합니다.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {payload.keyChanges.map((c) => (
                  <li key={c.label}>
                    <span className="font-medium text-gray-900">{c.label}:</span> {c.detail}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">가장 큰 병목</h3>
            <p className="mt-2 text-sm text-gray-700">{payload.bottleneckHeadline}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">광고별 운영 판정</h3>
            {payload.adDecisions.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">진단 가능한 광고가 없습니다.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {payload.adDecisions.map((d, i) => (
                  <li key={i}>
                    <span className="font-medium text-gray-900">{d.adName ?? "—"}</span>
                    {d.campaignName ? ` (${d.campaignName})` : ""} — {d.recommendationLabel}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
