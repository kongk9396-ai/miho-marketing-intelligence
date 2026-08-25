"use client";

import { useActionState } from "react";
import { saveAccountSettingsAction } from "@/app/settings/ad-operations/actions";
import { initialAdOperationsActionState } from "@/app/settings/ad-operations/action-state";
import type { AdAccountSettings } from "@/lib/ad-operations/types";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function AccountSettingsForm({ settings }: { settings: AdAccountSettings | null }) {
  const [state, formAction, isPending] = useActionState(saveAccountSettingsAction, initialAdOperationsActionState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="officialStartDate">
            Meta 공식 시작일
          </label>
          <input
            id="officialStartDate"
            name="officialStartDate"
            type="date"
            defaultValue={settings?.official_start_date ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="plannedMonthlyBudget">
            계획 월 예산 (원)
          </label>
          <input
            id="plannedMonthlyBudget"
            name="plannedMonthlyBudget"
            type="number"
            min="0"
            defaultValue={settings?.planned_monthly_budget ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="plannedDailyBudget">
            계획 일 예산 (원, 선택)
          </label>
          <input
            id="plannedDailyBudget"
            name="plannedDailyBudget"
            type="number"
            min="0"
            defaultValue={settings?.planned_daily_budget ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
            isPending && "cursor-not-allowed opacity-60"
          )}
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
        {state.message ? (
          <p className={cn("text-sm", state.status === "success" ? "text-green-600" : "text-red-600")}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
