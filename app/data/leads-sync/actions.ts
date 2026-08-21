"use server";

import { revalidatePath } from "next/cache";
import { testSheetsConnection } from "@/lib/leads-sync/errors";
import { runLeadsSync } from "@/lib/leads-sync/sync-engine";
import { deleteLeadsSheetConfig, upsertLeadsSheetConfig } from "@/lib/leads-sync/repository";

export interface LeadsSyncActionResult {
  ok: boolean;
  message: string;
}

export async function runManualLeadsSyncAction(): Promise<LeadsSyncActionResult> {
  const result = await runLeadsSync();
  revalidatePath("/data/leads-sync");
  revalidatePath("/funnel/leads");
  revalidatePath("/funnel/consultation-booking");
  revalidatePath("/");
  return { ok: result.status !== "failed", message: result.message };
}

export async function testSheetsConnectionAction(): Promise<LeadsSyncActionResult> {
  const result = await testSheetsConnection();
  if (!result.ok) {
    return { ok: false, message: result.error ?? "연결 테스트에 실패했습니다." };
  }
  const sheetList = result.sheetNames && result.sheetNames.length > 0 ? ` (탭: ${result.sheetNames.join(", ")})` : "";
  return { ok: true, message: `Google Sheets 연결이 정상입니다.${sheetList}` };
}

export async function saveLeadsSheetConfigAction(formData: FormData): Promise<LeadsSyncActionResult> {
  try {
    const sheetName = String(formData.get("sheetName") ?? "").trim();
    if (!sheetName) {
      return { ok: false, message: "시트 이름을 입력해주세요." };
    }

    const procedureLabel = String(formData.get("procedureLabel") ?? "").trim();
    const enabled = formData.get("enabled") === "on";

    const overrideFields = formData.getAll("overrideField").map(String);
    const overrideHeaders = formData.getAll("overrideHeader").map(String);
    const columnOverrides: Record<string, string> = {};
    overrideFields.forEach((field, i) => {
      const header = overrideHeaders[i]?.trim();
      if (field.trim() && header) columnOverrides[field.trim()] = header;
    });

    await upsertLeadsSheetConfig({
      sheet_name: sheetName,
      procedure_label: procedureLabel || null,
      enabled,
      column_overrides: columnOverrides,
    });

    revalidatePath("/data/leads-sync");
    return { ok: true, message: "시트 설정이 저장되었습니다." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "시트 설정 저장에 실패했습니다." };
  }
}

/** Bound as a plain `<form action={...}>` target (see SheetConfigList), so it returns void rather than a result object. */
export async function deleteLeadsSheetConfigAction(id: string): Promise<void> {
  await deleteLeadsSheetConfig(id);
  revalidatePath("/data/leads-sync");
}
