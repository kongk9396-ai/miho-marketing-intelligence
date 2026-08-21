import { describe, expect, it } from "vitest";
import { computeLeadKey, normalizePhone } from "@/lib/leads-sync/lead-key";

describe("normalizePhone", () => {
  it("전화번호에서 숫자만 남긴다", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
    expect(normalizePhone("010 1234 5678")).toBe("01012345678");
    expect(normalizePhone(null)).toBe("");
    expect(normalizePhone(undefined)).toBe("");
  });
});

describe("computeLeadKey — 중복 방지", () => {
  it("동일한 신청일시+전화번호+UTM 조합이면 항상 같은 키를 생성한다", () => {
    const input = {
      appliedAtIso: "2026-08-20T01:00:00.000Z",
      phone: "010-1234-5678",
      utmCampaign: "여름세일",
      utmContent: "A안",
    };

    expect(computeLeadKey(input)).toBe(computeLeadKey({ ...input }));
  });

  it("전화번호 표기 형식이 달라도 정규화 후 동일한 키를 생성한다 (010-1234-5678 vs 01012345678)", () => {
    const base = { appliedAtIso: "2026-08-20T01:00:00.000Z", utmCampaign: "여름세일", utmContent: "A안" };
    const key1 = computeLeadKey({ ...base, phone: "010-1234-5678" });
    const key2 = computeLeadKey({ ...base, phone: "01012345678" });
    expect(key1).toBe(key2);
  });

  it("신청일시가 다르면 다른 키를 생성한다", () => {
    const base = { phone: "01012345678", utmCampaign: "여름세일", utmContent: "A안" };
    const key1 = computeLeadKey({ ...base, appliedAtIso: "2026-08-20T01:00:00.000Z" });
    const key2 = computeLeadKey({ ...base, appliedAtIso: "2026-08-21T01:00:00.000Z" });
    expect(key1).not.toBe(key2);
  });

  it("UTM이 다르면 다른 키를 생성한다 (같은 사람이 다른 캠페인으로 재신청)", () => {
    const base = { appliedAtIso: "2026-08-20T01:00:00.000Z", phone: "01012345678" };
    const key1 = computeLeadKey({ ...base, utmCampaign: "여름세일", utmContent: "A안" });
    const key2 = computeLeadKey({ ...base, utmCampaign: "가을세일", utmContent: "A안" });
    expect(key1).not.toBe(key2);
  });

  it("전화번호가 없어도 오류 없이 키를 생성한다", () => {
    expect(() =>
      computeLeadKey({ appliedAtIso: "2026-08-20T01:00:00.000Z", phone: null, utmCampaign: null, utmContent: null })
    ).not.toThrow();
  });
});
