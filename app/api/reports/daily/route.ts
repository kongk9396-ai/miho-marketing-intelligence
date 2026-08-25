import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { buildDailyReport } from "@/lib/reports/daily";
import { upsertAnalysisReport } from "@/lib/reports/repository";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";

export const dynamic = "force-dynamic";

/**
 * Render Cron Job target. Requires `Authorization: Bearer <CRON_SECRET>`.
 * Generates the report for 전일(KST) by default. The actual run time is
 * configured in Render's Cron Job config, not hardcoded here — the real
 * Meta 예약메일 arrival time hasn't been confirmed yet (spec section 23).
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const date = addDaysToDateOnly(toKstDateOnly(new Date().toISOString()), -1);
    const payload = await buildDailyReport(date);
    await upsertAnalysisReport({
      report_type: "daily",
      start_date: date,
      end_date: date,
      summary: payload.summaryText,
      metrics_json: payload,
    });
    return NextResponse.json({ status: "success", date });
  } catch (err) {
    const message = err instanceof Error ? err.message : "일일 보고 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
