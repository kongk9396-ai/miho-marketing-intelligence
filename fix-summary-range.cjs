const fs = require("fs");

const p = "./lib/ad-performance-summary/build.ts";
let s = fs.readFileSync(p, "utf8");

const oldText = `export async function buildAdPerformanceSummary(): Promise<AdPerformanceSummary> {
  const today = toKstDateOnly(new Date().toISOString());
  const windowStart = addDaysToDateOnly(today, -REPORT_WINDOW_DAYS);`;

const newText = `export interface AdPerformanceSummaryRange {
  startDate?: string;
  endDate?: string;
}

export async function buildAdPerformanceSummary(
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

if (!s.includes(oldText)) {
  throw new Error("buildAdPerformanceSummary 기존 선언을 찾지 못했습니다.");
}

s = s.replace(oldText, newText);

fs.writeFileSync(p, s, "utf8");

console.log("✅ buildAdPerformanceSummary 기간 인자 적용 완료");
