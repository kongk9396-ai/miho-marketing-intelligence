import { Globe } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { getGa4DailyRows, getLatestGa4DataDate, getLatestGa4SyncHistory } from "@/lib/ga4/repository";
import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import { formatCount, formatPercent } from "@/lib/dashboard/format";
import { formatKoreanDate, formatKoreanDateTime } from "@/lib/date/kst";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

export default async function Ga4Page() {
  const header = (
    <PageHeader title="GA4" description="Google Analytics 4의 웹사이트 트래픽 및 행동 데이터 전체 현황입니다." />
  );

  let rows;
  let latestDate;
  let syncHistory;
  try {
    [rows, latestDate, syncHistory] = await Promise.all([
      getGa4DailyRows(),
      getLatestGa4DataDate(),
      getLatestGa4SyncHistory(5),
    ]);
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

  if (rows.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={Globe}
          title="아직 데이터가 없습니다."
          description="/data/ga4-sync에서 GA4 동기화를 먼저 실행해주세요."
        />
      </>
    );
  }

  const metrics = aggregateGa4Metrics(rows);
  const formCompleteTrackingConnected = !(metrics.totalFormStarts > 0 && metrics.totalFormCompletes === 0);
  const latestSync = syncHistory[0] ?? null;

  return (
    <>
      {header}

      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
        최신 데이터 날짜: {latestDate ? formatKoreanDate(latestDate) : "데이터 없음"} · 총 {rows.length.toLocaleString("ko-KR")}행
        {latestSync ? (
          <>
            {" · 마지막 동기화: "}
            {formatKoreanDateTime(latestSync.processed_at)} ({latestSync.status === "success" ? "성공" : "실패"})
          </>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="세션" value={formatCount(metrics.totalSessions)} />
        <KpiCard label="랜딩/페이지 조회" value={formatCount(metrics.totalPageViews)} />
        <KpiCard
          label="참여 세션율"
          value={formatPercent(metrics.engagementRate, 1)}
        />
        <KpiCard label="CTA 클릭" value={formatCount(metrics.totalCtaClicks)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="CTA 전환율" value={formatPercent(metrics.ctaRate, 1)} />
        <KpiCard label="폼 시작" value={formatCount(metrics.totalFormStarts)} />
        <KpiCard label="폼 시작률" value={formatPercent(metrics.formStartRate, 1)} />
        <KpiCard
          label="폼 완료"
          value={formCompleteTrackingConnected ? formatCount(metrics.totalFormCompletes) : "추적 미연결"}
          emptyHint={!formCompleteTrackingConnected ? "form_start는 발생하지만 form_complete 이벤트가 한 번도 기록되지 않았습니다." : undefined}
        />
      </div>

      <p className="mt-4 text-xs text-gray-400">
        캠페인/광고(UTM)별 세부 퍼널은 좌측 메뉴의 &quot;랜딩 분석&quot;에서 확인할 수 있습니다.
      </p>
    </>
  );
}
