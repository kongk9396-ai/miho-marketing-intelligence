import { Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { buildAdDiagnosisGroups } from "@/lib/ad-diagnosis/build";
import { getOffSnapshotsByStatusId, listAdOperationalStatuses } from "@/lib/ad-operations/repository";
import { OPERATIONAL_RECOMMENDATION_LABELS } from "@/lib/ad-performance-summary/operational-decision";
import { buildAdOperationalDecisions } from "@/lib/ad-performance-summary/operational-decision";
import { formatWon, formatCount } from "@/lib/dashboard/format";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";
import type { AdOperationalStatusValue } from "@/lib/ad-operations/types";

export const dynamic = "force-dynamic";

const ACTUAL_STATUS_LABELS: Record<AdOperationalStatusValue, string> = {
  ACTIVE: "운영 중",
  PAUSED: "일시중지",
  OFF: "OFF",
  TESTING: "테스트 중",
};

const ACTUAL_STATUS_VARIANT: Record<AdOperationalStatusValue, StatusVariant> = {
  ACTIVE: "success",
  PAUSED: "neutral",
  OFF: "danger",
  TESTING: "info",
};

function formatPercent(value: number | null, digits = 2): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

export default async function CreativeAnalysisPage() {
  const header = (
    <PageHeader title="소재 분석" description="광고 소재별 지출/CTR/CPC/CPM/랜딩 전환과 동일 캠페인 내 비교를 확인합니다." />
  );

  let groups;
  let adStatuses;
  let offSnapshots;
  try {
    [groups, adStatuses, offSnapshots] = await Promise.all([
      buildAdDiagnosisGroups(),
      listAdOperationalStatuses(),
      getOffSnapshotsByStatusId(),
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

  if (groups.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={ImageIcon}
          title="아직 데이터가 없습니다."
          description="광고 데이터를 업로드하면 소재별 성과 지표가 여기에 표시됩니다."
        />
      </>
    );
  }

  const statusesByKey = new Map(adStatuses.map((s) => [`${s.campaign_name}|||${s.ad_name}`, s]));

  return (
    <>
      {header}

      <div className="flex flex-col gap-6">
        {groups.map((group) => {
          const decisions = buildAdOperationalDecisions(group.ads, statusesByKey, offSnapshots);
          const decisionByAdId = new Map(decisions.map((d) => [d.adId, d]));

          return (
            <section key={group.campaignName} className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4">
                <p className="text-sm font-semibold text-gray-900">{group.campaignName}</p>
                {group.ads.length >= 2 ? (
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{group.summary.summaryText}</p>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                {group.ads.map((ad) => {
                  const m = ad.metrics;
                  const cpm = m.impressions > 0 ? (m.spend / m.impressions) * 1000 : null;
                  const decision = decisionByAdId.get(ad.adId);
                  const actualStatus = decision?.actualStatus ?? null;

                  return (
                    <div key={ad.adId} className="rounded-lg border border-gray-200 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{ad.adName ?? ad.adId}</p>
                          <p className="text-xs text-gray-400">{ad.campaignName ?? "—"}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {actualStatus ? (
                            <StatusBadge
                              label={ACTUAL_STATUS_LABELS[actualStatus.status]}
                              variant={ACTUAL_STATUS_VARIANT[actualStatus.status]}
                            />
                          ) : (
                            <StatusBadge label="운영 상태 미기록" variant="neutral" />
                          )}
                          {decision ? (
                            <span className="text-[11px] text-gray-400">
                              시스템 추천: {OPERATIONAL_RECOMMENDATION_LABELS[decision.recommendation]}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                        <div>
                          <dt className="text-gray-400">지출</dt>
                          <dd className="font-medium text-gray-900">{formatWon(m.spend)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">노출</dt>
                          <dd className="font-medium text-gray-900">{formatCount(m.impressions)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">CTR</dt>
                          <dd className="font-medium text-gray-900">{formatPercent(m.ctr)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">CPC</dt>
                          <dd className="font-medium text-gray-900">{m.cpc !== null ? formatWon(m.cpc) : "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">CPM</dt>
                          <dd className="font-medium text-gray-900">{cpm !== null ? formatWon(cpm) : "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">랜딩 전환율</dt>
                          <dd className="font-medium text-gray-900">
                            {m.formCompleteTrackingConnected ? formatPercent(m.landingConversionRate, 1) : "폼 완료 추적 미연결"}
                          </dd>
                        </div>
                      </dl>

                      {decision && decision.reasons.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-500">근거</p>
                          <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                            {decision.reasons.slice(0, 3).map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        캠페인별 DB/예약 성과는 /report 종합 보고의 캠페인별 상세에서 확인할 수 있습니다.
      </p>
    </>
  );
}
