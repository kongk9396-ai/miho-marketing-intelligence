import Link from "next/link";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { CHANGE_TYPE_LABELS, OBSERVATION_STATUS_LABELS } from "@/lib/creative-changes/change-type-labels";
import type { RecentChangeImpactSummary } from "@/lib/creative-changes/dashboard-summary";
import type { ObservationStatus } from "@/lib/creative-changes/types";

interface RecentImpactCardProps {
  items: RecentChangeImpactSummary[];
}

const STATUS_VARIANT: Record<ObservationStatus, StatusVariant> = {
  observing: "info",
  insufficient_data: "warning",
  verdict_ready: "neutral",
  rollback_review: "danger",
  winner_confirmed: "success",
};

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function RecentImpactCard({ items }: RecentImpactCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">최근 변경 영향</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">최근 종료된 변경 관찰이 없습니다.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map(({ change, status, ctrChangePercent, cpcChangePercent }) => (
            <li key={change.id}>
              <Link
                href={`/ads/before-after?changeId=${change.id}`}
                className="-m-2 block rounded-md p-2 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {change.ad_name ?? change.ad_id} {CHANGE_TYPE_LABELS[change.change_type]} 변경
                  </p>
                  <StatusBadge label={OBSERVATION_STATUS_LABELS[status]} variant={STATUS_VARIANT[status]} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  CTR {formatPercent(ctrChangePercent)} · CPC {formatPercent(cpcChangePercent)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
