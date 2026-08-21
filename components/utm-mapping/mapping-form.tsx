"use client";

import { useActionState, useMemo, useState } from "react";
import { saveUtmMappingAction, type UtmMappingActionResult } from "@/app/data/utm-mapping/actions";
import type { AdHierarchyRow } from "@/lib/creative-changes/repository";
import type { Ga4CampaignContentOption } from "@/lib/ga4/repository";
import { cn } from "@/lib/utils";

interface MappingFormProps {
  hierarchy: AdHierarchyRow[];
  ga4Options: Ga4CampaignContentOption[];
}

const initialState: UtmMappingActionResult = { ok: true, message: "" };

const inputClass =
  "mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function MappingForm({ hierarchy, ga4Options }: MappingFormProps) {
  const [state, formAction, isPending] = useActionState(saveUtmMappingAction, initialState);

  const [campaignId, setCampaignId] = useState("");
  const [adId, setAdId] = useState("");

  const campaigns = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of hierarchy) {
      if (row.campaignId) map.set(row.campaignId, row.campaignName ?? row.campaignId);
    }
    return [...map.entries()];
  }, [hierarchy]);

  const ads = useMemo(
    () => hierarchy.filter((row) => !campaignId || row.campaignId === campaignId),
    [hierarchy, campaignId]
  );

  const selectedAd = hierarchy.find((row) => row.adId === adId) ?? null;
  const campaignNames = [...new Set(ga4Options.map((o) => o.campaign))];
  const contentNames = [...new Set(ga4Options.map((o) => o.content))];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="campaignName" value={selectedAd?.campaignName ?? ""} />
      <input type="hidden" name="adName" value={selectedAd?.adName ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="campaign-select">
            캠페인 (Meta)
          </label>
          <select
            id="campaign-select"
            className={inputClass}
            value={campaignId}
            onChange={(e) => {
              setCampaignId(e.target.value);
              setAdId("");
            }}
          >
            <option value="">선택</option>
            {campaigns.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="ad-select">
            광고 (Meta)
          </label>
          <select id="ad-select" className={inputClass} value={adId} onChange={(e) => setAdId(e.target.value)}>
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
          <label className="block text-sm font-medium text-gray-700" htmlFor="utmCampaign">
            GA4 utm_campaign
          </label>
          <input id="utmCampaign" name="utmCampaign" list="utm-campaign-options" className={inputClass} />
          <datalist id="utm-campaign-options">
            {campaignNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="utmContent">
            GA4 utm_content
          </label>
          <input id="utmContent" name="utmContent" list="utm-content-options" className={inputClass} />
          <datalist id="utm-content-options">
            {contentNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !selectedAd}
          className={cn(
            "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
            (isPending || !selectedAd) && "cursor-not-allowed opacity-60"
          )}
        >
          {isPending ? "저장 중..." : "매핑 저장"}
        </button>
        {state.message ? (
          <p className={cn("text-sm", state.ok ? "text-green-600" : "text-red-600")}>{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
