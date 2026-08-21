import { Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { deleteLeadsSheetConfigAction } from "@/app/data/leads-sync/actions";
import type { LeadsSheetConfig } from "@/lib/leads-sync/types";

interface SheetConfigListProps {
  configs: LeadsSheetConfig[];
}

export function SheetConfigList({ configs }: SheetConfigListProps) {
  if (configs.length === 0) {
    return <p className="text-sm text-gray-400">등록된 시트가 없습니다. 아래에서 추가해주세요.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
      {configs.map((config) => (
        <li key={config.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {config.sheet_name}
              {config.procedure_label ? ` · ${config.procedure_label}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {Object.keys(config.column_overrides ?? {}).length > 0
                ? `수동 매핑 ${Object.keys(config.column_overrides).length}개 설정됨`
                : "자동 인식 사용 중"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge label={config.enabled ? "동기화 대상" : "비활성"} variant={config.enabled ? "success" : "neutral"} />
            <form action={deleteLeadsSheetConfigAction.bind(null, config.id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                삭제
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
