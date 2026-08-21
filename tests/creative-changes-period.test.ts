import { describe, expect, it } from "vitest";
import { computeComparisonPeriods, computeObservationProgress } from "@/lib/creative-changes/period";

describe("computeComparisonPeriods — 동일 기간 계산 및 변경 당일 제외", () => {
  it("변경일 8/18, 5일 기준이면 전/후 기간이 각각 5일이고 8/18은 포함되지 않는다", () => {
    const { before, after, changeDateKst } = computeComparisonPeriods("2026-08-18T10:00:00.000Z", 5);

    expect(changeDateKst).toBe("2026-08-18");
    expect(before).toEqual({ start: "2026-08-13", end: "2026-08-17" });
    expect(after).toEqual({ start: "2026-08-19", end: "2026-08-23" });
  });

  it.each([3, 5, 7])("periodDays=%i 이면 전/후 기간 길이가 동일하다", (periodDays) => {
    const { before, after } = computeComparisonPeriods("2026-08-18T10:00:00.000Z", periodDays);

    const beforeDays =
      (new Date(before.end).getTime() - new Date(before.start).getTime()) / 86_400_000 + 1;
    const afterDays = (new Date(after.end).getTime() - new Date(after.start).getTime()) / 86_400_000 + 1;

    expect(beforeDays).toBe(periodDays);
    expect(afterDays).toBe(periodDays);
    expect(beforeDays).toBe(afterDays);
  });

  it("KST 자정 근처 시각도 올바른 날짜로 처리한다 (UTC 15:30 = KST 00:30 다음날)", () => {
    // 2026-08-17T15:30:00Z is 2026-08-18 00:30 KST
    const { changeDateKst } = computeComparisonPeriods("2026-08-17T15:30:00.000Z", 5);
    expect(changeDateKst).toBe("2026-08-18");
  });
});

describe("computeObservationProgress", () => {
  it("변경 당일에는 daysElapsed가 0이다", () => {
    const progress = computeObservationProgress(
      "2026-08-18T10:00:00.000Z",
      5,
      new Date("2026-08-18T12:00:00.000Z")
    );
    expect(progress.daysElapsed).toBe(0);
    expect(progress.isObservationWindowComplete).toBe(false);
  });

  it("D+3 / 5일 진행 상태를 올바르게 계산한다", () => {
    const progress = computeObservationProgress(
      "2026-08-18T10:00:00.000Z",
      5,
      new Date("2026-08-21T10:00:00.000Z")
    );
    expect(progress.daysElapsed).toBe(3);
    expect(progress.daysElapsedCapped).toBe(3);
    expect(progress.isObservationWindowComplete).toBe(false);
  });

  it("후 기간 마지막 날 데이터까지 확보된 뒤에만 관찰 완료로 판단한다", () => {
    // after period ends 8/23; data for 8/23 is assumed available starting 8/24.
    const notYetComplete = computeObservationProgress(
      "2026-08-18T10:00:00.000Z",
      5,
      new Date("2026-08-23T10:00:00.000Z")
    );
    expect(notYetComplete.isObservationWindowComplete).toBe(false);

    const complete = computeObservationProgress(
      "2026-08-18T10:00:00.000Z",
      5,
      new Date("2026-08-24T10:00:00.000Z")
    );
    expect(complete.isObservationWindowComplete).toBe(true);
  });
});
