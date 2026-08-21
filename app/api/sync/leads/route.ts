import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runLeadsSync } from "@/lib/leads-sync/sync-engine";

export const dynamic = "force-dynamic";

/**
 * Render Cron Job target. Requires `Authorization: Bearer <CRON_SECRET>`,
 * same shared-secret pattern as /api/sync/meta and /api/sync/ga4. Reads
 * every enabled configured Google Sheet and upserts leads — safe to call
 * repeatedly (idempotent on lead_key).
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const result = await runLeadsSync();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "동기화 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
