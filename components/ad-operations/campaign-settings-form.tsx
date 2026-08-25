"use client";

import { useActionState, useMemo, useState } from "react";
import { saveCampaignSettingAction } from "@/app/settings/ad-operations/actions";
import { initialAdOperationsActionState } from "@/app/settings/ad-operations/action-state";
import type { AdHierarchyRow } from "@/lib/creative-changes/repository";
import type { CampaignSettingsRecord } from "@/lib/ad-operations/types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatWon } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

interface CampaignSettingsFormProps {
  hierarchy: AdHierarchyRow[];
  settings: CampaignSettingsRecord[];
}

export function CampaignSettingsForm({ hierarchy, settings }: CampaignSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveCampaignSettingAction, initialAdOperationsActionState);
  const [selected, setSelected] = useState("");

  const campaigns = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const row of hierarchy) {
      if (row.campaignName) map.set(row.campaignName, row.campaignId);
    }
    return [...map.entries()];
  }, [hierarchy]);

  const existing = settings.find((s) => s.campaign_name === selected) ?? null;
  const selectedCampaignId = campaigns.find(([name]) => name === selected)?.[1] ?? null;

  const columns: DataTableColumn<CampaignSettingsRecord>[] = [
    { key: "campaign_name", header: "캠페인" },
    { key: "official_start_date", header: "공식 시작일", render: (r) => r.official_start_date ?? "미등록" },
    {
      key: "planned_monthly_budget",
      header: "계획 월 예산",
      render: (r) => (r.planned_monthly_budget !== null ? formatWon(r.planned_monthly_budget) : "—"),
    },
    {
      key: "planned_daily_budget",
      header: "계획 일 예산",
      render: (r) => (r.planned_daily_budget !== null ? formatWon(r.planned_daily_budget) : "—"),
    },
  ];

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="campaignId" value={selectedCampaignId ?? ""} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="campaignName">
              캠페인
            </label>
            <select
              id="campaignName"
              name="campaignName"
              className={inputClass}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">선택</option>
              {campaigns.map(([name]) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="campaignOfficialStartDate">
              공식 시작일
            </label>
            <input
              id="campaignOfficialStartDate"
              name="officialStartDate"
              type="date"
              key={`start-${selected}`}
              defaultValue={existing?.official_start_date ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="campaignPlannedMonthlyBudget">
              계획 월 예산 (원)
            </label>
            <input
              id="campaignPlannedMonthlyBudget"
              name="plannedMonthlyBudget"
              type="number"
              min="0"
              key={`monthly-${selected}`}
              defaultValue={existing?.planned_monthly_budget ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="campaignPlannedDailyBudget">
              계획 일 예산 (원)
            </label>
            <input
              id="campaignPlannedDailyBudget"
              name="plannedDailyBudget"
              type="number"
              min="0"
              key={`daily-${selected}`}
              defaultValue={existing?.planned_daily_budget ?? ""}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !selected}
            className={cn(
              "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
              (isPending || !selected) && "cursor-not-allowed opacity-60"
            )}
          >
            {isPending ? "저장 중..." : "캠페인 설정 저장"}
          </button>
          {state.message ? (
            <p className={cn("text-sm", state.status === "success" ? "text-green-600" : "text-red-600")}>
              {state.message}
            </p>
          ) : null}
        </div>
      </form>

      <DataTable title="캠페인별 설정" columns={columns} data={settings} getRowKey={(r) => r.id} />
    </div>
  );
}
