import { getMissingSheetsEnvVars, isSheetsConfigured, listSheetTabNames } from "@/lib/leads-sync/sheets-client";

export type SheetsErrorCategory =
  | "missing_env"
  | "auth_failed"
  | "permission_denied"
  | "api_disabled"
  | "not_found"
  | "request_failed";

export interface SheetsCategorizedError {
  category: SheetsErrorCategory;
  message: string;
}

function redactSecrets(message: string): string {
  return message.replace(/-----BEGIN[\s\S]*?-----END[^-]*-----/g, "[REDACTED]");
}

/** Maps a Google Sheets API failure to a category the UI distinguishes — mirrors lib/ga4/errors.ts. */
export function categorizeSheetsError(err: unknown): SheetsCategorizedError {
  const missing = getMissingSheetsEnvVars();
  if (missing.length > 0) {
    return { category: "missing_env", message: `환경변수 누락: ${missing.join(", ")}` };
  }

  const rawMessage = err instanceof Error ? err.message : String(err);
  const message = redactSecrets(rawMessage);
  const code = (err as { code?: number } | null)?.code;

  if (code === 404 || /Unable to parse range|not found/i.test(message)) {
    return {
      category: "not_found",
      message: "시트를 찾을 수 없습니다. 스프레드시트 ID와 시트 이름을 확인해주세요.",
    };
  }

  // Google returns this as a 403 too, so it must be checked before the
  // generic "no access to this sheet" 403 branch below — otherwise a
  // not-yet-enabled API reads as a sharing problem, which sends the user to
  // fix the wrong thing.
  if (/SERVICE_DISABLED|has not been used in project|API.*(is )?disabled/i.test(message)) {
    return {
      category: "api_disabled",
      message: "Google Sheets API가 비활성화되어 있습니다. Google Cloud Console에서 활성화해주세요.",
    };
  }

  if (code === 403 || /permission|forbidden|does not have access/i.test(message)) {
    return {
      category: "permission_denied",
      message: "서비스 계정에 이 스프레드시트 접근 권한이 없습니다. 시트를 서비스 계정 이메일과 공유해주세요.",
    };
  }

  if (code === 401 || /invalid_grant|invalid_client|Invalid JWT|DECODER routines/i.test(message)) {
    return {
      category: "auth_failed",
      message: "Google 인증에 실패했습니다. GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY 값을 확인해주세요.",
    };
  }

  return { category: "request_failed", message: `Google Sheets 요청에 실패했습니다: ${message}` };
}

export interface SheetsConnectionTestResult {
  ok: boolean;
  category?: SheetsErrorCategory;
  error?: string;
  sheetNames?: string[];
}

/** Simplest possible request that proves both auth and spreadsheet access work: list its tab names. */
export async function testSheetsConnection(): Promise<SheetsConnectionTestResult> {
  if (!isSheetsConfigured()) {
    return {
      ok: false,
      category: "missing_env",
      error: `환경변수 누락: ${getMissingSheetsEnvVars().join(", ")}`,
    };
  }

  try {
    const sheetNames = await listSheetTabNames();
    return { ok: true, sheetNames };
  } catch (err) {
    const { category, message } = categorizeSheetsError(err);
    return { ok: false, category, error: message };
  }
}
