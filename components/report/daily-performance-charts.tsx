"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailyPoint = {
  date: string;
  spend: number;
  db: number;
  validDb: number;
  bookings: number;
  cpa: number | null;
};

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function ChartCard({
  title,
  data,
  dataKey,
  formatter,
}: {
  title: string;
  data: DailyPoint[];
  dataKey: "spend" | "db" | "cpa";
  formatter: (value: number) => string;
}) {
  const chartData = data.map((row) => ({
    ...row,
    label: formatDate(row.date),
    cpa: row.cpa ?? undefined,
  }));

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

      <div className="mt-4 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={11} />
            <YAxis
              fontSize={11}
              tickFormatter={(value) =>
                dataKey === "db"
                  ? Number(value).toLocaleString("ko-KR")
                  : `${Math.round(Number(value) / 1000)}k`
              }
            />
            <Tooltip
              formatter={(value) => [
                formatter(Number(value)),
                title,
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function DailyPerformanceCharts({
  data,
}: {
  data: DailyPoint[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <ChartCard
        title="일별 광고비"
        data={data}
        dataKey="spend"
        formatter={formatWon}
      />

      <ChartCard
        title="일별 DB"
        data={data}
        dataKey="db"
        formatter={(value) => `${Math.round(value)}건`}
      />

      <ChartCard
        title="일별 CPA"
        data={data}
        dataKey="cpa"
        formatter={formatWon}
      />
    </div>
  );
}


