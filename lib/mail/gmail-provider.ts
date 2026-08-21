import "server-only";
import { google, gmail_v1 } from "googleapis";
import { createGmailOAuthClient } from "@/lib/mail/gmail-oauth";
import { getGmailCredentials, updateGmailAccessToken } from "@/lib/meta/repository";
import { detectAttachmentKind } from "@/lib/meta/parser";
import type {
  MailAttachmentRef,
  MailConnectionTestResult,
  MailProvider,
  MetaReportSearchCriteria,
} from "@/lib/mail/types";

export class GmailAuthRequiredError extends Error {
  constructor() {
    super("Gmail 연결이 필요합니다.");
    this.name = "GmailAuthRequiredError";
  }
}

export class GmailProvider implements MailProvider {
  private async getAuthorizedClient() {
    const credentials = await getGmailCredentials();
    if (!credentials) return null;

    const client = createGmailOAuthClient();
    client.setCredentials({
      refresh_token: credentials.refreshToken,
      access_token: credentials.accessToken ?? undefined,
      expiry_date: credentials.tokenExpiry
        ? new Date(credentials.tokenExpiry).getTime()
        : undefined,
    });

    // googleapis auto-refreshes the access token as needed; persist the
    // refreshed token so the next request doesn't have to refresh again.
    client.on("tokens", (tokens) => {
      if (tokens.access_token) {
        void updateGmailAccessToken({
          accessToken: tokens.access_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        });
      }
    });

    return client;
  }

  async isConnected(): Promise<boolean> {
    const credentials = await getGmailCredentials();
    return credentials !== null;
  }

  async testConnection(): Promise<MailConnectionTestResult> {
    const client = await this.getAuthorizedClient();
    if (!client) {
      return { ok: false, error: "Gmail 연결이 필요합니다." };
    }

    try {
      const gmail = google.gmail({ version: "v1", auth: client });
      const profile = await gmail.users.getProfile({ userId: "me" });
      return { ok: true, emailAddress: profile.data.emailAddress ?? undefined };
    } catch (err) {
      return { ok: false, error: toErrorMessage(err) };
    }
  }

  async findMetaReportEmails(criteria: MetaReportSearchCriteria): Promise<MailAttachmentRef[]> {
    const client = await this.getAuthorizedClient();
    if (!client) throw new GmailAuthRequiredError();

    const gmail = google.gmail({ version: "v1", auth: client });
    const query = buildSearchQuery(criteria);

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 50,
    });

    const messages = listResponse.data.messages ?? [];
    const refs: MailAttachmentRef[] = [];

    for (const message of messages) {
      if (!message.id) continue;

      const full = await gmail.users.messages.get({ userId: "me", id: message.id });
      const parts = full.data.payload?.parts ?? [];

      for (const part of collectAttachmentParts(parts)) {
        if (!part.filename || !part.body?.attachmentId) continue;

        const kind = detectAttachmentKind(part.filename, part.mimeType ?? undefined);
        if (!kind || !criteria.allowedExtensions.includes(kind)) continue;

        refs.push({
          messageId: message.id,
          attachmentId: part.body.attachmentId,
          fileName: part.filename,
          mimeType: part.mimeType ?? "application/octet-stream",
          size: part.body.size ?? 0,
        });
      }
    }

    return refs;
  }

  async downloadAttachment(ref: MailAttachmentRef): Promise<Buffer> {
    const client = await this.getAuthorizedClient();
    if (!client) throw new GmailAuthRequiredError();

    const gmail = google.gmail({ version: "v1", auth: client });
    const response = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: ref.messageId,
      id: ref.attachmentId,
    });

    const data = response.data.data;
    if (!data) {
      throw new Error("첨부파일 데이터를 가져오지 못했습니다.");
    }

    return Buffer.from(data, "base64url");
  }
}

function collectAttachmentParts(
  parts: gmail_v1.Schema$MessagePart[]
): gmail_v1.Schema$MessagePart[] {
  const result: gmail_v1.Schema$MessagePart[] = [];
  for (const part of parts) {
    if (part.filename) result.push(part);
    if (part.parts) result.push(...collectAttachmentParts(part.parts));
  }
  return result;
}

/** Gmail's `newer_than` operator only supports day granularity. */
function buildSearchQuery(criteria: MetaReportSearchCriteria): string {
  const days = Math.max(1, Math.ceil(criteria.lookbackHours / 24));
  const clauses = ["has:attachment", `newer_than:${days}d`];

  if (criteria.subjectKeywords.length > 0) {
    const subjectClause = criteria.subjectKeywords
      .map((kw) => `subject:"${kw.replace(/"/g, "")}"`)
      .join(" OR ");
    clauses.push(`(${subjectClause})`);
  }

  return clauses.join(" ");
}

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
