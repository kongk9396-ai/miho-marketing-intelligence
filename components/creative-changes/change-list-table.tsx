import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { CHANGE_TYPE_LABELS } from "@/lib/creative-changes/change-type-labels";
import { computeObservationProgress } from "@/lib/creative-changes/period";
import { formatKoreanDateTime } from "@/lib/date/kst";
import type { CreativeChangeRecord } from "@/lib/creative-changes/types";

interface ChangeListTableProps {
  changes: CreativeChangeRecord[];
}

export function ChangeListTable({ changes }: ChangeListTableProps) {
  const columns: DataTableColumn<CreativeChangeRecord>[] = [
    { key: "changed_at", header: "변경 일시", render: (row) => formatKoreanDateTime(row.changed_at) },
    {
      key: "ad",
      header: "광고",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.ad_name ?? row.ad_id}</p>
          <p className="text-xs text-gray-400">
            {row.campaign_name ?? "—"} {row.adset_name ? `· ${row.adset_name}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "change_type",
      header: "변경 유형",
      render: (row) => CHANGE_TYPE_LABELS[row.change_type],
    },
    {
      key: "version",
      header: "버전",
      render: (row) =>
        row.old_version || row.new_version ? `${row.old_version ?? "—"} → ${row.new_version ?? "—"}` : "—",
    },
    { key: "comparison_period_days", header: "비교 기간", align: "right", render: (row) => `${row.comparison_period_days}일` },
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
        <Link href={`/ads/before-after?changeId=${row.id}`} className="text-sm font-medium text-blue-600 hover:underline">
          전후 비교
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      title="등록된 변경 이력"
      columns={columns}
      data={changes}
      getRowKey={(row) => row.id}
      emptyMessage="아직 등록된 변경 이력이 없습니다."
    />
  );
}
