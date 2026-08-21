"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  initialRegisterChangeState,
  registerCreativeChangeAction,
} from "@/app/changes/creative/actions";
import { CHANGE_TYPE_LABELS } from "@/lib/creative-changes/change-type-labels";
import { CHANGE_TYPES } from "@/lib/creative-changes/types";
import type { AdHierarchyRow } from "@/lib/creative-changes/repository";
import { cn } from "@/lib/utils";

interface RegisterChangeFormProps {
  hierarchy: AdHierarchyRow[];
}

const inputClass =
  "mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function RegisterChangeForm({ hierarchy }: RegisterChangeFormProps) {
  const [state, formAction, isPending] = useActionState(
    registerCreativeChangeAction,
    initialRegisterChangeState
  );

  const [campaignId, setCampaignId] = useState("");
  const [adsetId, setAdsetId] = useState("");
  const [adId, setAdId] = useState("");
  const [periodChoice, setPeriodChoice] = useState<"3" | "5" | "7" | "custom">("5");

  const campaigns = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of hierarchy) {
      if (row.campaignId) map.set(row.campaignId, row.campaignName ?? row.campaignId);
    }
    return [...map.entries()];
  }, [hierarchy]);

  const adsets = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of hierarchy) {
      if (row.adsetId && (!campaignId || row.campaignId === campaignId)) {
        map.set(row.adsetId, row.adsetName ?? row.adsetId);
      }
    }
    return [...map.entries()];
  }, [hierarchy, campaignId]);

  const ads = useMemo(() => {
    return hierarchy.filter(
      (row) => (!campaignId || row.campaignId === campaignId) && (!adsetId || row.adsetId === adsetId)
    );
  }, [hierarchy, campaignId, adsetId]);

  const selectedAd = hierarchy.find((row) => row.adId === adId) ?? null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="campaignId" value={selectedAd?.campaignId ?? ""} />
      <input type="hidden" name="campaignName" value={selectedAd?.campaignName ?? ""} />
      <input type="hidden" name="adsetId" value={selectedAd?.adsetId ?? ""} />
      <input type="hidden" name="adsetName" value={selectedAd?.adsetName ?? ""} />
      <input type="hidden" name="adId" value={selectedAd?.adId ?? ""} />
      <input type="hidden" name="adName" value={selectedAd?.adName ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="campaign-select">
            캠페인
          </label>
          <select
            id="campaign-select"
            className={inputClass}
            value={campaignId}
            onChange={(e) => {
              setCampaignId(e.target.value);
              setAdsetId("");
              setAdId("");
            }}
          >
            <option value="">전체</option>
            {campaigns.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="adset-select">
            광고 세트
          </label>
          <select
            id="adset-select"
            className={inputClass}
            value={adsetId}
            onChange={(e) => {
              setAdsetId(e.target.value);
              setAdId("");
            }}
          >
            <option value="">전체</option>
            {adsets.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="ad-select">
            광고 <span className="text-red-500">*</span>
          </label>
          <select
            id="ad-select"
            className={inputClass}
            value={adId}
            onChange={(e) => setAdId(e.target.value)}
            required
          >
            <option value="">선택</option>
            {ads.map((row) => (
              <option key={row.adId} value={row.adId}>
                {row.adName ?? row.adId}
              </option>
            ))}
          </select>
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
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="changeType">
            변경 유형 <span className="text-red-500">*</span>
          </label>
          <select id="changeType" name="changeType" required className={inputClass} defaultValue="">
            <option value="" disabled>
              선택
            </option>
            {CHANGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {CHANGE_TYPE_LABELS[type]}
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

      {state.status === "conflict" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <p>{state.message}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              name="force"
              value="true"
              disabled={isPending}
              className={cn(
                "rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700",
                isPending && "cursor-not-allowed opacity-60"
              )}
            >
              그래도 등록
            </button>
          </div>
        </div>
      ) : null}

      {state.status === "success" ? (
        <p className="text-sm font-medium text-green-600">{state.message}</p>
      ) : null}
      {state.status === "error" ? (
        <p className="text-sm font-medium text-red-600">{state.message}</p>
      ) : null}

      {state.status !== "conflict" ? (
        <button
          type="submit"
          name="force"
          value="false"
          disabled={isPending}
          className={cn(
            "inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
            isPending && "cursor-not-allowed opacity-60"
          )}
        >
          {isPending ? "등록 중..." : "등록"}
        </button>
      ) : null}
    </form>
  );
}
