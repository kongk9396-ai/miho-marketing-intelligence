import { describe, expect, it } from "vitest";
import {
  deriveBookingStatus,
  deriveIsValid,
  normalizeConsultationStatus,
  normalizeOutcomeStatus,
} from "@/lib/leads-sync/status-mapping";

describe("normalizeOutcomeStatus — 표준 상태 매핑 (최종 결과)", () => {
  it("실제 시트 값을 정확히 표준 상태로 매핑한다", () => {
    expect(normalizeOutcomeStatus("예약")).toBe("confirmed");
    expect(normalizeOutcomeStatus("불량")).toBe("invalid");
    expect(normalizeOutcomeStatus("취소")).toBe("cancelled");
    expect(normalizeOutcomeStatus("미정")).toBe("pending");
  });

  it("빈 값은 미정(pending)으로 처리한다", () => {
    expect(normalizeOutcomeStatus("")).toBe("pending");
    expect(normalizeOutcomeStatus(null)).toBe("pending");
    expect(normalizeOutcomeStatus(undefined)).toBe("pending");
  });

  it("알 수 없는 값은 임의로 추측하지 않고 other로 처리한다", () => {
    expect(normalizeOutcomeStatus("이런값은없음")).toBe("other");
  });

  it("공백 차이는 같은 값으로 취급한다", () => {
    expect(normalizeOutcomeStatus("예약 ")).toBe("confirmed");
    expect(normalizeOutcomeStatus(" 예약")).toBe("confirmed");
  });
});

describe("normalizeConsultationStatus — 표준 상태 매핑 (콜 결과)", () => {
  it("실제 시트 값을 정확히 표준 상태로 매핑한다", () => {
    expect(normalizeConsultationStatus("예약완료")).toBe("booked");
    expect(normalizeConsultationStatus("통화완료")).toBe("connected");
    expect(normalizeConsultationStatus("부재")).toBe("unreachable");
    expect(normalizeConsultationStatus("재통화예정")).toBe("callback");
    expect(normalizeConsultationStatus("거절")).toBe("rejected");
    expect(normalizeConsultationStatus("불량")).toBe("invalid");
  });

  it("콜 결과가 아직 없으면(빈 값) new로 처리한다", () => {
    expect(normalizeConsultationStatus("")).toBe("new");
    expect(normalizeConsultationStatus(null)).toBe("new");
  });

  it("미지 상태값은 other로 처리하고 절대 오류를 던지지 않는다", () => {
    expect(() => normalizeConsultationStatus("전에없던값")).not.toThrow();
    expect(normalizeConsultationStatus("전에없던값")).toBe("other");
  });
});

describe("normalizeConsultationStatus — 실제 시트의 여러 줄 콜 로그 형식", () => {
  it("실제 시트는 '1차 : 채널 결과' 형태로 여러 줄에 걸쳐 기록되며, 키워드를 포함한 가장 마지막 줄을 기준으로 판정한다", () => {
    expect(normalizeConsultationStatus("1차 : 카톡\n인콜로 예약 완료")).toBe("booked");
    expect(normalizeConsultationStatus("1차 : 문자\n2차: 부재.카톡")).toBe("unreachable");
    expect(normalizeConsultationStatus("1차 : 문자 \n2차 :부재.문자\n3차: 통화완료")).toBe("connected");
  });

  it("이전 줄에서 매칭되어도 이후 줄의 더 최근 결과가 우선한다", () => {
    // 2차에 '부재'가 있어도 3차의 '예약 완료'가 최신이므로 booked여야 한다.
    expect(normalizeConsultationStatus("1차 : 문자\n2차:  부재\n3차 : 문자 예약 완료")).toBe("booked");
  });

  it("어떤 줄에도 인식 가능한 키워드가 없으면 other다 (내용이 있어도 추측하지 않는다)", () => {
    expect(normalizeConsultationStatus("1차 : 문자")).toBe("other");
  });

  it("빈 줄만 있거나 완전히 빈 값이면 new다", () => {
    expect(normalizeConsultationStatus("")).toBe("new");
    expect(normalizeConsultationStatus("\n\n")).toBe("new");
  });
});

describe("deriveBookingStatus", () => {
  it("최종 결과가 confirmed면 예약 확정이다", () => {
    expect(deriveBookingStatus("confirmed", "connected")).toBe("confirmed");
  });

  it("최종 결과는 아니어도 콜 결과가 booked면 예약 확정이다 (OR 조건)", () => {
    expect(deriveBookingStatus("pending", "booked")).toBe("confirmed");
  });

  it("취소/미정/그 외는 각각 올바른 상태로 매핑된다", () => {
    expect(deriveBookingStatus("cancelled", "connected")).toBe("cancelled");
    expect(deriveBookingStatus("pending", "connected")).toBe("pending");
    expect(deriveBookingStatus("other", "new")).toBe("none");
  });
});

describe("deriveIsValid", () => {
  it("최종 결과가 invalid일 때만 유효하지 않다", () => {
    expect(deriveIsValid("invalid")).toBe(false);
    expect(deriveIsValid("confirmed")).toBe(true);
    expect(deriveIsValid("pending")).toBe(true);
    expect(deriveIsValid("cancelled")).toBe(true);
    expect(deriveIsValid("other")).toBe(true);
  });
});
