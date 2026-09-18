const fs = require("fs");

const path = "./app/report/meeting-share/page.tsx";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
`          {[
            ["1. 랜딩 진입", num(s.landingSessions)],
            ["2. CTA 클릭", num(s.ctaClicks)],
            ["3. 폼 시작", num(s.formStarts)],
            ["4. 실제 문의(DB)", num(s.actualDb)],
          ].map(([label, value]) => (`,
`          {[
            ["실제 문의(DB)", num(s.actualDb)],
            ["코첫 문의", num(data.landings.find((x: any) => x.name === "코첫")?.actualDb ?? 0)],
            ["눈밑 문의", num(data.landings.find((x: any) => x.name === "눈밑")?.actualDb ?? 0)],
          ].map(([label, value]) => (`
);

s = s.replace(
  `className="mt-5 grid gap-4 md:grid-cols-4"`,
  `className="mt-5 grid gap-4 md:grid-cols-3"`
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ CTA 완전 제거 + 실제 DB 중심으로 변경 완료");
