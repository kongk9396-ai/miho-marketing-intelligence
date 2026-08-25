export interface BudgetSummaryInput {
  plannedMonthlyBudget: number | null;
  plannedDailyBudget: number | null;
  actualTotalSpend: number;
  /** Count of distinct calendar days that actually have meta_daily data — never a gap-filled day count. */
  actualDataDayCount: number;
}

export interface BudgetSummary {
  plannedMonthlyBudget: number | null;
  plannedDailyBudget: number | null;
  actualTotalSpend: number;
  actualDataDayCount: number;
  /** actualTotalSpend / actualDataDayCount. Null when there's no spend data at all — never divides by a gap-filled day count. */
  actualDailyAvgSpend: number | null;
  /** actualDailyAvgSpend * 30. Always an estimate ("현재 N일 실데이터 기준 예상"), never a commitment. */
  projected30DaySpend: number | null;
  /** plannedMonthlyBudget - actualTotalSpend. Positive = remaining, negative = overage. Null when no planned budget is registered. */
  budgetRemainingOrOverage: number | null;
  /** actualTotalSpend / plannedMonthlyBudget * 100. Null when no planned budget is registered or it's 0. */
  budgetUsageRate: number | null;
}

/**
 * Shared by both the overall-account and the per-campaign budget cards —
 * same shape either way, only the inputs differ. Every "actual" figure comes
 * from real meta_daily aggregates passed in by the caller; this function
 * itself never queries or guesses at missing days.
 */
export function computeBudgetSummary(input: BudgetSummaryInput): BudgetSummary {
  const actualDailyAvgSpend =
    input.actualDataDayCount > 0 ? input.actualTotalSpend / input.actualDataDayCount : null;
  const projected30DaySpend = actualDailyAvgSpend !== null ? actualDailyAvgSpend * 30 : null;
  const budgetRemainingOrOverage =
    input.plannedMonthlyBudget !== null ? input.plannedMonthlyBudget - input.actualTotalSpend : null;
  const budgetUsageRate =
    input.plannedMonthlyBudget !== null && input.plannedMonthlyBudget > 0
      ? (input.actualTotalSpend / input.plannedMonthlyBudget) * 100
      : null;

  return {
    plannedMonthlyBudget: input.plannedMonthlyBudget,
    plannedDailyBudget: input.plannedDailyBudget,
    actualTotalSpend: input.actualTotalSpend,
    actualDataDayCount: input.actualDataDayCount,
    actualDailyAvgSpend,
    projected30DaySpend,
    budgetRemainingOrOverage,
    budgetUsageRate,
  };
}
