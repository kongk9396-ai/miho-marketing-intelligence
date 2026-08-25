"use client";

import { useState } from "react";
import { useActionState } from "react";
import { registerLandingChangeAction } from "@/app/changes/landing/actions";
import { initialRegisterLandingChangeState } from "@/app/changes/landing/action-state";
import { LANDING_CHANGE_TYPE_LABELS } from "@/lib/landing-changes/change-type-labels";
import { LANDING_CHANGE_TYPES } from "@/lib/landing-changes/types";
import { cn } from "@/lib/utils";

interface RegisterLandingChangeFormProps {
  landingPages: string[];
  campaignNames: string[];
}

const inputClass =
  "mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function RegisterLandingChangeForm({ landingPages, campaignNames }: RegisterLandingChangeFormProps) {
  const [state, formAction, isPending] = useActionState(
    registerLandingChangeAction,
    initialRegisterLandingChangeState
  );
  const [periodChoice, setPeriodChoice] = useState<"3" | "5" | "7" | "custom">("5");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="landingName">
            랜딩 이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="landingName"
            name="landingName"
            type="text"
            required
            placeholder="예: 첫코 랜딩"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="landingPagePattern">
            랜딩 페이지 URL 패턴 (선택)
          </label>
          <input
            id="landingPagePattern"
            name="landingPagePattern"
            type="text"
            list="landing-page-options"
            placeholder="비워두면 GA4 전체 집계로 비교"
            className={inputClass}
          />
          <datalist id="landing-page-options">
            {landingPages.map((page) => (
              <option key={page} value={page} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="linkedCampaignName">
          연결 캠페인 (선택 — DB/예약 전후 비교가 필요하면 지정)
        </label>
        <input
          id="linkedCampaignName"
          name="linkedCampaignName"
          type="text"
          list="campaign-name-options"
          placeholder="비워두면 DB/유효DB/예약 비교는 표시되지 않습니다"
          className={inputClass}
        />
        <datalist id="campaign-name-options">
          {campaignNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="changedAt">
            변경 일시 <span className="text-red-500">*</span>
          </label>
          <input id="changedAt" name="changedAt" type="datetime-local" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="changeType">
            변경 유형 <span className="text-red-500">*</span>
          </label>
          <select id="changeType" name="changeType" required className={inputClass} defaultValue="">
            <option value="" disabled>
              선택
            </option>
            {LANDING_CHANGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {LANDING_CHANGE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="oldVersion">
            기존 버전명
          </label>
          <input id="oldVersion" name="oldVersion" type="text" className={inputClass} placeholder="예: v1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="newVersion">
            신규 버전명
          </label>
          <input id="newVersion" name="newVersion" type="text" className={inputClass} placeholder="예: v2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="memo">
          메모
        </label>
        <textarea id="memo" name="memo" rows={2} className={inputClass} />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">비교 기간</legend>
        <div className="mt-1.5 flex flex-wrap items-center gap-4">
          {(["3", "5", "7"] as const).map((value) => (
            <label key={value} className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="radio"
                name="periodChoice"
                value={value}
                checked={periodChoice === value}
                onChange={() => setPeriodChoice(value)}
              />
              {value}일
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-sm text-gray-700">
            <input
              type="radio"
              name="periodChoice"
              value="custom"
              checked={periodChoice === "custom"}
              onChange={() => setPeriodChoice("custom")}
            />
            직접 입력
            <input
              type="number"
              name="customPeriodDays"
              min={1}
              disabled={periodChoice !== "custom"}
              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
            일
          </label>
        </div>
      </fieldset>

      {state.status === "success" ? <p className="text-sm font-medium text-green-600">{state.message}</p> : null}
      {state.status === "error" ? <p className="text-sm font-medium text-red-600">{state.message}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
          isPending && "cursor-not-allowed opacity-60"
        )}
      >
        {isPending ? "등록 중..." : "등록"}
      </button>
    </form>
  );
}
