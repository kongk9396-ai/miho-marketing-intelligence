import { describe, expect, it } from "vitest";
import { computeOperatingDaySummary } from "@/lib/ad-operations/operating-days";

describe("computeOperatingDaySummary", () => {
  it("공식 시작일 8/11, 오늘 8/24이면 운영 14일째", () => {
    const result = computeOperatingDaySummary("2026-08-11", "2026-08-12", "2026-08-24");
    expect(result.operatingDayCount).toBe(14);
    expect(result.officialStartDate).toBe("2026-08-11");
    expect(result.dataFirstDate).toBe("2026-08-12");
  });

  it("공식 시작일 미등록이면 operatingDayCount는 null이고 dataFirstDate만 표시된다", () => {
    const result = computeOperatingDaySummary(null, "2026-08-12", "2026-08-24");
    expect(result.operatingDayCount).toBeNull();
    expect(result.officialStartDate).toBeNull();
    expect(result.dataFirstDate).toBe("2026-08-12");
  });

  it("공식 시작일이 오늘 기준 미래이면 operatingDayCount는 null", () => {
    const result = computeOperatingDaySummary("2026-09-01", null, "2026-08-24");
    expect(result.operatingDayCount).toBeNull();
  });

  it("공식 시작일이 오늘이면 운영 1일째", () => {
    const result = computeOperatingDaySummary("2026-08-24", "2026-08-24", "2026-08-24");
    expect(result.operatingDayCount).toBe(1);
  });
});
