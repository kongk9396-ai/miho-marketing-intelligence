"use client";

import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";

interface SpendTrendPoint {
  date: string;
  label: string;
  spend: number;
  leadsCount: number;
}

interface SpendTrendChartProps {
  data: SpendTrendPoint[];
}

export function SpendTrendChart({ data }: SpendTrendChartProps) {
  return (
    <ChartContainer title="광고비 & DB" description="최근 7일간 날짜별 광고비와 DB(리드) 수">
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          yAxisId="spend"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(value: number) => `${Math.round(value / 1000).toLocaleString("ko-KR")}천`}
        />
        <YAxis
          yAxisId="leadsCount"
          orientation="right"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={32}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            borderColor: "#e5e7eb",
            fontSize: 12,
          }}
        />
        <Line
          yAxisId="spend"
          type="monotone"
          dataKey="spend"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          name="광고비(원)"
        />
        <Line
          yAxisId="leadsCount"
          type="monotone"
          dataKey="leadsCount"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="DB 수"
        />
      </LineChart>
    </ChartContainer>
  );
}
