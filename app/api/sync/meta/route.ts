import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runMetaSync } from "@/lib/meta/sync-engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const result = await runMetaSync({ trigger: "cron" });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "동기화 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
