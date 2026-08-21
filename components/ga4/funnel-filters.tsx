"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Ga4CampaignContentOption } from "@/lib/ga4/repository";

interface FunnelFiltersProps {
  options: Ga4CampaignContentOption[];
}

const selectClass =
  "rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function FunnelFilters({ options }: FunnelFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaign = searchParams.get("campaign") ?? "";
  const content = searchParams.get("content") ?? "";

  const campaigns = [...new Set(options.map((o) => o.campaign))];
  const contents = [...new Set(options.filter((o) => !campaign || o.campaign === campaign).map((o) => o.content))];

  function updateParam(key: "campaign" | "content", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "campaign") params.delete("content");
    router.push(`/funnel/landing?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={campaign}
        onChange={(e) => updateParam("campaign", e.target.value)}
        className={selectClass}
      >
        <option value="">전체 캠페인 (UTM)</option>
        {campaigns.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select value={content} onChange={(e) => updateParam("content", e.target.value)} className={selectClass}>
        <option value="">전체 광고 (UTM content)</option>
        {contents.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
