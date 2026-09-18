const fs = require("fs");

const path = "./lib/meta/header-aliases.ts";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("reporting_start:")) {
  s = s.replace(
    'export const HEADER_ALIASES: Record<string, string[]> = {',
`export const HEADER_ALIASES: Record<string, string[]> = {
  reporting_start: [
    "Reporting starts",
    "보고 시작",
    "보고 시작일",
  ],

  reporting_end: [
    "Reporting ends",
    "보고 종료",
    "보고 종료일",
  ],`
  );
}

fs.writeFileSync(path, s, "utf8");
console.log("✅ 보고 시작/종료 헤더 인식 추가");
