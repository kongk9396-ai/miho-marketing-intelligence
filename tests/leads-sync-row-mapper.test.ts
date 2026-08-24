import { describe, expect, it } from "vitest";
import { mapSheetRows } from "@/lib/leads-sync/row-mapper";
import { attributionMatchKey } from "@/lib/leads-sync/attribution-repository";
import type { AttributionRecord } from "@/lib/leads-sync/attribution-repository";

function attributionRecord(overrides: Partial<AttributionRecord> = {}): AttributionRecord {
  return {
    sourceSheet: "코첫",
    sourceRow: 2,
    submittedAt: null,
    landingName: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    resultStatus: null,
    bookingStatus: null,
    ...overrides,
  };
}

const baseRecord: Record<string, unknown> = {
  신청날짜: "2026-08-20",
  이름: "홍길동",
  생년월일: "1990-01-01",
  연락처: "010-1234-5678",
  "코 상담 고민이 무엇인가요": "콧대가 낮아서 고민입니다.",
  최종결과: "예약",
  담당자: "김상담",
  "콜 결과(1차)": "통화완료",
  utm_campaign: "여름세일",
  utm_content: "A안",
  비고: "민감할 수 있는 내부 메모",
};

const source = { sheetName: "코첫", procedureLabel: "코 첫수술", columnOverrides: {} };

describe("mapSheetRows — 신청날짜 없는 행 처리", () => {
  it("신청날짜를 인식할 수 없는 행은 건너뛰고 이유를 기록한다", () => {
    const { rows, skipped } = mapSheetRows([{ ...baseRecord, 신청날짜: "" }], source);
    expect(rows).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toContain("신청날짜");
  });
});

describe("mapSheetRows — 개인정보 미저장", () => {
  it("이름/생년월일/연락처/상담 고민/비고 원문이 결과 행에 절대 포함되지 않는다", () => {
    const { rows } = mapSheetRows([baseRecord], source);
    expect(rows).toHaveLength(1);

    const serialized = JSON.stringify(rows[0]);
    expect(serialized).not.toContain("홍길동");
    expect(serialized).not.toContain("1990-01-01");
    expect(serialized).not.toContain("010-1234-5678");
    expect(serialized).not.toContain("01012345678");
    expect(serialized).not.toContain("콧대가 낮아서");
    expect(serialized).not.toContain("민감할 수 있는");

    // and the object itself carries no such keys at all
    expect(Object.keys(rows[0])).not.toContain("name");
    expect(Object.keys(rows[0])).not.toContain("phone");
    expect(Object.keys(rows[0])).not.toContain("birth_date");
  });
});

describe("mapSheetRows — 상태 파생", () => {
  it("최종결과와 콜 결과로부터 outcome_status/consultation_status/booking_status/is_valid를 올바르게 파생한다", () => {
    const { rows } = mapSheetRows([baseRecord], source);
    const row = rows[0];

    expect(row.outcome_status).toBe("confirmed");
    expect(row.consultation_status).toBe("connected");
    expect(row.booking_status).toBe("confirmed");
    expect(row.is_valid).toBe(true);
    expect(row.procedure).toBe("코 첫수술");
    expect(row.source).toBe("코첫");
  });

  it("콜 결과 1~4차 중 가장 최근(가장 큰 차수)의 값을 우선 사용한다", () => {
    const record = {
      ...baseRecord,
      "콜 결과(1차)": "통화완료",
      "콜 결과(2차)": "재통화예정",
      "콜 결과(3차)": "",
      "콜 결과(4차)": "예약완료",
    };
    const { rows } = mapSheetRows([record], source);
    expect(rows[0].consultation_status).toBe("booked");
  });

  it("4차가 비어있으면 그 이전 중 가장 최근 값을 사용한다", () => {
    const record = {
      ...baseRecord,
      "콜 결과(1차)": "통화완료",
      "콜 결과(2차)": "재통화예정",
      "콜 결과(3차)": "",
      "콜 결과(4차)": "",
    };
    const { rows } = mapSheetRows([record], source);
    expect(rows[0].consultation_status).toBe("callback");
  });
});

describe("mapSheetRows — 중복 방지 (idempotent 재동기화)", () => {
  it("동일한 행을 두 번 매핑해도 같은 lead_key를 생성한다", () => {
    const result1 = mapSheetRows([baseRecord], source);
    const result2 = mapSheetRows([baseRecord], source);
    expect(result1.rows[0].lead_key).toBe(result2.rows[0].lead_key);
  });

  it("같은 사람의 상태값만 바뀐 경우에도 lead_key는 유지된다 (업데이트로 처리되도록)", () => {
    const before = mapSheetRows([baseRecord], source).rows[0];
    const updatedRecord = { ...baseRecord, 최종결과: "취소" };
    const after = mapSheetRows([updatedRecord], source).rows[0];

    expect(after.lead_key).toBe(before.lead_key);
    expect(after.outcome_status).toBe("cancelled");
    expect(before.outcome_status).toBe("confirmed");
  });
});

describe("mapSheetRows — DBcart 어트리뷰션 매칭 (attribution)", () => {
  // Mirrors the real "코첫" sheet shape — no utm_* columns at all.
  const noUtmRecord: Record<string, unknown> = {
    신청날짜: "2026-08-20",
    이름: "홍길동",
    생년월일: "1990-01-01",
    연락처: "010-1234-5678",
    최종결과: "예약",
    담당자: "김상담",
    "콜 결과(1차)": "통화완료",
  };

  it("attribution이 없으면 utm 필드는 null로 유지된다 (추측하지 않음)", () => {
    const { rows } = mapSheetRows([noUtmRecord], source);
    expect(rows[0].utm_campaign).toBeNull();
    expect(rows[0].utm_content).toBeNull();
  });

  it("(시트명, 행번호)가 attribution 탭에 있으면 utm 값을 채운다", () => {
    // noUtmRecord is the only row, so its sheet row number is 2 (header + 1-indexed).
    const key = attributionMatchKey("코첫", 2);
    const matchMap = new Map([
      [key, attributionRecord({ landingName: "첫코 랜딩", utmSource: "meta", utmMedium: "paid_social", utmCampaign: "firstnose", utmContent: "creative_a" })],
    ]);

    const { rows } = mapSheetRows([noUtmRecord], source, { matchMap });
    expect(rows[0].utm_campaign).toBe("firstnose");
    expect(rows[0].utm_content).toBe("creative_a");
    expect(rows[0].utm_source).toBe("meta");
    expect(rows[0].landing_name).toBe("첫코 랜딩");
  });

  it("(시트명, 행번호)가 attribution 탭에 없으면 (미매칭) 추측하지 않고 null로 남긴다", () => {
    const matchMap = new Map<string, AttributionRecord>(); // no rows at all
    const { rows } = mapSheetRows([noUtmRecord], source, { matchMap });
    expect(rows[0].utm_campaign).toBeNull();
  });

  it("다른 시트/행 번호의 attribution 행은 매칭되지 않는다", () => {
    const matchMap = new Map([[attributionMatchKey("눈", 2), attributionRecord({ sourceSheet: "눈", utmCampaign: "다른캠페인" })]]);
    const { rows } = mapSheetRows([noUtmRecord], source, { matchMap }); // source.sheetName === "코첫", not "눈"
    expect(rows[0].utm_campaign).toBeNull();
  });

  it("상담 시트 자체에 이미 utm 컬럼이 있으면 attribution 매칭보다 그 값을 우선한다", () => {
    const key = attributionMatchKey("코첫", 2);
    const matchMap = new Map([[key, attributionRecord({ utmCampaign: "attribution_campaign", utmContent: "attribution_content" })]]);

    const { rows } = mapSheetRows([baseRecord], source, { matchMap }); // baseRecord already has utm_campaign: "여름세일"
    expect(rows[0].utm_campaign).toBe("여름세일");
  });

  it("attribution으로 채워진 utm 값도 lead_key 계산에 반영된다 (서로 다른 매칭 결과는 다른 lead_key)", () => {
    const key = attributionMatchKey("코첫", 2);
    const withoutAttribution = mapSheetRows([noUtmRecord], source).rows[0];
    const withAttribution = mapSheetRows([noUtmRecord], source, {
      matchMap: new Map([[key, attributionRecord({ utmCampaign: "firstnose", utmContent: "creative_a" })]]),
    }).rows[0];

    expect(withAttribution.lead_key).not.toBe(withoutAttribution.lead_key);
  });
});

describe("mapSheetRows — 컬럼 자동 인식 실패", () => {
  it("필수 컬럼을 찾을 수 없으면 전체를 건너뛰고 이유를 기록한다", () => {
    const { rows, skipped } = mapSheetRows([{ 이상한컬럼: "값" }], source);
    expect(rows).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toContain("필수 컬럼");
  });

  it("컬럼 오버라이드로 자동 인식 실패를 해결할 수 있다", () => {
    const customSource = { ...source, columnOverrides: { applied_at: "접수일자" } };
    const { rows } = mapSheetRows([{ 접수일자: "2026-08-20", utm_campaign: "여름세일" }], customSource);
    expect(rows).toHaveLength(1);
  });
});
