"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { CHANGE_TYPE_LABELS } from "@/lib/creative-changes/change-type-labels";
import { formatKoreanMonthDay, toKstDateOnly } from "@/lib/date/kst";
import { cn } from "@/lib/utils";
import type { CreativeChangeRecord } from "@/lib/creative-changes/types";

type ValueFormat = "percent1" | "percent2" | "won";

function formatValue(format: ValueFormat, value: number): string {
  switch (format) {
    case "percent1":
      return `${value.toFixed(1)}%`;
    case "percent2":
      return `${value.toFixed(2)}%`;
    case "won":
      return `₩${Math.round(value).toLocaleString("ko-KR")}`;
  }
}

interface MetricTimelineChartProps {
  title: string;
  data: Array<{ date: string; value: number | null }>;
  markers: CreativeChangeRecord[];
  /**
   * A format kind, not a function — functions can't cross the Server ->
   * Client Component boundary as props, so formatting happens here instead
   * of via a caller-supplied callback.
   */
  valueFormat: ValueFormat;
  color?: string;
}

export function MetricTimelineChart({
  title,
  data,
  markers,
  valueFormat,
  color = "#2563eb",
}: MetricTimelineChartProps) {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) ?? null;

  return (
    <div>
      <ChartContainer title={title} height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            formatter={(value) => (typeof value === "number" ? formatValue(valueFormat, value) : String(value ?? ""))}
            contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 12 }}
          />
          {markers.map((marker) => (
            <ReferenceLine
              key={marker.id}
              x={toKstDateOnly(marker.changed_at)}
              stroke="#f59e0b"
              strokeDasharray="4 2"
            />
          ))}
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ChartContainer>

      {markers.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {markers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              onClick={() => setSelectedMarkerId(selectedMarkerId === marker.id ? null : marker.id)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
                selectedMarkerId === marker.id
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              {formatKoreanMonthDay(marker.changed_at)} {CHANGE_TYPE_LABELS[marker.change_type]}
            </button>
          ))}
        </div>
      ) : null}

      {selectedMarker ? (
        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p className="font-medium">
            {formatKoreanMonthDay(selectedMarker.changed_at)} · {CHANGE_TYPE_LABELS[selectedMarker.change_type]}
          </p>
          <p className="mt-0.5">
            {selectedMarker.old_version ?? "—"} → {selectedMarker.new_version ?? "—"}
          </p>
          {selectedMarker.memo ? <p className="mt-0.5">{selectedMarker.memo}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
