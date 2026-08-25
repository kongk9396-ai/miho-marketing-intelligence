"use client";

import { useRouter } from "next/navigation";
import { LANDING_CHANGE_TYPE_LABELS } from "@/lib/landing-changes/change-type-labels";
import { formatKoreanDateTime } from "@/lib/date/kst";
import type { LandingChangeRecord } from "@/lib/landing-changes/types";

interface LandingChangeSelectorProps {
  changes: LandingChangeRecord[];
  selectedId: string;
}

export function LandingChangeSelector({ changes, selectedId }: LandingChangeSelectorProps) {
  const router = useRouter();

  return (
    <select
      value={selectedId}
      onChange={(e) => router.push(`/landing/before-after?changeId=${e.target.value}`)}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {changes.map((change) => (
        <option key={change.id} value={change.id}>
          {formatKoreanDateTime(change.changed_at)} · {change.landing_name} · {LANDING_CHANGE_TYPE_LABELS[change.change_type]}
        </option>
      ))}
    </select>
  );
}
