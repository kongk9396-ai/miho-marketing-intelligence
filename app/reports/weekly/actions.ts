"use server";

import { revalidatePath } from "next/cache";
import { buildWeeklyReport } from "@/lib/reports/weekly";
import { upsertAnalysisReport } from "@/lib/reports/repository";
import { toKstDateOnly } from "@/lib/date/kst";
import type { GenerateReportActionState } from "@/app/reports/weekly/action-state";

/** Period: 가장 최근 완료된 월~일 (KST) — see lib/reports/period.ts. */
export async function generateWeeklyReportAction(
  // useActionState requires this signature even though the action takes no form input.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: GenerateReportActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<GenerateReportActionState> {
  const today = toKstDateOnly(new Date().toISOString());

  try {
    const payload = await buildWeeklyReport(today);
    await upsertAnalysisReport({
      report_type: "weekly",
      start_date: payload.period.start,
      end_date: payload.period.end,
      summary: payload.summaryText,
      metrics_json: payload,
    });
    revalidatePath("/reports/weekly");
    revalidatePath("/report");
    return { status: "success", message: `${payload.period.start} ~ ${payload.period.end} 주간 보고가 생성되었습니다.` };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "생성 중 오류가 발생했습니다." };
  }
}
