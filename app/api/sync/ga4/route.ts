import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runGa4Sync } from "@/lib/ga4/sync-engine";

export const dynamic = "force-dynamic";

/**
 * Render Cron Job target. Requires `Authorization: Bearer <CRON_SECRET>`.
 * Collects yesterday's GA4 data by default; the schedule lives in Render's
 * Cron Job config, not in this code.
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const result = await runGa4Sync();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "동기화 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
