import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createGa4Client, getGa4PropertyId, getMissingGa4EnvVars, isGa4Configured } from "@/lib/ga4/client";

const ENV_KEYS = ["GA4_PROPERTY_ID", "GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY"] as const;

describe("GA4 client — 인증 설정 누락", () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      original[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it("환경변수가 하나도 없으면 isGa4Configured가 false를 반환한다", () => {
    expect(isGa4Configured()).toBe(false);
  });

  it("일부 환경변수만 설정되어 있어도 isGa4Configured는 false를 반환한다", () => {
    process.env.GA4_PROPERTY_ID = "123456";
    expect(isGa4Configured()).toBe(false);
  });

  it("모든 환경변수가 설정되어 있으면 isGa4Configured는 true를 반환한다", () => {
    process.env.GA4_PROPERTY_ID = "123456";
    process.env.GOOGLE_CLIENT_EMAIL = "svc@example.iam.gserviceaccount.com";
    process.env.GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----";
    expect(isGa4Configured()).toBe(true);
  });

  it("GA4_PROPERTY_ID가 없으면 getGa4PropertyId가 한국어 오류를 던진다", () => {
    expect(() => getGa4PropertyId()).toThrow(/GA4_PROPERTY_ID/);
  });

  it("서비스 계정 정보가 없으면 createGa4Client가 오류를 던진다", () => {
    expect(() => createGa4Client()).toThrow(/GOOGLE_CLIENT_EMAIL/);
  });

  it("getMissingGa4EnvVars가 누락된 환경변수 이름만 반환한다", () => {
    process.env.GA4_PROPERTY_ID = "123456";
    expect(getMissingGa4EnvVars()).toEqual(["GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY"]);
  });
});
