"use client";

import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
  title: string;
  description?: string;
  height?: number;
  children: ReactElement;
}

export function ChartContainer({
  title,
  description,
  height = 280,
  children,
}: ChartContainerProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          ) : null}
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
