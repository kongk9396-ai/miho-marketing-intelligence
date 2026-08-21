import "server-only";
import { google } from "googleapis";
import { saveGmailCredentials } from "@/lib/meta/repository";

export const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// Derived from googleapis' own bundled auth library rather than importing
// `google-auth-library` directly — googleapis vendors its own nested copy,
// and a separately installed copy at a different version is a structurally
// distinct type even when both are OAuth2Client under the hood.
export type GmailOAuth2Client = InstanceType<typeof google.auth.OAuth2>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Gmail 환경변수(${name})가 설정되지 않았습니다.`);
  }
  return value;
}

export function createGmailOAuthClient(): GmailOAuth2Client {
  const clientId = requireEnv("GMAIL_CLIENT_ID");
  const clientSecret = requireEnv("GMAIL_CLIENT_SECRET");
  const redirectUri = requireEnv("GMAIL_REDIRECT_URI");

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGmailAuthUrl(): string {
  const client = createGmailOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
  });
}

export async function exchangeGmailAuthCode(code: string): Promise<void> {
  const client = createGmailOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "Google이 refresh token을 반환하지 않았습니다. Google 계정 설정에서 앱 연결을 해제한 뒤 다시 시도해주세요."
    );
  }

  client.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: client });
  const profile = await gmail.users.getProfile({ userId: "me" });

  await saveGmailCredentials({
    emailAddress: profile.data.emailAddress ?? null,
    accessToken: tokens.access_token ?? null,
    refreshToken: tokens.refresh_token,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    scope: tokens.scope ?? null,
  });
}
