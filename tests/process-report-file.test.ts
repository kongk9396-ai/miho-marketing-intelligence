import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MetaImportHistoryRecord } from "@/lib/meta/types";

vi.mock("@/lib/meta/repository", () => ({
  findImportHistoryByMessageAttachment: vi.fn(),
  findSuccessfulImportByFileHash: vi.fn(),
  recordImportHistory: vi.fn(),
  upsertMetaDailyRows: vi.fn(),
}));

import {
  findImportHistoryByMessageAttachment,
  findSuccessfulImportByFileHash,
  recordImportHistory,
  upsertMetaDailyRows,
} from "@/lib/meta/repository";
import { processMetaReportFile } from "@/lib/meta/process-report-file";

const CSV = [
  "Day,Campaign name,Ad ID,Ad name,Amount spent (KRW),Impressions",
  "2026-08-20,캠페인,ad-1,광고 A,120000,5000",
  "2026-08-20,캠페인,ad-2,광고 B,98000,4200",
].join("\n");

function fakeRecord(overrides: Partial<MetaImportHistoryRecord> = {}): MetaImportHistoryRecord {
  return {
    id: "fake-id",
    source_type: "manual",
    message_id: null,
    attachment_id: null,
    file_name: "meta_report.csv",
    file_hash: "hash",
    report_start_date: null,
    report_end_date: null,
    row_count: 0,
    inserted_count: 0,
    updated_count: 0,
    skipped_count: 0,
    status: "success",
    error_message: null,
    processed_at: "2026-08-20T00:00:00.000Z",
    created_at: "2026-08-20T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findImportHistoryByMessageAttachment).mockResolvedValue(null);
  vi.mocked(findSuccessfulImportByFileHash).mockResolvedValue(null);
  vi.mocked(upsertMetaDailyRows).mockResolvedValue({ inserted: 2, updated: 0 });
  vi.mocked(recordImportHistory).mockImplementation(async (input) =>
    fakeRecord({ ...input, id: "generated-id" })
  );
});

describe("processMetaReportFile — 동일 attachment 재처리 방지", () => {
  it("이미 성공 처리된 (message_id, attachment_id)는 재처리하지 않는다", async () => {
    const existing = fakeRecord({
      source_type: "gmail",
      message_id: "msg-1",
      attachment_id: "att-1",
      status: "success",
    });
    vi.mocked(findImportHistoryByMessageAttachment).mockResolvedValue(existing);

    const result = await processMetaReportFile({
      buffer: Buffer.from(CSV, "utf-8"),
      fileName: "meta_report.csv",
      sourceType: "gmail",
      messageId: "msg-1",
      attachmentId: "att-1",
    });

    expect(result).toBe(existing);
    expect(upsertMetaDailyRows).not.toHaveBeenCalled();
    expect(recordImportHistory).not.toHaveBeenCalled();
  });

  it("이전에 실패한 attachment는 재시도한다", async () => {
    const failed = fakeRecord({
      source_type: "gmail",
      message_id: "msg-2",
      attachment_id: "att-2",
      status: "failed",
    });
    vi.mocked(findImportHistoryByMessageAttachment).mockResolvedValue(failed);

    await processMetaReportFile({
      buffer: Buffer.from(CSV, "utf-8"),
      fileName: "meta_report.csv",
      sourceType: "gmail",
      messageId: "msg-2",
      attachmentId: "att-2",
    });

    expect(upsertMetaDailyRows).toHaveBeenCalledTimes(1);
    expect(recordImportHistory).toHaveBeenCalledTimes(1);
  });
});

describe("processMetaReportFile — 동일 file hash 재처리 방지", () => {
  it("동일한 내용(파일 해시)이 이미 성공 처리되었으면 duplicate로 기록하고 저장하지 않는다", async () => {
    const existingByHash = fakeRecord({ status: "success", file_hash: "same-hash" });
    vi.mocked(findSuccessfulImportByFileHash).mockResolvedValue(existingByHash);

    const result = await processMetaReportFile({
      buffer: Buffer.from(CSV, "utf-8"),
      fileName: "meta_report_resent.csv",
      sourceType: "manual",
    });

    expect(upsertMetaDailyRows).not.toHaveBeenCalled();
    expect(recordImportHistory).toHaveBeenCalledWith(
      expect.objectContaining({ status: "duplicate" })
    );
    expect(result.status).toBe("duplicate");
  });
});

describe("processMetaReportFile — parser validation 실패", () => {
  it("필수 컬럼이 없는 파일은 failed로 기록되고 upsert를 호출하지 않는다", async () => {
    const invalidCsv = "Campaign name,Amount spent (KRW)\n캠페인,120000";

    const result = await processMetaReportFile({
      buffer: Buffer.from(invalidCsv, "utf-8"),
      fileName: "invalid.csv",
      sourceType: "manual",
    });

    expect(upsertMetaDailyRows).not.toHaveBeenCalled();
    expect(result.status).toBe("failed");
    expect(result.error_message).toContain("필수 컬럼");
  });
});

describe("processMetaReportFile — meta_daily upsert / import history 저장", () => {
  it("정상 파일은 upsert 후 success 상태로 이력을 저장한다", async () => {
    const result = await processMetaReportFile({
      buffer: Buffer.from(CSV, "utf-8"),
      fileName: "meta_report.csv",
      sourceType: "manual",
    });

    expect(upsertMetaDailyRows).toHaveBeenCalledWith([
      expect.objectContaining({ date: "2026-08-20", ad_id: "ad-1", spend: 120000 }),
      expect.objectContaining({ date: "2026-08-20", ad_id: "ad-2", spend: 98000 }),
    ]);

    expect(recordImportHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        row_count: 2,
        inserted_count: 2,
        updated_count: 0,
        report_start_date: "2026-08-20",
        report_end_date: "2026-08-20",
      })
    );

    expect(result.status).toBe("success");
  });
});
