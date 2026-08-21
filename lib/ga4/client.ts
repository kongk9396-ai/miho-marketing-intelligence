import "server-only";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`GA4 환경변수(${name})가 설정되지 않았습니다.`);
  }
  return value;
}

export function isGa4Configured(): boolean {
  return Boolean(
    process.env.GA4_PROPERTY_ID && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
  );
}

/** Which required env var(s) are missing, or [] if fully configured. */
export function getMissingGa4EnvVars(): string[] {
  return ["GA4_PROPERTY_ID", "GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY"].filter((name) => !process.env[name]);
}

export function getGa4PropertyId(): string {
  return requireEnv("GA4_PROPERTY_ID");
}

/**
 * Service-account auth via explicit credentials (not a keyfile path), the
 * pattern that works on Render where there's no persistent filesystem to
 * store a credentials JSON. The private key env var stores literal `\n`
 * sequences (multi-line PEM collapsed to one line) and must be unescaped.
 */
export function createGa4Client(): BetaAnalyticsDataClient {
  const clientEmail = requireEnv("GOOGLE_CLIENT_EMAIL");
  const privateKey = requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}
