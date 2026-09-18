const fs = require("fs");

const p = "./lib/ad-performance-summary/build.ts";
let s = fs.readFileSync(p, "utf8");

// range 타입이 없으면 추가
if (!s.includes("export interface AdPerformanceSummaryRange")) {
  const marker = "const REPORT_WINDOW_DAYS = 30;";

  if (!s.includes(marker)) {
    throw new Error("REPORT_WINDOW_DAYS 위치를 찾지 못했습니다.");
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

// 함수 선언 + 기본 기간 계산을 확실하게 교체
const re =
/export async function buildAdPerformanceSummary\(\): Promise<AdPerformanceSummary> \{\s*const today = toKstDateOnly\(new Date\(\)\.toISOString\(\)\);\s*const windowStart = addDaysToDateOnly\(today, -REPORT_WINDOW_DAYS\);/;

if (re.test(s)) {
  s = s.replace(
    re,
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
      : addDaysToDateOnly(today, -REPORT_WINDOW_DAYS);`
  );
} else if (
  !s.includes(
    "export async function buildAdPerformanceSummary(\n  range: AdPerformanceSummaryRange = {}"
  )
) {
  throw new Error("buildAdPerformanceSummary 선언 형태를 찾지 못했습니다.");
}

fs.writeFileSync(p, s, "utf8");

console.log("✅ buildAdPerformanceSummary 기간 인자 복구 완료");
