const fs = require("fs");

const path = "./lib/ad-performance-summary/build.ts";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("export interface AdPerformanceSummaryRange")) {
  const marker = "const REPORT_WINDOW_DAYS = 30;";

  if (!s.includes(marker)) {
    throw new Error("REPORT_WINDOW_DAYS를 찾지 못했습니다.");
  }

  s = s.replace(
    marker,
`export interface AdPerformanceSummaryRange {
  startDate?: string;
  endDate?: string;
}

${marker}`
  );
}

const oldSignature =
`export async function buildAdPerformanceSummary(): Promise<AdPerformanceSummary> {
  const today = toKstDateOnly(new Date().toISOString());
  const windowStart = addDaysToDateOnly(today, -REPORT_WINDOW_DAYS);`;

const newSignature =
`export async function buildAdPerformanceSummary(
  range: AdPerformanceSummaryRange = {}
): Promise<AdPerformanceSummary> {
  const defaultToday = toKstDateOnly(new Date().toISOString());

  const today =
    range.endDate && /^\\d{4}-\\d{2}-\\d{2}$/.test(range.endDate)
      ? range.endDate
      : defaultToday;

  const windowStart =
    range.startDate && /^\\d{4}-\\d{2}-\\d{2}$/.test(range.startDate)
      ? range.startDate
      : addDaysToDateOnly(today, -REPORT_WINDOW_DAYS);`;

if (s.includes(oldSignature)) {
  s = s.replace(oldSignature, newSignature);
} else if (!s.includes("range: AdPerformanceSummaryRange = {}")) {
  throw new Error("buildAdPerformanceSummary 함수 선언을 찾지 못했습니다.");
}

fs.writeFileSync(path, s, "utf8");

console.log("✅ buildAdPerformanceSummary 기간 인자 최종 수정 완료");
