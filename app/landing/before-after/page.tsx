import { LayoutTemplate } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ComparisonTable } from "@/components/creative-changes/comparison-table";
import { VerdictPanel } from "@/components/creative-changes/verdict-panel";
import { LandingChangeSelector } from "@/components/landing-changes/change-selector";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import {
  getGa4RowsForLandingChange,
  getLeadsForLinkedCampaign,
  listLandingChanges,
} from "@/lib/landing-changes/repository";
import { computeComparisonPeriods } from "@/lib/creative-changes/period";
import { aggregateLandingPeriodMetrics } from "@/lib/landing-changes/metrics";
import { buildLandingMetricComparisons } from "@/lib/landing-changes/comparison";
import { evaluateLandingObservation } from "@/lib/landing-changes/observation-status";
import { checkFormCompleteTrackingConnected } from "@/lib/ad-diagnosis/build";
import { buildLandingChangeReportLine } from "@/lib/landing-changes/report-text";
import { computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import { kstDateOnlyToInstantIso } from "@/lib/leads-analysis/period";
import { LANDING_CHANGE_TYPE_LABELS } from "@/lib/landing-changes/change-type-labels";
import { OBSERVATION_STATUS_LABELS } from "@/lib/creative-changes/change-type-labels";
import { formatCount } from "@/lib/dashboard/format";
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

interface LandingBeforeAfterPageProps {
  searchParams: Promise<{ changeId?: string }>;
}

export default async function LandingBeforeAfterPage({ searchParams }: LandingBeforeAfterPageProps) {
  const params = await searchParams;
  const header = (
    <PageHeader title="랜딩 전후 비교" description="랜딩 변경 전후 동일 기간의 GA4 성과를 자동으로 비교합니다." />
  );

  let changes;
  try {
    changes = await listLandingChanges(100);
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
          icon={LayoutTemplate}
          title="아직 데이터가 없습니다."
          description="랜딩 변경 페이지에서 변경 이력을 먼저 등록해주세요."
        />
      </>
    );
  }

  const selectedChange = changes.find((c) => c.id === params.changeId) ?? changes[0];
  const periods = computeComparisonPeriods(selectedChange.changed_at, selectedChange.comparison_period_days);

  const [beforeRows, afterRows, formCompleteTrackingConnected] = await Promise.all([
    getGa4RowsForLandingChange(selectedChange.landing_page_pattern, periods.before.start, periods.before.end),
    getGa4RowsForLandingChange(selectedChange.landing_page_pattern, periods.after.start, periods.after.end),
    checkFormCompleteTrackingConnected(periods.before.start, periods.after.end),
  ]);

  const before = aggregateLandingPeriodMetrics(beforeRows);
  const after = aggregateLandingPeriodMetrics(afterRows);
  const comparisons = buildLandingMetricComparisons(before, after, formCompleteTrackingConnected);
  const evaluation = evaluateLandingObservation({
    changedAt: selectedChange.changed_at,
    comparisonPeriodDays: selectedChange.comparison_period_days,
    before,
    after,
  });
  const reportLine = buildLandingChangeReportLine({
    changedAtKst: toKstDateOnly(selectedChange.changed_at),
    before,
    after,
    hasSufficientData: evaluation.status !== "observing" && evaluation.status !== "insufficient_data",
    comparisonPeriodDays: selectedChange.comparison_period_days,
    isObservationWindowComplete: evaluation.progress.isObservationWindowComplete,
  });

  const [dbBefore, dbAfter] = await Promise.all([
    getLeadsForLinkedCampaign(
      selectedChange.linked_campaign_name,
      kstDateOnlyToInstantIso(periods.before.start),
      kstDateOnlyToInstantIso(periods.before.end)
    ),
    getLeadsForLinkedCampaign(
      selectedChange.linked_campaign_name,
      kstDateOnlyToInstantIso(periods.after.start),
      kstDateOnlyToInstantIso(periods.after.end)
    ),
  ]);

  return (
    <>
      <PageHeader
        title="랜딩 전후 비교"
        description="랜딩 변경 전후 동일 기간의 GA4 성과를 자동으로 비교합니다."
        actions={<LandingChangeSelector changes={changes} selectedId={selectedChange.id} />}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {selectedChange.linked_campaign_name ?? "연결 캠페인 없음"}
            </p>
            <p className="text-base font-semibold text-gray-900">{selectedChange.landing_name}</p>
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
            <dd className="font-medium text-gray-900">{LANDING_CHANGE_TYPE_LABELS[selectedChange.change_type]}</dd>
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
        {selectedChange.memo ? <p className="mt-2 text-sm text-gray-600">메모: {selectedChange.memo}</p> : null}
      </div>

      <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        {reportLine}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ComparisonTable rows={comparisons} />
        </div>
        <VerdictPanel verdict={evaluation.verdict} isObserving={evaluation.status === "observing"} />
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">DB / 유효 DB / 예약 전후</h3>
        {dbBefore === null || dbAfter === null ? (
          <p className="mt-2 text-sm text-gray-500">
            연결된 캠페인이 없어 DB 귀속 불가입니다. 변경 등록 시 캠페인을 연결하면 표시됩니다.
          </p>
        ) : (
          (() => {
            const beforeKpi = computeLeadsKpiSummary(dbBefore);
            const afterKpi = computeLeadsKpiSummary(dbAfter);
            return (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-gray-500">총 DB</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCount(beforeKpi.totalDb)} → {formatCount(afterKpi.totalDb)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">유효 DB</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCount(beforeKpi.validDb)} → {formatCount(afterKpi.validDb)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">예약 확정</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCount(beforeKpi.confirmedBookings)} → {formatCount(afterKpi.confirmedBookings)}
                  </dd>
                </div>
              </dl>
            );
          })()
        )}
      </div>
    </>
  );
}
