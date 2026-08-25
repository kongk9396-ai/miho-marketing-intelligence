import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GenerateReportButton } from "@/components/reports/generate-report-button";
import { generateWeeklyReportAction } from "@/app/reports/weekly/actions";
import { initialGenerateReportState } from "@/app/reports/weekly/action-state";
import { listAnalysisReports } from "@/lib/reports/repository";
import { formatCount, formatWon } from "@/lib/dashboard/format";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";
import type { WeeklyReportPayload } from "@/lib/reports/weekly";

export const dynamic = "force-dynamic";

interface WeeklyReportsPageProps {
  searchParams: Promise<{ start?: string }>;
}

export default async function WeeklyReportsPage({ searchParams }: WeeklyReportsPageProps) {
  const params = await searchParams;
  const header = (
    <PageHeader
      title="주간 리포트"
      description="가장 최근 완료된 월~일(KST) 기준으로 자동 생성합니다. 버튼을 눌러 즉시 생성하거나, Render Cron으로 자동화할 수 있습니다."
      actions={
        <GenerateReportButton
          action={generateWeeklyReportAction}
          initialState={initialGenerateReportState}
          label="주간 보고 생성"
        />
      }
    />
  );

  let reports;
  try {
    reports = await listAnalysisReports("weekly", 30);
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
          icon={CalendarDays}
          title="아직 생성된 주간 보고가 없습니다."
          description="'주간 보고 생성' 버튼을 눌러 즉시 생성해보세요."
        />
      </>
    );
  }

  const selected = reports.find((r) => r.start_date === params.start) ?? reports[0];
  const payload = selected.metrics_json as WeeklyReportPayload;

  return (
    <>
      {header}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white lg:col-span-1">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">최근 주간 보고</h3>
          </div>
          <ul className="max-h-[32rem] divide-y divide-gray-100 overflow-y-auto">
            {reports.map((r) => (
              <li key={r.id}>
                <a
                  href={`/reports/weekly?start=${r.start_date}`}
                  className={`block px-4 py-2.5 text-sm ${r.id === selected.id ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {r.start_date} ~ {r.end_date}
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
            <StatCard label="주간 광고비" value={formatWon(payload.meta.spend)} />
            <StatCard label="일평균 광고비" value={formatWon(payload.meta.dailyAvgSpend)} />
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
            <h3 className="text-sm font-semibold text-gray-900">캠페인별 성과</h3>
            {payload.campaigns.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">캠페인 데이터가 없습니다.</p>
            ) : (
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-1.5">캠페인</th>
                    <th className="py-1.5 text-right">지출</th>
                    <th className="py-1.5 text-right">CTR</th>
                    <th className="py-1.5 text-right">CPC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payload.campaigns.map((c) => (
                    <tr key={c.campaignName}>
                      <td className="py-1.5">{c.campaignName}</td>
                      <td className="py-1.5 text-right">{formatWon(c.spend)}</td>
                      <td className="py-1.5 text-right">{c.ctr !== null ? `${c.ctr.toFixed(2)}%` : "—"}</td>
                      <td className="py-1.5 text-right">{c.cpc !== null ? formatWon(c.cpc) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900">이번 주 가장 효율 좋은 광고</h3>
              {payload.topEfficientAd ? (
                <p className="mt-2 text-sm text-gray-700">
                  {payload.topEfficientAd.adName ?? "—"} ({payload.topEfficientAd.campaignName ?? "—"}) — CTR{" "}
                  {payload.topEfficientAd.ctr !== null ? `${payload.topEfficientAd.ctr.toFixed(2)}%` : "—"}, CPC{" "}
                  {payload.topEfficientAd.cpc !== null ? formatWon(payload.topEfficientAd.cpc) : "—"}
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">판정 가능한 광고가 없습니다.</p>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900">OFF 검토 광고</h3>
              {payload.offReviewAds.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">해당 없음</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {payload.offReviewAds.map((a, i) => (
                    <li key={i}>
                      {a.adName ?? "—"} ({a.campaignName ?? "—"})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">가장 큰 병목 / 다음 운영 액션</h3>
            <p className="mt-2 text-sm text-gray-700">{payload.bottleneckHeadline}</p>
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-gray-700">
              {payload.nextActions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-400">
            이번 주 소재 변경 {payload.creativeChangesThisWeek}건 · 랜딩 변경 {payload.landingChangesThisWeek}건
          </p>
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
