import { describe, expect, it } from "vitest";
import { getMostRecentCompletedWeek } from "@/lib/reports/period";

describe("getMostRecentCompletedWeek", () => {
  it("오늘이 8/24(월)이면 지난주 8/17(월)~8/23(일)을 반환한다", () => {
    expect(getMostRecentCompletedWeek("2026-08-24")).toEqual({ start: "2026-08-17", end: "2026-08-23" });
  });

  it("오늘이 일요일(8/23)이어도 아직 완료되지 않은 이번 주는 포함하지 않는다", () => {
    expect(getMostRecentCompletedWeek("2026-08-23")).toEqual({ start: "2026-08-10", end: "2026-08-16" });
  });

  it("오늘이 수요일(8/19)이어도 지난주 전체를 반환한다", () => {
    expect(getMostRecentCompletedWeek("2026-08-19")).toEqual({ start: "2026-08-10", end: "2026-08-16" });
  });
});
