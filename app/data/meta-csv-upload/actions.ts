"use server";

import { revalidatePath } from "next/cache";
import { processMetaReportFile } from "@/lib/meta/process-report-file";

export interface UploadActionResult {
  ok: boolean;
  message: string;
  detail?: {
    fileName: string;
    reportStartDate: string | null;
    reportEndDate: string | null;
    rowCount: number;
    insertedCount: number;
    updatedCount: number;
    skippedCount: number;
  };
}

function describeStatus(status: string, errorMessage?: string | null): string {
  switch (status) {
    case "success":
      return "Meta 광고 보고서를 정상적으로 가져왔습니다.";
    case "partial":
      return "일부 행을 제외하고 정상적으로 가져왔습니다.";
    case "duplicate":
      return "이미 처리된 파일입니다.";
    case "unsupported":
      return errorMessage ?? "지원하지 않는 파일 형식입니다.";
    case "failed":
    default:
      return errorMessage ?? "파일 처리 중 오류가 발생했습니다.";
  }
}

export async function uploadMetaCsvAction(formData: FormData): Promise<UploadActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "파일을 선택해주세요." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const record = await processMetaReportFile({
      buffer,
      fileName: file.name,
      mimeType: file.type,
      sourceType: "manual",
    });

    revalidatePath("/data/meta-csv-upload");
    revalidatePath("/data/meta-sync");

    return {
      ok: record.status === "success" || record.status === "partial",
      message: describeStatus(record.status, record.error_message),
      detail: {
        fileName: record.file_name ?? file.name,
        reportStartDate: record.report_start_date ?? null,
        reportEndDate: record.report_end_date ?? null,
        rowCount: record.row_count,
        insertedCount: record.inserted_count,
        updatedCount: record.updated_count,
        skippedCount: record.skipped_count,
      },
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "업로드 처리 중 오류가 발생했습니다.",
    };
  }
}
