import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { OPERATIONAL_RECOMMENDATION_LABELS, type OperationalRecommendation, type AdOperationalDecision } from "@/lib/ad-performance-summary/operational-decision";
import type { AdOperationalStatusValue } from "@/lib/ad-operations/types";

const RECOMMENDATION_VARIANT: Record<OperationalRecommendation, StatusVariant> = {
  SCALE_REVIEW: "success",
  KEEP: "info",
  WATCH: "neutral",
  CREATIVE_FIX: "warning",
  LANDING_FIX: "warning",
  OFF_REVIEW: "danger",
};

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

export function AdComparisonTable({ decisions }: { decisions: AdOperationalDecision[] }) {
  const columns: DataTableColumn<AdOperationalDecision>[] = [
    {
      key: "ad",
      header: "광고",
      render: (d) => (
        <div>
          <p className="font-medium text-gray-900">{d.adName ?? d.adId}</p>
          <p className="text-xs text-gray-400">{d.campaignName ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "recommendation",
      header: "시스템 추천",
      render: (d) => (
        <StatusBadge
          label={OPERATIONAL_RECOMMENDATION_LABELS[d.recommendation]}
          variant={RECOMMENDATION_VARIANT[d.recommendation]}
        />
      ),
    },
    {
      key: "actualStatus",
      header: "실제 운영 상태",
      render: (d) =>
        d.actualStatus ? (
          <div>
            <StatusBadge
              label={ACTUAL_STATUS_LABELS[d.actualStatus.status]}
              variant={ACTUAL_STATUS_VARIANT[d.actualStatus.status]}
            />
            {d.actualStatus.status === "OFF" ? (
              <p className="mt-1 text-xs text-gray-400">
                {d.actualStatus.status_changed_at} · {d.actualStatus.reason ?? "사유 미기록"}
              </p>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-gray-400">기록 없음</span>
        ),
    },
    {
      key: "reasons",
      header: "근거",
      render: (d) => (
        <ul className="list-inside list-disc text-xs text-gray-600">
          {d.reasons.slice(0, 3).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <DataTable
      title="전체 광고 비교"
      columns={columns}
      data={decisions}
      getRowKey={(d) => d.adId}
      emptyMessage="진단 가능한 광고가 없습니다."
    />
  );
}

