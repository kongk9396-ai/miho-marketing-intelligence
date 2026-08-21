"use client";

import { useActionState } from "react";
import { saveLeadsSheetConfigAction, type LeadsSyncActionResult } from "@/app/data/leads-sync/actions";
import type { LeadsSheetConfig } from "@/lib/leads-sync/types";

const OVERRIDE_FIELDS: { field: string; label: string }[] = [
  { field: "applied_at", label: "신청날짜" },
  { field: "preferred_visit_at", label: "내원희망날짜" },
  { field: "outcome_raw", label: "최종 결과" },
  { field: "consultant", label: "담당자" },
  { field: "call_result_1", label: "콜 결과 (1차)" },
  { field: "call_result_2", label: "콜 결과 (2차)" },
  { field: "call_result_3", label: "콜 결과 (3차)" },
  { field: "call_result_4", label: "콜 결과 (4차)" },
  { field: "phone", label: "연락처 (dedup 용도로만 사용, 저장 안 함)" },
  { field: "utm_source", label: "utm_source" },
  { field: "utm_medium", label: "utm_medium" },
  { field: "utm_campaign", label: "utm_campaign" },
  { field: "utm_content", label: "utm_content" },
  { field: "landing_name", label: "랜딩/유입" },
];

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const initialState: LeadsSyncActionResult = { ok: true, message: "" };

interface SheetConfigFormProps {
  existing?: LeadsSheetConfig;
}

export function SheetConfigForm({ existing }: SheetConfigFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: LeadsSyncActionResult, formData: FormData) => saveLeadsSheetConfigAction(formData),
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="sheetName">
            시트 이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="sheetName"
            name="sheetName"
            type="text"
            required
            defaultValue={existing?.sheet_name}
            placeholder="예: 코첫"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="procedureLabel">
            시술 구분
          </label>
          <input
            id="procedureLabel"
            name="procedureLabel"
            type="text"
            defaultValue={existing?.procedure_label ?? ""}
            placeholder="예: 코 첫수술"
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="enabled" defaultChecked={existing?.enabled ?? true} />
        동기화 대상에 포함
      </label>

      <div>
        <p className="text-sm font-medium text-gray-700">컬럼 매핑 (자동 인식 실패 시에만 입력)</p>
        <p className="mt-1 text-xs text-gray-500">
          비워두면 자동 인식을 사용합니다. 실제 시트의 컬럼 헤더명을 정확히 입력해주세요.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OVERRIDE_FIELDS.map(({ field, label }) => (
            <div key={field} className="flex items-center gap-2">
              <input type="hidden" name="overrideField" value={field} />
              <label className="w-40 shrink-0 text-xs text-gray-500">{label}</label>
              <input
                type="text"
                name="overrideHeader"
                defaultValue={existing?.column_overrides?.[field] ?? ""}
                className="block w-full rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {state.message ? (
        <p className={state.ok ? "text-sm font-medium text-green-600" : "text-sm font-medium text-red-600"}>
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "저장 중..." : "시트 설정 저장"}
      </button>
    </form>
  );
}
