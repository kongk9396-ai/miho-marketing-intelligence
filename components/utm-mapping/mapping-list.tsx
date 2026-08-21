"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { removeUtmMappingAction } from "@/app/data/utm-mapping/actions";
import { formatKoreanDateTime } from "@/lib/date/kst";
import { cn } from "@/lib/utils";
import type { UtmMappingRecord } from "@/lib/utm-mapping/types";

interface MappingListProps {
  mappings: UtmMappingRecord[];
}

export function MappingList({ mappings }: MappingListProps) {
  const [isPending, startTransition] = useTransition();

  const columns: DataTableColumn<UtmMappingRecord>[] = [
    { key: "campaign_name", header: "캠페인 (Meta)" },
    { key: "ad_name", header: "광고 (Meta)" },
    { key: "utm_campaign", header: "utm_campaign" },
    { key: "utm_content", header: "utm_content" },
    { key: "updated_at", header: "수정 시각", render: (row) => formatKoreanDateTime(row.updated_at) },
    {
      key: "action",
      header: "",
      render: (row) => (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await removeUtmMappingAction(row.id);
            })
          }
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline",
            isPending && "cursor-not-allowed opacity-60"
          )}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          삭제
        </button>
      ),
    },
  ];

  return (
    <DataTable
      title="등록된 UTM 매핑"
      columns={columns}
      data={mappings}
      getRowKey={(row) => row.id}
      emptyMessage="아직 등록된 UTM 매핑이 없습니다."
    />
  );
}
