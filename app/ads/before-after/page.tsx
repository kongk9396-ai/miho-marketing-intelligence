import { GitCompare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { ComparisonTable } from "@/components/creative-changes/comparison-table";
import { VerdictPanel } from "@/components/creative-changes/verdict-panel";
import { MetricTimelineChart } from "@/components/creative-changes/metric-timeline-chart";
import { ChangeSelector } from "@/components/creative-changes/change-selector";
import {
  getMetaDailyRowsForAd,
  getRecentChangesForAdOrCampaign,
  listCreativeChanges,
} from "@/lib/creative-changes/repository";
import { computeComparisonPeriods } from "@/lib/creative-changes/period";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { buildMetricComparisons } from "@/lib/creative-changes/comparison";
import { evaluateObservation } from "@/lib/creative-changes/observation-status";
import { buildDailySeries } from "@/lib/creative-changes/daily-series";
import { CHANGE_TYPE_LABELS, OBSERVATION_STATUS_LABELS } from "@/lib/creative-changes/change-type-labels";
import { formatKoreanDateTime, toKstDateOnly } from "@/lib/date/kst";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";
import type { ObservationStatus } from "@/lib/creative-changes/types";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<ObservationStatus, StatusVariant> = {
  observing: "info",
  insufficient_data: "warning",
  verdict_ready: "neutral",
  rollback_review: "danger",
  winner_confirmed: "success",
};

interface BeforeAfterPageProps {
  searchParams: Promise<{ changeId?: string }>;
}

export default async function BeforeAfterPage({ searchParams }: BeforeAfterPageProps) {
  const params = await searchParams;
  const header = (
    <PageHeader title="전후 비교" description="변경 전후 동일 기간의 광고 성과를 자동으로 비교합니다." />
  );

  let changes;
  try {
    changes = await listCreativeChanges(100);
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

  if (changes.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={GitCompare}
          title="아직 데이터가 없습니다."
          description="소재 변경 페이지에서 변경 이력을 먼저 등록해주세요."
        />
      </>
    );
  }

  const selectedChange = changes.find((c) => c.id === params.changeId) ?? changes[0];
  const periods = computeComparisonPeriods(selectedChange.changed_at, selectedChange.comparison_period_days);

  const [beforeRows, afterRows, fullRangeRows, relatedChanges] = await Promise.all([
    getMetaDailyRowsForAd(selectedChange.ad_id, periods.before.start, periods.before.end),
    getMetaDailyRowsForAd(selectedChange.ad_id, periods.after.start, periods.after.end),
    getMetaDailyRowsForAd(selectedChange.ad_id, periods.before.start, periods.after.end),
    getRecentChangesForAdOrCampaign(selectedChange.ad_id, selectedChange.campaign_id, 365),
  ]);

  const before = aggregatePeriodMetrics(beforeRows);
  const after = aggregatePeriodMetrics(afterRows);
  const comparisons = buildMetricComparisons(before, after);
  const evaluation = evaluateObservation({
    changedAt: selectedChange.changed_at,
    comparisonPeriodDays: selectedChange.comparison_period_days,
    before,
    after,
  });

  const dailySeries = buildDailySeries(fullRangeRows);
  const markersInRange = relatedChanges.filter((c) => {
    const d = toKstDateOnly(c.changed_at);
    return d >= periods.before.start && d <= periods.after.end;
  });

  return (
    <>
      <PageHeader
        title="전후 비교"
        description="변경 전후 동일 기간의 광고 성과를 자동으로 비교합니다."
        actions={<ChangeSelector changes={changes} selectedId={selectedChange.id} />}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {selectedChange.campaign_name ?? "—"}
              {selectedChange.adset_name ? ` · ${selectedChange.adset_name}` : ""}
            </p>
            <p className="text-base font-semibold text-gray-900">
              {selectedChange.ad_name ?? selectedChange.ad_id}
            </p>
          </div>
          <StatusBadge
            label={OBSERVATION_STATUS_LABELS[evaluation.status]}
            variant={STATUS_VARIANT[evaluation.status]}
          />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-gray-500">변경 일시</dt>
            <dd className="font-medium text-gray-900">{formatKoreanDateTime(selectedChange.changed_at)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">변경 유형</dt>
            <dd className="font-medium text-gray-900">{CHANGE_TYPE_LABELS[selectedChange.change_type]}</dd>
          </div>
          <div>
            <dt className="text-gray-500">버전</dt>
            <dd className="font-medium text-gray-900">
              {selectedChange.old_version ?? "—"} → {selectedChange.new_version ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">비교 기간</dt>
            <dd className="font-medium text-gray-900">
              {selectedChange.comparison_period_days}일 (D+{evaluation.progress.daysElapsedCapped})
            </dd>
          </div>
        </dl>
        {selectedChange.memo ? (
          <p className="mt-2 text-sm text-gray-600">메모: {selectedChange.memo}</p>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ComparisonTable rows={comparisons} />
        </div>
        <VerdictPanel verdict={evaluation.verdict} isObserving={evaluation.status === "observing"} />
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">변경 타임라인</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MetricTimelineChart
            title="CTR 추이"
            data={dailySeries.map((d) => ({ date: d.date, value: d.ctr }))}
            markers={markersInRange}
            valueFormatter={(v) => `${v.toFixed(2)}%`}
            color="#2563eb"
          />
          <MetricTimelineChart
            title="CPC 추이"
            data={dailySeries.map((d) => ({ date: d.date, value: d.cpc }))}
            markers={markersInRange}
            valueFormatter={(v) => `₩${Math.round(v).toLocaleString("ko-KR")}`}
            color="#dc2626"
          />
          <MetricTimelineChart
            title="광고비 추이"
            data={dailySeries.map((d) => ({ date: d.date, value: d.spend }))}
            markers={markersInRange}
            valueFormatter={(v) => `₩${Math.round(v).toLocaleString("ko-KR")}`}
            color="#059669"
          />
          <MetricTimelineChart
            title="50% 시청률 추이"
            data={dailySeries.map((d) => ({ date: d.date, value: d.video50Rate }))}
            markers={markersInRange}
            valueFormatter={(v) => `${v.toFixed(1)}%`}
            color="#7c3aed"
          />
        </div>
        <div className="mt-4">
          <MetricTimelineChart
            title="완주율 추이"
            data={dailySeries.map((d) => ({ date: d.date, value: d.completionRate }))}
            markers={markersInRange}
            valueFormatter={(v) => `${v.toFixed(1)}%`}
            color="#ea580c"
          />
        </div>
      </div>
    </>
  );
}
