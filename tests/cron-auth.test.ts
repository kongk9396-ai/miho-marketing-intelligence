import { describe, expect, it } from "vitest";
import { checkCronSecret } from "@/lib/cron-auth";

describe("checkCronSecret", () => {
  it("올바른 Bearer 토큰이면 true를 반환한다", () => {
    expect(checkCronSecret("Bearer my-secret", "my-secret")).toBe(true);
  });

  it("잘못된 토큰이면 false를 반환한다", () => {
    expect(checkCronSecret("Bearer wrong-secret", "my-secret")).toBe(false);
  });

  it("Authorization 헤더가 없으면 false를 반환한다", () => {
    expect(checkCronSecret(null, "my-secret")).toBe(false);
  });

  it("Bearer 형식이 아니면 false를 반환한다", () => {
    expect(checkCronSecret("my-secret", "my-secret")).toBe(false);
  });

  it("CRON_SECRET 환경변수가 설정되지 않았으면 항상 false를 반환한다", () => {
    expect(checkCronSecret("Bearer anything", undefined)).toBe(false);
  });
});
