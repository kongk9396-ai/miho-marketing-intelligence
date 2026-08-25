"use client";

import { useActionState } from "react";
import { registerLandingChangeAction, updateLandingChangeAction } from "@/app/changes/landing/actions";
import { initialRegisterLandingChangeState } from "@/app/changes/landing/action-state";
import { LANDING_CHANGE_TYPE_LABELS } from "@/lib/landing-changes/change-type-labels";
import { LANDING_CHANGE_TYPES, type LandingChangeRecord } from "@/lib/landing-changes/types";
import { cn } from "@/lib/utils";

interface RegisterLandingChangeFormProps {
  landingPages: string[];
  campaignNames: string[];
  initialChange?: LandingChangeRecord | null;
}

const inputClass =
  "mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function RegisterLandingChangeForm({ landingPages, campaignNames, initialChange = null }: RegisterLandingChangeFormProps) {
  const action = initialChange
    ? updateLandingChangeAction
    : registerLandingChangeAction;

  const [state, formAction, isPending] = useActionState(
    action,
    initialRegisterLandingChangeState
  );

  const selectedCampaigns = (() => {
    if (!initialChange?.linked_campaign_name) return [];

    try {
      const parsed = JSON.parse(initialChange.linked_campaign_name);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}

    return [initialChange.linked_campaign_name];
  })();

  return (
    <form action={formAction} className="space-y-4">
      {initialChange ? (
        <input type="hidden" name="id" value={initialChange.id} />
      ) : null}
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
            defaultValue={initialChange?.landing_name ?? ""}
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
            defaultValue={initialChange?.landing_page_pattern ?? ""}
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
        <p className="block text-sm font-medium text-gray-700">
          연결 캠페인
        </p>
        <p className="mt-1 text-xs text-gray-500">
          이 랜딩으로 유입되는 캠페인을 모두 선택하세요. 여러 개 선택 가능합니다.
        </p>

        <div className="mt-2 grid gap-2 rounded-md border border-gray-200 p-3 sm:grid-cols-2">
          {campaignNames.map((name) => (
            <label key={name} className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="linkedCampaignNames"
                value={name}
                defaultChecked={selectedCampaigns.includes(name)}
                className="mt-0.5"
              />
              <span>{name}</span>
            </label>
          ))}

          {campaignNames.length === 0 ? (
            <p className="text-sm text-gray-400">선택 가능한 캠페인이 없습니다.</p>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="changedAt">
            변경 일시 <span className="text-red-500">*</span>
          </label>
          <input
            id="changedAt"
            name="changedAt"
            type="datetime-local"
            required
            defaultValue={
              initialChange
                ? new Intl.DateTimeFormat("sv-SE", {
                    timeZone: "Asia/Seoul",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                    .format(new Date(initialChange.changed_at))
                    .replace(" ", "T")
                : ""
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="changeType">
            변경 유형 <span className="text-red-500">*</span>
          </label>
          <select
            id="changeType"
            name="changeType"
            required
            className={inputClass}
            defaultValue={initialChange?.change_type ?? ""}
          >
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
          <input id="oldVersion" name="oldVersion" type="text" className={inputClass} defaultValue={initialChange?.old_version ?? ""} placeholder="예: v1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="newVersion">
            신규 버전명
          </label>
          <input id="newVersion" name="newVersion" type="text" className={inputClass} defaultValue={initialChange?.new_version ?? ""} placeholder="예: v2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="memo">
          메모
        </label>
        <textarea id="memo" name="memo" rows={2} className={inputClass} defaultValue={initialChange?.memo ?? ""} />
      </div>

      <input type="hidden" name="periodChoice" value="5" />
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
        {isPending ? (initialChange ? "수정 중..." : "등록 중...") : (initialChange ? "수정 저장" : "등록")}
      </button>
    </form>
  );
}







