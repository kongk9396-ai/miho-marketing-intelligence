import { describe, expect, it } from "vitest";
import { computeBudgetSummary } from "@/lib/ad-operations/budget";

describe("computeBudgetSummary", () => {
  it("실데이터 기간만으로 일평균/30일 예상을 계산한다", () => {
    const result = computeBudgetSummary({
      plannedMonthlyBudget: 10_000_000,
      plannedDailyBudget: null,
      actualTotalSpend: 1_400_000,
      actualDataDayCount: 14,
    });

    expect(result.actualDailyAvgSpend).toBe(100_000);
    expect(result.projected30DaySpend).toBe(3_000_000);
    expect(result.budgetRemainingOrOverage).toBe(8_600_000);
    expect(result.budgetUsageRate).toBeCloseTo(14, 5);
  });

  it("계획 예산이 없으면 소진율/잔여는 null이다 (0으로 대체하지 않는다)", () => {
    const result = computeBudgetSummary({
      plannedMonthlyBudget: null,
      plannedDailyBudget: null,
      actualTotalSpend: 500_000,
      actualDataDayCount: 5,
    });

    expect(result.budgetUsageRate).toBeNull();
    expect(result.budgetRemainingOrOverage).toBeNull();
    expect(result.actualDailyAvgSpend).toBe(100_000);
  });

  it("실데이터가 0일이면 일평균/30일 예상은 null이다", () => {
    const result = computeBudgetSummary({
      plannedMonthlyBudget: 10_000_000,
      plannedDailyBudget: null,
      actualTotalSpend: 0,
      actualDataDayCount: 0,
    });

    expect(result.actualDailyAvgSpend).toBeNull();
    expect(result.projected30DaySpend).toBeNull();
  });

  it("실집행이 계획을 초과하면 잔여는 음수(초과)로 표시된다", () => {
    const result = computeBudgetSummary({
      plannedMonthlyBudget: 1_000_000,
      plannedDailyBudget: null,
      actualTotalSpend: 1_200_000,
      actualDataDayCount: 10,
    });

    expect(result.budgetRemainingOrOverage).toBe(-200_000);
    expect(result.budgetUsageRate).toBeCloseTo(120, 5);
  });
});
