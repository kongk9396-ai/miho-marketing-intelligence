import { describe, expect, it } from "vitest";
import { mergeGa4Reports } from "@/lib/ga4/merge";
import type { Ga4EventRow, Ga4MainRow } from "@/lib/ga4/types";

function mainRow(overrides: Partial<Ga4MainRow> = {}): Ga4MainRow {
  return {
    date: "2026-08-20",
    source: "google",
    medium: "cpc",
    campaign: "여름 세일",
    content: "첫코 A",
    landingPage: "/lp/summer",
    sessions: 1000,
    totalUsers: 900,
    engagedSessions: 600,
    engagementRate: 60,
    avgSessionDuration: 45,
    screenPageViews: 1200,
    keyEvents: 5,
    ...overrides,
  };
}

describe("mergeGa4Reports — 정상 응답 파싱", () => {
  it("동일 키(date+campaign+content+landingPage)의 이벤트를 메인 리포트에 합친다", () => {
    const main = [mainRow()];
    const events: Ga4EventRow[] = [
      { date: "2026-08-20", campaign: "여름 세일", content: "첫코 A", landingPage: "/lp/summer", eventName: "cta_click", eventCount: 220 },
      { date: "2026-08-20", campaign: "여름 세일", content: "첫코 A", landingPage: "/lp/summer", eventName: "form_start", eventCount: 90 },
      { date: "2026-08-20", campaign: "여름 세일", content: "첫코 A", landingPage: "/lp/summer", eventName: "form_complete", eventCount: 34 },
    ];

    const [merged] = mergeGa4Reports(main, events);

    expect(merged.sessions).toBe(1000);
    expect(merged.ctaClicks).toBe(220);
    expect(merged.formStarts).toBe(90);
    expect(merged.formCompletes).toBe(34);
  });

  it("다른 광고(content)의 이벤트는 섞이지 않는다", () => {
    const main = [mainRow({ content: "첫코 A" }), mainRow({ content: "첫코 B", sessions: 500 })];
    const events: Ga4EventRow[] = [
      { date: "2026-08-20", campaign: "여름 세일", content: "첫코 A", landingPage: "/lp/summer", eventName: "cta_click", eventCount: 100 },
      { date: "2026-08-20", campaign: "여름 세일", content: "첫코 B", landingPage: "/lp/summer", eventName: "cta_click", eventCount: 50 },
    ];

    const merged = mergeGa4Reports(main, events);
    expect(merged.find((r) => r.content === "첫코 A")?.ctaClicks).toBe(100);
    expect(merged.find((r) => r.content === "첫코 B")?.ctaClicks).toBe(50);
  });

  it("같은 키에 동일 이벤트명이 두 번 나오면 합산한다 (중복 방지)", () => {
    const main = [mainRow()];
    const events: Ga4EventRow[] = [
      { date: "2026-08-20", campaign: "여름 세일", content: "첫코 A", landingPage: "/lp/summer", eventName: "cta_click", eventCount: 100 },
      { date: "2026-08-20", campaign: "여름 세일", content: "첫코 A", landingPage: "/lp/summer", eventName: "cta_click", eventCount: 20 },
    ];

    const [merged] = mergeGa4Reports(main, events);
    expect(merged.ctaClicks).toBe(120);
  });
});

describe("mergeGa4Reports — source/medium가 달라도 저장 키가 같으면 합친다", () => {
  it("동일 date+campaign+content+landingPage에 source/medium만 다른 두 행이 오면 하나로 합산한다 (중복 upsert 키 방지)", () => {
    const main = [
      mainRow({ source: "facebook", medium: "cpc", sessions: 1000, totalUsers: 900, engagedSessions: 600, screenPageViews: 1200, keyEvents: 5 }),
      mainRow({ source: "(direct)", medium: "(none)", sessions: 200, totalUsers: 180, engagedSessions: 50, screenPageViews: 210, keyEvents: 1 }),
    ];
    const merged = mergeGa4Reports(main, []);

    expect(merged).toHaveLength(1);
    expect(merged[0].sessions).toBe(1200);
    expect(merged[0].totalUsers).toBe(1080);
    expect(merged[0].engagedSessions).toBe(650);
    expect(merged[0].screenPageViews).toBe(1410);
    expect(merged[0].keyEvents).toBe(6);
    // The higher-session source/medium pair (facebook/cpc, 1000 sessions) represents the merged row.
    expect(merged[0].source).toBe("facebook");
    expect(merged[0].medium).toBe("cpc");
    expect(merged[0].engagementRate).toBeCloseTo(650 / 1200, 5);
  });

  it("합산된 행에도 이벤트 카운트가 정상적으로 조인된다", () => {
    const main = [
      mainRow({ source: "facebook", medium: "cpc", sessions: 1000 }),
      mainRow({ source: "(direct)", medium: "(none)", sessions: 200 }),
    ];
    const events: Ga4EventRow[] = [
      { date: "2026-08-20", campaign: "여름 세일", content: "첫코 A", landingPage: "/lp/summer", eventName: "cta_click", eventCount: 90 },
    ];
    const [merged] = mergeGa4Reports(main, events);
    expect(merged.ctaClicks).toBe(90);
  });
});

describe("mergeGa4Reports — 이벤트 없는 경우 0 처리", () => {
  it("GA4 속성에 해당 이벤트가 아예 없으면(이벤트 리포트에 행 없음) 0으로 채우고 오류를 던지지 않는다", () => {
    const main = [mainRow()];
    const events: Ga4EventRow[] = []; // property never fired cta_click/form_start/form_complete/scroll_depth

    expect(() => mergeGa4Reports(main, events)).not.toThrow();
    const [merged] = mergeGa4Reports(main, events);
    expect(merged.ctaClicks).toBe(0);
    expect(merged.formStarts).toBe(0);
    expect(merged.formCompletes).toBe(0);
    expect(merged.scrollDepthEvents).toBe(0);
  });

  it("일부 이벤트만 존재해도 나머지는 0으로 채운다", () => {
    const main = [mainRow()];
    const events: Ga4EventRow[] = [
      { date: "2026-08-20", campaign: "여름 세일", content: "첫코 A", landingPage: "/lp/summer", eventName: "cta_click", eventCount: 220 },
    ];

    const [merged] = mergeGa4Reports(main, events);
    expect(merged.ctaClicks).toBe(220);
    expect(merged.formStarts).toBe(0);
    expect(merged.formCompletes).toBe(0);
  });
});
