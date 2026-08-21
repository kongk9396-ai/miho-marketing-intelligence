"use server";

import { revalidatePath } from "next/cache";
import { GmailProvider } from "@/lib/mail/gmail-provider";
import { updateMetaSyncSettings } from "@/lib/meta/repository";
import { runMetaSync } from "@/lib/meta/sync-engine";

export interface SyncActionResult {
  ok: boolean;
  message: string;
}

/**
 * "지금 동기화" button target. This is a Server Action, not a public HTTP
 * endpoint — it can only be invoked through this page's own form submission,
 * so it needs no bearer-token check the way /api/sync/meta does.
 */
export async function runManualMetaSyncAction(): Promise<SyncActionResult> {
  try {
    const result = await runMetaSync({ trigger: "manual" });
    revalidatePath("/data/meta-sync");
    return {
      ok: result.status === "ok" || result.status === "no_new_reports",
      message: result.message,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "동기화 중 오류가 발생했습니다.",
    };
  }
}

export async function testGmailConnectionAction(): Promise<SyncActionResult> {
  const provider = new GmailProvider();
  const result = await provider.testConnection();
  return {
    ok: result.ok,
    message: result.ok
      ? `연결이 정상입니다. (${result.emailAddress ?? "알 수 없음"})`
      : (result.error ?? "연결 테스트에 실패했습니다."),
  };
}

export async function updateMetaSyncSettingsAction(formData: FormData): Promise<SyncActionResult> {
  try {
    const subjectKeywords = String(formData.get("subjectKeywords") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const lookbackHours = Number(formData.get("lookbackHours"));
    const allowedExtensions = formData.getAll("allowedExtensions").map(String);
    const autoSyncEnabled = formData.get("autoSyncEnabled") === "on";

    await updateMetaSyncSettings({
      subjectKeywords: subjectKeywords.length > 0 ? subjectKeywords : undefined,
      lookbackHours: Number.isFinite(lookbackHours) && lookbackHours > 0 ? lookbackHours : undefined,
      allowedExtensions: allowedExtensions.length > 0 ? allowedExtensions : undefined,
      autoSyncEnabled,
    });

    revalidatePath("/data/meta-sync");
    return { ok: true, message: "수집 설정이 저장되었습니다." };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "설정 저장에 실패했습니다.",
    };
  }
}
