import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";

interface SyncStatusCardProps {
  title: string;
  lastSyncLabel: string;
  statusLabel: string;
  statusVariant: StatusVariant;
  latestDataDateLabel: string;
}

/**
 * Reusable "데이터 최신 상태" card. Meta uses it today; GA4 and DB (leads)
 * sync status can reuse it later with the same props shape.
 */
export function SyncStatusCard({
  title,
  lastSyncLabel,
  statusLabel,
  statusVariant,
  latestDataDateLabel,
}: SyncStatusCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <dl className="mt-3 space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">마지막 동기화</dt>
          <dd className="font-medium text-gray-900">{lastSyncLabel}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">상태</dt>
          <dd>
            <StatusBadge label={statusLabel} variant={statusVariant} />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">최근 데이터 날짜</dt>
          <dd className="font-medium text-gray-900">{latestDataDateLabel}</dd>
        </div>
      </dl>
    </div>
  );
}
