"use client";

import { useActionState, useMemo, useState } from "react";
import { saveAdOperationalStatusAction } from "@/app/settings/ad-operations/actions";
import { initialAdOperationsActionState } from "@/app/settings/ad-operations/action-state";
import type { AdHierarchyRow } from "@/lib/creative-changes/repository";
import { AD_OPERATIONAL_STATUSES, type AdOffSnapshotRecord, type AdOperationalStatusRecord } from "@/lib/ad-operations/types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatWon } from "@/lib/dashboard/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const STATUS_LABELS: Record<(typeof AD_OPERATIONAL_STATUSES)[number], string> = {
  ACTIVE: "운영 중",
  PAUSED: "일시중지",
  OFF: "종료",
  TESTING: "테스트 중",
};

interface AdStatusFormProps {
  hierarchy: AdHierarchyRow[];
  statuses: AdOperationalStatusRecord[];
  snapshotsByStatusId: Map<string, AdOffSnapshotRecord>;
}

export function AdStatusForm({ hierarchy, statuses, snapshotsByStatusId }: AdStatusFormProps) {
  const [state, formAction, isPending] = useActionState(saveAdOperationalStatusAction, initialAdOperationsActionState);
  const [campaignName, setCampaignName] = useState("");
  const [adName, setAdName] = useState("");

  const campaignNames = useMemo(
    () => [...new Set(hierarchy.map((r) => r.campaignName).filter((n): n is string => !!n))],
    [hierarchy]
  );
  const adsInCampaign = useMemo(
    () => hierarchy.filter((r) => r.campaignName === campaignName),
    [hierarchy, campaignName]
  );
  const selectedAd = adsInCampaign.find((r) => r.adName === adName) ?? null;
  const existing = statuses.find((s) => s.campaign_name === campaignName && s.ad_name === adName) ?? null;
  const today = new Date().toISOString().slice(0, 10);

  const columns: DataTableColumn<AdOperationalStatusRecord>[] = [
    { key: "campaign_name", header: "캠페인" },
    { key: "ad_name", header: "광고" },
    {
      key: "status",
      header: "상태",
      render: (r) => (
        <StatusBadge
          label={STATUS_LABELS[r.status]}
          variant={r.status === "OFF" ? "danger" : r.status === "ACTIVE" ? "success" : "neutral"}
        />
      ),
    },
    { key: "status_changed_at", header: "변경일" },
    { key: "reason", header: "사유", render: (r) => r.reason ?? "—" },
    {
      key: "snapshot",
      header: "OFF 전 스냅샷",
      render: (r) => {
        if (r.status !== "OFF") return "—";
        const snap = snapshotsByStatusId.get(r.id);
        if (!snap) return "스냅샷 없음";
        const parts: string[] = [];
        if (snap.spend !== null) parts.push(`지출 ${formatWon(snap.spend)}`);
        if (snap.ctr !== null) parts.push(`CTR ${snap.ctr.toFixed(2)}%`);
        if (snap.cpc !== null) parts.push(`CPC ${formatWon(snap.cpc)}`);
        if (snap.video_100_rate !== null) parts.push(`완주율 ${snap.video_100_rate.toFixed(1)}%`);
        return parts.length > 0 ? parts.join(" · ") : "데이터 없음";
      },
    },
  ];

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="adId" value={selectedAd?.adId ?? ""} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="statusCampaignName">
              캠페인
            </label>
            <select
              id="statusCampaignName"
              name="campaignName"
              className={inputClass}
              value={campaignName}
              onChange={(e) => {
                setCampaignName(e.target.value);
                setAdName("");
              }}
            >
              <option value="">선택</option>
              {campaignNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="statusAdName">
              광고
            </label>
            <select
              id="statusAdName"
              name="adName"
              className={inputClass}
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
            >
              <option value="">선택</option>
              {[...new Set(adsInCampaign.map((r) => r.adName).filter((n): n is string => !!n))].map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="status">
              운영 상태
            </label>
            <select
              id="status"
              name="status"
              className={inputClass}
              key={`status-${campaignName}-${adName}`}
              defaultValue={existing?.status ?? "ACTIVE"}
            >
              {AD_OPERATIONAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="statusChangedAt">
              상태 변경일
            </label>
            <input
              id="statusChangedAt"
              name="statusChangedAt"
              type="date"
              key={`date-${campaignName}-${adName}`}
              defaultValue={existing?.status_changed_at ?? today}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="reason">
              변경 이유
            </label>
            <input
              id="reason"
              name="reason"
              type="text"
              key={`reason-${campaignName}-${adName}`}
              defaultValue={existing?.reason ?? ""}
              placeholder="예: A 소재 대비 CPC 높음"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="memo">
            메모
          </label>
          <input
            id="memo"
            name="memo"
            type="text"
            key={`memo-${campaignName}-${adName}`}
            defaultValue={existing?.memo ?? ""}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !campaignName || !adName}
            className={cn(
              "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
              (isPending || !campaignName || !adName) && "cursor-not-allowed opacity-60"
            )}
          >
            {isPending ? "저장 중..." : "운영 상태 저장"}
          </button>
          {state.message ? (
            <p className={cn("text-sm", state.status === "success" ? "text-green-600" : "text-red-600")}>
              {state.message}
            </p>
          ) : null}
        </div>
      </form>

      <DataTable title="광고별 운영 상태" columns={columns} data={statuses} getRowKey={(r) => r.id} />
    </div>
  );
}
