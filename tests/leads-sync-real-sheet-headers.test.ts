import { describe, expect, it } from "vitest";
import { resolveLeadsHeaderMap } from "@/lib/leads-sync/header-aliases";

/**
 * Column *labels* (never data) actually observed in the client's live
 * Google Sheet, captured 2026-08-21. These are structural metadata, not
 * patient information — regression coverage against the real sheet shape,
 * so a future change to the alias list can't silently break this client's
 * actual tabs.
 */
const REAL_HEADERS_코첫 = [
  "신청날짜",
  "내원희망날짜",
  "예약금 입금 여부",
  "이름",
  "생년월일",
  "연락처",
  "코, 상담 고민이 무엇인가요",
  "최종 결과",
  "담당자",
  "콜 결과(1차/2차/3차/4차)",
  "문자",
  "비고",
  "랜딩타이틀",
  "텔레그램 전송 여부",
];

const REAL_HEADERS_코재_눈 = [
  "내원희망날짜",
  "이름",
  "생년월일",
  "연락처",
  "코, 상담 고민이 무엇인가요",
  "랜딩타이틀",
  "신청날짜",
  "텔레그램 전송 여부",
  "콜 결과(1차/2차/3차/4차)",
  "문자",
  "최종 결과",
];

describe("resolveLeadsHeaderMap — 실제 시트 헤더 (코첫)", () => {
  const map = resolveLeadsHeaderMap(REAL_HEADERS_코첫);

  it("필수/핵심 필드를 전부 자동 인식한다", () => {
    expect(map.applied_at).toBe("신청날짜");
    expect(map.preferred_visit_at).toBe("내원희망날짜");
    expect(map.outcome_raw).toBe("최종 결과");
    expect(map.consultant).toBe("담당자");
    expect(map.call_result_1).toBe("콜 결과(1차/2차/3차/4차)");
    expect(map.landing_name).toBe("랜딩타이틀");
    expect(map.phone).toBe("연락처");
  });

  it("이름/생년월일/상담 고민/비고 컬럼은 어떤 필드로도 매핑되지 않는다 (저장 대상 아님)", () => {
    const mappedHeaders = new Set(Object.values(map));
    expect(mappedHeaders.has("이름")).toBe(false);
    expect(mappedHeaders.has("생년월일")).toBe(false);
    expect(mappedHeaders.has("코, 상담 고민이 무엇인가요")).toBe(false);
    expect(mappedHeaders.has("비고")).toBe(false);
  });
});

describe("resolveLeadsHeaderMap — 실제 시트 헤더 (코재/눈)", () => {
  const map = resolveLeadsHeaderMap(REAL_HEADERS_코재_눈);

  it("담당자 컬럼이 없는 시트에서도 나머지 필드는 정상 인식한다", () => {
    expect(map.applied_at).toBe("신청날짜");
    expect(map.outcome_raw).toBe("최종 결과");
    expect(map.call_result_1).toBe("콜 결과(1차/2차/3차/4차)");
    expect(map.landing_name).toBe("랜딩타이틀");
    expect(map.consultant).toBeUndefined();
  });
});
