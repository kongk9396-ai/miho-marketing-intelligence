import { describe, expect, it } from "vitest";
import { computeLeadsFunnel } from "@/lib/leads-analysis/funnel";
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

describe("computeLeadsFunnel", () => {
  it("DB -> 유효 DB -> 상담 연결 -> 예약 확정 -> 내원 5단계를 순서대로 반환한다", () => {
    const stages = computeLeadsFunnel([]);
    expect(stages.map((s) => s.key)).toEqual(["total", "valid", "connected", "booked", "visited"]);
  });

  it("각 단계의 건수와 이전 단계 대비 전환율, 전체 DB 대비 누적 전환율을 계산한다", () => {
    const rows = [
      lead({ is_valid: true, consultation_status: "connected", booking_status: "confirmed", visit_status: "visited" }),
      lead({ is_valid: true, consultation_status: "connected", booking_status: "confirmed", visit_status: "scheduled" }),
      lead({ is_valid: true, consultation_status: "new", booking_status: "none" }),
      lead({ is_valid: false, outcome_status: "invalid" }),
    ];
    const stages = computeLeadsFunnel(rows);

    const [total, valid, connected, booked, visited] = stages;
    expect(total.count).toBe(4);
    expect(valid.count).toBe(3);
    expect(connected.count).toBe(2);
    expect(booked.count).toBe(2);
    expect(visited.count).toBe(1);

    expect(valid.stepRatePercent).toBeCloseTo((3 / 4) * 100, 5);
    expect(connected.stepRatePercent).toBeCloseTo((2 / 3) * 100, 5);
    expect(visited.stepRatePercent).toBeCloseTo((1 / 2) * 100, 5);

    expect(total.stepRatePercent).toBeNull();
    expect(total.cumulativeRatePercent).toBeCloseTo(100, 5);
    expect(visited.cumulativeRatePercent).toBeCloseTo((1 / 4) * 100, 5);
  });

  it("0 division을 안전하게 처리한다 — DB가 0건", () => {
    const stages = computeLeadsFunnel([]);
    for (const stage of stages) {
      expect(stage.count).toBe(0);
    }
    expect(stages[0].cumulativeRatePercent).toBeNull();
    expect(stages[1].stepRatePercent).toBeNull();
  });
});
