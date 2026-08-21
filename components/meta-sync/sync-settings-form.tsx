"use client";

import { useActionState } from "react";
import { updateMetaSyncSettingsAction, type SyncActionResult } from "@/app/data/meta-sync/actions";
import type { MetaSyncSettings } from "@/lib/meta/types";
import { cn } from "@/lib/utils";

interface SyncSettingsFormProps {
  settings: MetaSyncSettings;
}

const initialState: SyncActionResult = { ok: true, message: "" };

export function SyncSettingsForm({ settings }: SyncSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: SyncActionResult, formData: FormData) => updateMetaSyncSettingsAction(formData),
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="subjectKeywords">
          제목 키워드 (줄바꿈으로 구분)
        </label>
        <textarea
          id="subjectKeywords"
          name="subjectKeywords"
          rows={3}
          defaultValue={settings.subjectKeywords.join("\n")}
          placeholder={"MIHO Meta Daily\nMeta 광고 보고서"}
          className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="lookbackHours">
            검색 기간 (시간)
          </label>
          <input
            id="lookbackHours"
            name="lookbackHours"
            type="number"
            min={1}
            defaultValue={settings.lookbackHours}
            className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">첨부파일 확장자</legend>
          <div className="mt-1.5 flex h-[38px] items-center gap-4">
            <label className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="checkbox"
                name="allowedExtensions"
                value="csv"
                defaultChecked={settings.allowedExtensions.includes("csv")}
              />
              CSV
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="checkbox"
                name="allowedExtensions"
                value="xlsx"
                defaultChecked={settings.allowedExtensions.includes("xlsx")}
              />
              XLSX
            </label>
          </div>
        </fieldset>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="autoSyncEnabled" defaultChecked={settings.autoSyncEnabled} />
        자동 수집 활성화
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800",
            isPending && "cursor-not-allowed opacity-60"
          )}
        >
          설정 저장
        </button>
        {state.message ? (
          <p className={cn("text-xs", state.ok ? "text-green-600" : "text-red-600")}>{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
