import Link from "next/link";
import { deleteLandingChangeAction } from "@/app/changes/landing/actions";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { LANDING_CHANGE_TYPE_LABELS } from "@/lib/landing-changes/change-type-labels";
import { computeObservationProgress } from "@/lib/creative-changes/period";
import { formatKoreanDateTime } from "@/lib/date/kst";
import type { LandingChangeRecord } from "@/lib/landing-changes/types";
import { parseLinkedCampaignNames } from "@/lib/landing-changes/repository";

interface ChangeListTableProps {
  changes: LandingChangeRecord[];
}

export function LandingChangeListTable({ changes }: ChangeListTableProps) {
  const columns: DataTableColumn<LandingChangeRecord>[] = [
    { key: "changed_at", header: "변경 일시", render: (row) => formatKoreanDateTime(row.changed_at) },
    {
      key: "landing",
      header: "랜딩",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.landing_name}</p>
          <p className="text-xs text-gray-400">
            {parseLinkedCampaignNames(row.linked_campaign_name).length > 0
              ? `연결 캠페인: ${parseLinkedCampaignNames(row.linked_campaign_name).join(", ")}`
              : "연결 캠페인 없음"}
          </p>
        </div>
      ),
    },
    { key: "change_type", header: "변경 유형", render: (row) => LANDING_CHANGE_TYPE_LABELS[row.change_type] },
    {
      key: "version",
      header: "버전",
      render: (row) =>
        row.old_version || row.new_version ? `${row.old_version ?? "—"} → ${row.new_version ?? "—"}` : "—",
    },
    {
      key: "comparison_period_days",
      header: "비교 기간",
      align: "right",
      render: (row) => `${row.comparison_period_days}일`,
    },
    {
      key: "status",
      header: "상태",
      render: (row) => {
        const progress = computeObservationProgress(row.changed_at, row.comparison_period_days);
        return progress.isObservationWindowComplete ? (
          <StatusBadge label="관찰 완료" variant="neutral" />
        ) : (
          <StatusBadge label={`관찰 중 (D+${progress.daysElapsedCapped}/${progress.periodDays}일)`} variant="info" />
        );
      },
    },
    {
      key: "action",
      header: "",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Link
            href={`/landing/before-after?changeId=${row.id}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            전후 비교
          </Link>

          <Link
            href={`/changes/landing?edit=${row.id}`}
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            수정
          </Link>

          <form action={deleteLandingChangeAction}>
            <input type="hidden" name="id" value={row.id} />
            <button
              type="submit"
              className="text-sm font-medium text-red-600 hover:underline"
            >
              삭제
            </button>
          </form>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="등록된 랜딩 변경 이력"
      columns={columns}
      data={changes}
      getRowKey={(row) => row.id}
      emptyMessage="아직 등록된 랜딩 변경 이력이 없습니다."
    />
  );
}


