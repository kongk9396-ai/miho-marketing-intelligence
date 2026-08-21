import { describe, expect, it } from "vitest";
import { computeLeadsCpaSummary, computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import type { LeadAnalysisRow } from "@/lib/leads-analysis/types";

function lead(overrides: Partial<LeadAnalysisRow>): LeadAnalysisRow {
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: "여름세일",
    utm_content: "A안",
    procedure: null,
    is_valid: true,
    outcome_status: "pending",
    consultation_status: "new",
    booking_status: "none",
    visit_status: "none",
    applied_at: "2026-08-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeLeadsKpiSummary", () => {
  it("전체 DB, 유효 DB, 유효 DB율을 정확히 계산한다", () => {
    const rows = [
      lead({ is_valid: true }),
      lead({ is_valid: true }),
      lead({ is_valid: false, outcome_status: "invalid" }),
      lead({ is_valid: false, outcome_status: "invalid" }),
    ];
    const kpi = computeLeadsKpiSummary(rows);

    expect(kpi.totalDb).toBe(4);
    expect(kpi.validDb).toBe(2);
    expect(kpi.validDbRate).toBeCloseTo(50, 5);
  });

  it("상담 연결(connected 또는 booked)과 상담 연결률을 계산한다 — 분모는 유효 DB", () => {
    const rows = [
      lead({ is_valid: true, consultation_status: "connected" }),
      lead({ is_valid: true, consultation_status: "booked" }),
      lead({ is_valid: true, consultation_status: "unreachable" }),
      lead({ is_valid: false, outcome_status: "invalid", consultation_status: "connected" }), // invalid는 분모/분자 모두 제외
    ];
    const kpi = computeLeadsKpiSummary(rows);

    expect(kpi.connected).toBe(2);
    expect(kpi.validDb).toBe(3);
    expect(kpi.connectedRate).toBeCloseTo((2 / 3) * 100, 5);
  });

  it("예약 확정(booking_status=confirmed)과 예약률을 계산한다 — 분모는 유효 DB", () => {
    const rows = [
      lead({ is_valid: true, booking_status: "confirmed" }),
      lead({ is_valid: true, booking_status: "none" }),
      lead({ is_valid: true, booking_status: "pending" }),
    ];
    const kpi = computeLeadsKpiSummary(rows);

    expect(kpi.confirmedBookings).toBe(1);
    expect(kpi.bookingRate).toBeCloseTo((1 / 3) * 100, 5);
  });

  it("내원 완료와 내원율을 계산한다 — 분모는 예약 확정", () => {
    const rows = [
      lead({ is_valid: true, booking_status: "confirmed", visit_status: "visited" }),
      lead({ is_valid: true, booking_status: "confirmed", visit_status: "scheduled" }),
    ];
    const kpi = computeLeadsKpiSummary(rows);

    expect(kpi.visited).toBe(1);
    expect(kpi.visitRate).toBeCloseTo(50, 5);
  });

  it("0 division을 안전하게 처리한다 — 빈 배열", () => {
    const kpi = computeLeadsKpiSummary([]);
    expect(kpi.totalDb).toBe(0);
    expect(kpi.validDbRate).toBeNull();
    expect(kpi.connectedRate).toBeNull();
    expect(kpi.bookingRate).toBeNull();
    expect(kpi.visitRate).toBeNull();
  });

  it("0 division을 안전하게 처리한다 — 유효 DB는 있지만 예약 확정이 0건", () => {
    const rows = [lead({ is_valid: true, booking_status: "none" })];
    const kpi = computeLeadsKpiSummary(rows);
    expect(kpi.confirmedBookings).toBe(0);
    expect(kpi.visitRate).toBeNull(); // 분모(예약 확정)가 0
  });
});

describe("computeLeadsCpaSummary", () => {
  it("DB CPA / 유효 DB CPA / 예약 CPA를 spend / count로 계산한다", () => {
    const rows = [
      lead({ is_valid: true, booking_status: "confirmed" }),
      lead({ is_valid: true, booking_status: "none" }),
      lead({ is_valid: false, outcome_status: "invalid" }),
    ];
    const kpi = computeLeadsKpiSummary(rows);
    const cpa = computeLeadsCpaSummary(300000, kpi);

    expect(cpa.dbCpa).toBeCloseTo(300000 / 3, 5);
    expect(cpa.validDbCpa).toBeCloseTo(300000 / 2, 5);
    expect(cpa.bookingCpa).toBeCloseTo(300000 / 1, 5);
  });

  it("count가 0인 CPA는 0으로 나누지 않고 null을 반환한다", () => {
    const kpi = computeLeadsKpiSummary([]);
    const cpa = computeLeadsCpaSummary(500000, kpi);

    expect(cpa.dbCpa).toBeNull();
    expect(cpa.validDbCpa).toBeNull();
    expect(cpa.connectedCpa).toBeNull();
    expect(cpa.bookingCpa).toBeNull();
    expect(cpa.visitedCpa).toBeNull();
  });

  it("spend가 0이어도 count가 있으면 0원으로 정상 계산한다 (null이 아님)", () => {
    const kpi = computeLeadsKpiSummary([lead({ is_valid: true })]);
    const cpa = computeLeadsCpaSummary(0, kpi);
    expect(cpa.dbCpa).toBe(0);
  });
});
