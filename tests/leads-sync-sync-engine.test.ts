import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/leads-sync/repository", () => ({
  listEnabledLeadsSheetConfigs: vi.fn(),
  recordLeadsSyncHistory: vi.fn(),
  upsertLeads: vi.fn(),
}));

import { listEnabledLeadsSheetConfigs, recordLeadsSyncHistory, upsertLeads } from "@/lib/leads-sync/repository";
import { runLeadsSync } from "@/lib/leads-sync/sync-engine";

const config = { id: "1", sheet_name: "코첫", procedure_label: "코 첫수술", enabled: true, column_overrides: {}, created_at: "", updated_at: "" };

function setup() {
  vi.mocked(listEnabledLeadsSheetConfigs).mockResolvedValue([config]);
  vi.mocked(recordLeadsSyncHistory).mockResolvedValue({} as never);
  vi.mocked(upsertLeads).mockResolvedValue({ inserted: 1, updated: 0 });
}

describe("runLeadsSync — attribution tab provisioning is best-effort, never fatal", () => {
  it("marketing_attribution 탭 생성이 permission_denied여도 리드 동기화 자체는 성공한다", async () => {
    setup();
    const fetchRecords = vi.fn(async (sheetName: string) => {
      if (sheetName === "코첫") return [{ 신청날짜: "2026-08-20" }];
      return []; // attribution tab read (empty/not-yet-shaped) during loadAttributionEnrichment
    });

    const result = await runLeadsSync({
      fetchRecords,
      ensureAttributionSheet: async () => "permission_denied",
    });

    expect(result.attributionSheetStatus).toBe("permission_denied");
    expect(result.status).toBe("success");
    expect(result.inserted).toBe(1);
  });

  it("탭이 이미 있으면 already_existed를 보고하고 매칭 결과를 리드에 반영한다", async () => {
    setup();
    const fetchRecords = vi.fn(async (sheetName: string) => {
      if (sheetName === "코첫") return [{ 신청날짜: "2026-08-20", 연락처: "010-1111-2222" }];
      if (sheetName === "marketing_attribution") {
        return [{ source_sheet: "코첫", source_row: "2", utm_campaign: "firstnose", utm_content: "creative_a" }];
      }
      return [];
    });

    const result = await runLeadsSync({
      fetchRecords,
      ensureAttributionSheet: async () => "already_existed",
    });

    expect(result.attributionSheetStatus).toBe("already_existed");
    expect(result.status).toBe("success");

    const upsertedRows = vi.mocked(upsertLeads).mock.calls.at(-1)?.[0];
    expect(upsertedRows?.[0]?.utm_campaign).toBe("firstnose");
  });

  it("설정된 시트가 없으면 attributionSheetStatus를 포함해 실패로 기록한다", async () => {
    vi.mocked(listEnabledLeadsSheetConfigs).mockResolvedValue([]);
    vi.mocked(recordLeadsSyncHistory).mockResolvedValue({} as never);

    const result = await runLeadsSync({
      fetchRecords: async () => [],
      ensureAttributionSheet: async () => "created",
    });

    expect(result.status).toBe("failed");
    expect(result.attributionSheetStatus).toBe("created");
  });
});
