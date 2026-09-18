const fs = require("fs");

const path = "./lib/leads-sync/attribution-repository.ts";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
`  utm_content: ["utm_content", "utm_content(콘텐츠)", "콘텐츠", "소재"],`,
`  utm_content: [
    "utm_content",
    "utm_content(콘텐츠)",
    "utm_content(콘텐츠 구분)",
    "콘텐츠",
    "콘텐츠 구분",
    "소재",
  ],`
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ utm_content(콘텐츠 구분) 헤더 인식 추가 완료");
