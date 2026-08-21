"use server";

import { revalidatePath } from "next/cache";
import { testGa4Connection } from "@/lib/ga4/report";
import { runGa4Sync } from "@/lib/ga4/sync-engine";

export interface Ga4SyncActionResult {
  ok: boolean;
  message: string;
}

export async function runManualGa4SyncAction(): Promise<Ga4SyncActionResult> {
  const result = await runGa4Sync();
  revalidatePath("/data/ga4-sync");
  revalidatePath("/funnel/landing");
  revalidatePath("/");
  return { ok: result.status === "success", message: result.message };
}

export async function testGa4ConnectionAction(): Promise<Ga4SyncActionResult> {
  const result = await testGa4Connection();
  if (!result.ok) {
    return { ok: false, message: result.error ?? "연결 테스트에 실패했습니다." };
  }
  const sample = result.sample
    ? ` (최근 7일: 활성 사용자 ${result.sample.activeUsers}명, 세션 ${result.sample.sessions}건)`
    : "";
  return { ok: true, message: `GA4 연결이 정상입니다.${sample}` };
}
