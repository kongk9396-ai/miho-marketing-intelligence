import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string | number;
  emptyMessage?: string;
  title?: string;
}

const alignClass: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "아직 데이터가 없습니다.",
  title,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {title ? (
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500",
                    alignClass[column.align ?? "left"]
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-center text-sm text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={getRowKey(row, index)} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-5 py-3 text-gray-700",
                        alignClass[column.align ?? "left"]
                      )}
                    >
                      {column.render
                        ? column.render(row)
                        : (row as Record<string, ReactNode>)[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
