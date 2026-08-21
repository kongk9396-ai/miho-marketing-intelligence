import { describe, expect, it } from "vitest";
import { classifyDbProblem, DB_PROBLEM_THRESHOLDS } from "@/lib/leads-analysis/problem-classification";
import type { LeadsKpiSummary } from "@/lib/leads-analysis/kpi";

function kpi(overrides: Partial<LeadsKpiSummary>): LeadsKpiSummary {
  return {
    totalDb: 100,
    validDb: 80,
    validDbRate: 80,
    connected: 40,
    connectedRate: 50,
    confirmedBookings: 20,
    bookingRate: 25,
    visited: 10,
    visitRate: 50,
    ...overrides,
  };
}

describe("classifyDbProblem — 표본 부족", () => {
  it("after 기간 DB가 임계값 미만이면 단정하지 않고 데이터 부족을 반환한다", () => {
    const before = kpi({});
    const after = kpi({ totalDb: DB_PROBLEM_THRESHOLDS.minDbForJudgment - 1 });

    const result = classifyDbProblem(before, after);
    expect(result.classification).toBe("insufficient_data");
    expect(result.headline).toBe("판단을 위한 데이터가 부족합니다.");
  });
});

describe("classifyDbProblem — 유입 품질 문제", () => {
  it("DB 수는 정상인데 유효 DB율이 급락하면 유입 품질 문제로 분류한다", () => {
    const before = kpi({ totalDb: 100, validDbRate: 80 });
    const after = kpi({ totalDb: 105, validDbRate: 55 }); // DB수 거의 그대로, 유효율 -31.25%

    const result = classifyDbProblem(before, after);
    expect(result.classification).toBe("lead_quality_problem");
  });
});

describe("classifyDbProblem — 상담 연결 문제", () => {
  it("유효 DB율은 정상인데 상담 연결률이 급락하면 상담 연결 단계 문제로 분류한다", () => {
    const before = kpi({ validDbRate: 80, connectedRate: 50 });
    const after = kpi({ totalDb: 105, validDbRate: 78, connectedRate: 30 }); // 연결률 -40%

    const result = classifyDbProblem(before, after);
    expect(result.classification).toBe("consultation_connection_problem");
  });
});

describe("classifyDbProblem — 상담/예약 전환 문제", () => {
  it("상담 연결률은 정상인데 예약률이 급락하면 상담/예약 전환 문제로 분류한다", () => {
    const before = kpi({ connectedRate: 50, bookingRate: 25 });
    const after = kpi({ totalDb: 105, connectedRate: 48, bookingRate: 15 }); // 예약률 -40%

    const result = classifyDbProblem(before, after);
    expect(result.classification).toBe("booking_conversion_problem");
  });
});

describe("classifyDbProblem — 문제 없음", () => {
  it("모든 지표가 안정적이면 문제 없음으로 분류한다", () => {
    const before = kpi({});
    const after = kpi({ totalDb: 102 });

    const result = classifyDbProblem(before, after);
    expect(result.classification).toBe("no_issue");
  });
});

describe("classifyDbProblem — 우선순위", () => {
  it("여러 단계가 동시에 하락해도 퍼널 상단(유입 품질)부터 보고한다", () => {
    const before = kpi({ validDbRate: 80, connectedRate: 50, bookingRate: 25 });
    const after = kpi({ totalDb: 105, validDbRate: 50, connectedRate: 20, bookingRate: 10 });

    const result = classifyDbProblem(before, after);
    expect(result.classification).toBe("lead_quality_problem");
  });
});
