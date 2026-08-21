"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PeriodPreset } from "@/lib/leads-analysis/period";

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "오늘" },
  { value: "7d", label: "최근 7일" },
  { value: "30d", label: "최근 30일" },
  { value: "custom", label: "사용자 지정" },
];

interface PeriodFilterProps {
  basePath: string;
}

export function PeriodFilter({ basePath }: PeriodFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preset = (searchParams.get("period") as PeriodPreset) || "7d";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  function setPreset(value: PeriodPreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    if (value !== "custom") {
      params.delete("start");
      params.delete("end");
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  function setCustomRange(key: "start" | "end", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPreset(p.value)}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              preset === p.value ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === "custom" ? (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={start}
            onChange={(e) => setCustomRange("start", e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
          <span className="text-gray-400">~</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setCustomRange("end", e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
        </div>
      ) : null}
    </div>
  );
}
