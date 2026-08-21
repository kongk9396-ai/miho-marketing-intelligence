import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MailAttachmentRef, MailConnectionTestResult, MailProvider, MetaReportSearchCriteria } from "@/lib/mail/types";
import type { MetaSyncSettings } from "@/lib/meta/types";

vi.mock("@/lib/meta/repository", () => ({
  getMetaSyncSettings: vi.fn(),
  recordImportHistory: vi.fn(),
  findImportHistoryByMessageAttachment: vi.fn(),
  findSuccessfulImportByFileHash: vi.fn(),
  upsertMetaDailyRows: vi.fn(),
}));

import { getMetaSyncSettings, recordImportHistory } from "@/lib/meta/repository";
import { runMetaSync } from "@/lib/meta/sync-engine";

const DEFAULT_SETTINGS: MetaSyncSettings = {
  subjectKeywords: ["Meta 광고 보고서"],
  lookbackHours: 48,
  allowedExtensions: ["csv", "xlsx"],
  autoSyncEnabled: true,
};

class FakeMailProvider implements MailProvider {
  constructor(
    private connected: boolean,
    private attachments: MailAttachmentRef[] = []
  ) {}

  async isConnected(): Promise<boolean> {
    return this.connected;
  }

  async testConnection(): Promise<MailConnectionTestResult> {
    return this.connected ? { ok: true, emailAddress: "test@example.com" } : { ok: false, error: "연결 필요" };
  }

  async findMetaReportEmails(criteria: MetaReportSearchCriteria): Promise<MailAttachmentRef[]> {
    void criteria;
    return this.attachments;
  }

  async downloadAttachment(): Promise<Buffer> {
    throw new Error("not used in this test");
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMetaSyncSettings).mockResolvedValue(DEFAULT_SETTINGS);
  vi.mocked(recordImportHistory).mockImplementation(async (input) => ({
    id: "history-id",
    message_id: null,
    attachment_id: null,
    file_name: null,
    file_hash: null,
    report_start_date: null,
    report_end_date: null,
    error_message: null,
    processed_at: "2026-08-20T00:00:00.000Z",
    created_at: "2026-08-20T00:00:00.000Z",
    ...input,
  }));
});

describe("runMetaSync — 새로운 보고서 없음", () => {
  it("Gmail 검색 결과가 없으면 오류 없이 no_new_reports 상태를 반환한다", async () => {
    const provider = new FakeMailProvider(true, []);

    const result = await runMetaSync({ trigger: "manual", mailProvider: provider });

    expect(result.status).toBe("no_new_reports");
    expect(result.errorCount).toBe(0);
    expect(recordImportHistory).toHaveBeenCalledWith(
      expect.objectContaining({ status: "no_new_reports", source_type: "gmail" })
    );
  });
});

describe("runMetaSync — Gmail 연결 필요", () => {
  it("Gmail이 연결되어 있지 않으면 gmail_auth_required를 반환한다", async () => {
    const provider = new FakeMailProvider(false);

    const result = await runMetaSync({ trigger: "manual", mailProvider: provider });

    expect(result.status).toBe("gmail_auth_required");
  });
});

describe("runMetaSync — 자동 수집 비활성화", () => {
  it("cron 트리거이고 자동 수집이 꺼져 있으면 실행하지 않는다", async () => {
    vi.mocked(getMetaSyncSettings).mockResolvedValue({ ...DEFAULT_SETTINGS, autoSyncEnabled: false });
    const provider = new FakeMailProvider(true, []);

    const result = await runMetaSync({ trigger: "cron", mailProvider: provider });

    expect(result.status).toBe("disabled");
    expect(recordImportHistory).not.toHaveBeenCalled();
  });
});
