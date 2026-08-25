"use server";

import { revalidatePath } from "next/cache";
import { buildDailyReport } from "@/lib/reports/daily";
import { upsertAnalysisReport } from "@/lib/reports/repository";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";
import type { GenerateReportActionState } from "@/app/reports/daily/action-state";

/** Default period: 전일 00:00~23:59 KST (spec section 21), unless a specific date is passed. */
export async function generateDailyReportAction(
  _prevState: GenerateReportActionState,
  formData: FormData
): Promise<GenerateReportActionState> {
  const dateOverride = String(formData.get("date") ?? "").trim();
  const date = dateOverride || addDaysToDateOnly(toKstDateOnly(new Date().toISOString()), -1);

  try {
    const payload = await buildDailyReport(date);
    await upsertAnalysisReport({
      report_type: "daily",
      start_date: date,
      end_date: date,
      summary: payload.summaryText,
      metrics_json: payload,
    });
    revalidatePath("/reports/daily");
    revalidatePath("/report");
    return { status: "success", message: `${date} 일일 보고가 생성되었습니다.` };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "생성 중 오류가 발생했습니다." };
  }
}
