import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/leads-sync/sheets-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/leads-sync/sheets-client")>();
  return { ...actual, appendRow: vi.fn() };
});

import { appendRow } from "@/lib/leads-sync/sheets-client";
import { appendAttributionRecord, ATTRIBUTION_SHEET_HEADERS } from "@/lib/leads-sync/attribution-repository";

describe("appendAttributionRecord", () => {
  it("ATTRIBUTION_SHEET_HEADERS와 정확히 같은 순서로 값을 만든다", async () => {
    vi.mocked(appendRow).mockResolvedValue();

    await appendAttributionRecord("marketing_attribution", {
      landingName: "첫코 랜딩",
      utmSource: "meta",
      utmMedium: "paid_social",
      utmCampaign: "firstnose",
      utmContent: "creative_a",
      sourceSheet: "코첫",
      sourceRow: 42,
    });

    expect(appendRow).toHaveBeenCalledTimes(1);
    const [sheetName, values] = vi.mocked(appendRow).mock.calls[0];
    expect(sheetName).toBe("marketing_attribution");
    expect(ATTRIBUTION_SHEET_HEADERS.length).toBe(values.length);

    const byHeader = Object.fromEntries(ATTRIBUTION_SHEET_HEADERS.map((h, i) => [h, values[i]]));
    expect(byHeader.landing_name).toBe("첫코 랜딩");
    expect(byHeader.utm_source).toBe("meta");
    expect(byHeader.utm_medium).toBe("paid_social");
    expect(byHeader.utm_campaign).toBe("firstnose");
    expect(byHeader.utm_content).toBe("creative_a");
    expect(byHeader.source_sheet).toBe("코첫");
    expect(byHeader.source_row).toBe(42);
    expect(byHeader.result_status).toBe("");
    expect(byHeader.booking_status).toBe("");
    expect(typeof byHeader.submitted_at).toBe("string");
  });

  it("null 필드는 빈 문자열로 기록한다 (개인정보 필드는 애초에 타입에 없음)", async () => {
    vi.mocked(appendRow).mockResolvedValue();
    await appendAttributionRecord("marketing_attribution", {
      landingName: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      sourceSheet: "눈",
      sourceRow: 3,
    });

    const [, values] = vi.mocked(appendRow).mock.calls.at(-1)!;
    const byHeader = Object.fromEntries(ATTRIBUTION_SHEET_HEADERS.map((h, i) => [h, values[i]]));
    expect(byHeader.landing_name).toBe("");
    expect(byHeader.utm_campaign).toBe("");
  });
});
