export type Ga4ErrorCategory =
  | "missing_env"
  | "auth_failed"
  | "permission_denied"
  | "api_disabled"
  | "request_failed";

export interface Ga4CategorizedError {
  category: Ga4ErrorCategory;
  message: string;
}

/**
 * Strips anything that looks like PEM key material before an error message
 * is ever surfaced to a log or the UI. Google's API never echoes the key
 * back, but this is defense in depth against a message that happens to
 * contain env-var content (e.g. a client library dumping its input).
 */
function redactSecrets(message: string): string {
  return message.replace(/-----BEGIN[\s\S]*?-----END[^-]*-----/g, "[REDACTED]");
}

/**
 * Maps a GA4 Data API failure to one of the categories the UI distinguishes,
 * based only on what the caught error itself says — not on re-reading
 * process.env, so this stays correct for errors coming from injected/mocked
 * fetch functions (as in tests) that never touched real env vars.
 */
export function categorizeGa4Error(err: unknown): Ga4CategorizedError {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const message = redactSecrets(rawMessage);
  const code = (err as { code?: number } | null)?.code;

  const missingEnvMatch = message.match(/GA4 환경변수\(([^)]+)\)가 설정되지 않았습니다/);
  if (missingEnvMatch) {
    return { category: "missing_env", message: `환경변수 누락: ${missingEnvMatch[1]}` };
  }

  if (/SERVICE_DISABLED|has not been used in project|Analytics Data API.*disabled|API.*not enabled/i.test(message)) {
    return {
      category: "api_disabled",
      message: "Google Analytics Data API가 비활성화되어 있습니다. Google Cloud Console에서 활성화해주세요.",
    };
  }

  if (
    code === 7 ||
    /PERMISSION_DENIED|does not have (sufficient|the required) permission|User does not have/i.test(message)
  ) {
    return {
      category: "permission_denied",
      message: "서비스 계정에 GA4 속성 접근 권한이 없습니다. GA4 관리 > 속성 액세스 관리에서 서비스 계정 이메일을 뷰어로 추가해주세요.",
    };
  }

  if (
    code === 16 ||
    /UNAUTHENTICATED|invalid_grant|invalid_client|Invalid JWT|DECODER routines|error:1E08010C|Wrong number of segments/i.test(
      message
    )
  ) {
    return {
      category: "auth_failed",
      message: "GA4 인증에 실패했습니다. GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY 값을 확인해주세요.",
    };
  }

  return { category: "request_failed", message: `GA4 API 요청에 실패했습니다: ${message}` };
}
