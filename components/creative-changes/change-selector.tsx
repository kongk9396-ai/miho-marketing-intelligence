"use client";

import { useRouter } from "next/navigation";
import { CHANGE_TYPE_LABELS } from "@/lib/creative-changes/change-type-labels";
import { formatKoreanDateTime } from "@/lib/date/kst";
import type { CreativeChangeRecord } from "@/lib/creative-changes/types";

interface ChangeSelectorProps {
  changes: CreativeChangeRecord[];
  selectedId: string;
}

export function ChangeSelector({ changes, selectedId }: ChangeSelectorProps) {
  const router = useRouter();

  return (
    <select
      value={selectedId}
      onChange={(e) => router.push(`/ads/before-after?changeId=${e.target.value}`)}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {changes.map((change) => (
        <option key={change.id} value={change.id}>
          {formatKoreanDateTime(change.changed_at)} · {change.ad_name ?? change.ad_id} ·{" "}
          {CHANGE_TYPE_LABELS[change.change_type]}
        </option>
      ))}
    </select>
  );
}
