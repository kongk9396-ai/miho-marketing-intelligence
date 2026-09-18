const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

// 1. 눈 시트 자체를 under_eye로 인식
s = s.replace(
`  if (
    combined.includes("눈밑") ||
    combined.includes("눈밑지")
  ) {
    return "under_eye";
  }`,
`  if (
    sheetName.trim() === "눈" ||
    combined.includes("눈밑") ||
    combined.includes("눈밑지") ||
    combined.includes("하안검")
  ) {
    return "under_eye";
  }`
);

// 2. 후보 시트 목록에도 '눈' 추가
s = s.replace(
`        n.includes("코첫") ||
        n.includes("첫코") ||
        n.includes("눈밑") ||
        n.includes("상담db") ||`,
`        n.includes("코첫") ||
        n.includes("첫코") ||
        n === "눈" ||
        n.includes("눈밑") ||
        n.includes("상담db") ||`
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 코첫 / 눈 시트 분리 인식 완료");
