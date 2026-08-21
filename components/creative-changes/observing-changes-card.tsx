import Link from "next/link";
import { CHANGE_TYPE_LABELS } from "@/lib/creative-changes/change-type-labels";
import type { ObservingChangeSummary } from "@/lib/creative-changes/dashboard-summary";

interface ObservingChangesCardProps {
  items: ObservingChangeSummary[];
}

export function ObservingChangesCard({ items }: ObservingChangesCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">현재 관찰 중인 변경</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">현재 관찰 중인 변경이 없습니다.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map(({ change, daysElapsed, periodDays }) => (
            <li key={change.id}>
              <Link
                href={`/ads/before-after?changeId=${change.id}`}
                className="-m-2 block rounded-md p-2 hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-900">{change.ad_name ?? change.ad_id}</p>
                <p className="text-xs text-gray-500">
                  {CHANGE_TYPE_LABELS[change.change_type]} {change.new_version ?? ""} 테스트 중
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  D+{daysElapsed} / {periodDays}일 · 현재 상태: 관찰 중
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
