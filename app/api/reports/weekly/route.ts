import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { buildWeeklyReport } from "@/lib/reports/weekly";
import { upsertAnalysisReport } from "@/lib/reports/repository";
import { toKstDateOnly } from "@/lib/date/kst";

export const dynamic = "force-dynamic";

/**
 * Render Cron Job target. Requires `Authorization: Bearer <CRON_SECRET>`.
 * Generates the report for the most recently completed Monday-Sunday (KST)
 * week. The run schedule is configured in Render's Cron Job config, not here.
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const today = toKstDateOnly(new Date().toISOString());
    const payload = await buildWeeklyReport(today);
    await upsertAnalysisReport({
      report_type: "weekly",
      start_date: payload.period.start,
      end_date: payload.period.end,
      summary: payload.summaryText,
      metrics_json: payload,
    });
    return NextResponse.json({ status: "success", period: payload.period });
  } catch (err) {
    const message = err instanceof Error ? err.message : "주간 보고 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
