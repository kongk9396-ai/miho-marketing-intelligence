import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ga4/repository", () => ({
  recordGa4SyncHistory: vi.fn(),
  upsertGa4DailyRows: vi.fn(),
}));

import { recordGa4SyncHistory, upsertGa4DailyRows } from "@/lib/ga4/repository";
import { runGa4Sync } from "@/lib/ga4/sync-engine";
import type { Ga4EventRow, Ga4MainRow } from "@/lib/ga4/types";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(upsertGa4DailyRows).mockResolvedValue({ inserted: 1, updated: 0 });
  vi.mocked(recordGa4SyncHistory).mockImplementation(async (input) => ({
    id: "hist-1",
    processed_at: "2026-08-20T00:00:00.000Z",
    created_at: "2026-08-20T00:00:00.000Z",
    ...input,
  }));
});

const fakeMain: Ga4MainRow[] = [
  {
    date: "2026-08-19",
    source: "google",
    medium: "cpc",
    campaign: "여름 세일",
    content: "첫코 A",
    landingPage: "/lp",
    sessions: 100,
    totalUsers: 90,
    engagedSessions: 60,
    engagementRate: 60,
    avgSessionDuration: 30,
    screenPageViews: 120,
    keyEvents: 2,
  },
];

const fakeEvents: Ga4EventRow[] = [
  { date: "2026-08-19", campaign: "여름 세일", content: "첫코 A", landingPage: "/lp", eventName: "cta_click", eventCount: 20 },
];

describe("runGa4Sync — 정상 API 응답 처리 및 업서트 위임", () => {
  it("메인+이벤트 리포트를 합쳐 upsertGa4DailyRows를 호출한다", async () => {
    const fetchMain = vi.fn().mockResolvedValue(fakeMain);
    const fetchEvents = vi.fn().mockResolvedValue(fakeEvents);

    const result = await runGa4Sync({ targetDate: "2026-08-19", fetchMain, fetchEvents });

    expect(result.status).toBe("success");
    expect(upsertGa4DailyRows).toHaveBeenCalledWith([
      expect.objectContaining({
        date: "2026-08-19",
        campaign: "여름 세일",
        content: "첫코 A",
        cta_clicks: 20,
        sessions: 100,
      }),
    ]);
    expect(recordGa4SyncHistory).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success", sync_date: "2026-08-19" })
    );
  });
});

describe("runGa4Sync — upsert 중복 방지", () => {
  it("동일한 날짜를 두 번 동기화해도 매번 동일한 (date,campaign,content,landing_page) 키로 upsert된다", async () => {
    const fetchMain = vi.fn().mockResolvedValue(fakeMain);
    const fetchEvents = vi.fn().mockResolvedValue(fakeEvents);

    await runGa4Sync({ targetDate: "2026-08-19", fetchMain, fetchEvents });
    await runGa4Sync({ targetDate: "2026-08-19", fetchMain, fetchEvents });

    expect(upsertGa4DailyRows).toHaveBeenCalledTimes(2);
    const [firstCallRows] = vi.mocked(upsertGa4DailyRows).mock.calls[0];
    const [secondCallRows] = vi.mocked(upsertGa4DailyRows).mock.calls[1];
    expect(firstCallRows).toEqual(secondCallRows);
  });
});

describe("runGa4Sync — API 오류 처리", () => {
  it("GA4 API 호출이 실패하면 failed 상태로 기록하고 upsert를 호출하지 않는다", async () => {
    const fetchMain = vi.fn().mockRejectedValue(new Error("GA4 API 오류"));
    const fetchEvents = vi.fn().mockResolvedValue([]);

    const result = await runGa4Sync({ targetDate: "2026-08-19", fetchMain, fetchEvents });

    expect(result.status).toBe("failed");
    expect(result.message).toContain("GA4 API 오류");
    expect(recordGa4SyncHistory).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
    expect(upsertGa4DailyRows).not.toHaveBeenCalled();
  });
});
