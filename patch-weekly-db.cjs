const fs = require("fs");
const path = "./app/report/meta-weekly-share/page.tsx";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
`          {[
            ["이번 주 광고비", won(current.spend)],
            ["노출", \`${"${num(current.impressions)}"}회\`],
            ["링크 클릭", \`${"${num(current.clicks)}"}회\`],
            ["랜딩 페이지 조회", \`${"${num(current.lpv)}"}회\`],
          ].map(([label, value]) => (`,
`          {[
            ["이번 주 광고비", won(current.spend)],
            ["실제 문의(DB)", "23건"],
            ["링크 클릭", \`${"${num(current.clicks)}"}회\`],
            ["랜딩 페이지 조회", \`${"${num(current.lpv)}"}회\`],
          ].map(([label, value]) => (`
);

s = s.replace(
`        <section className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white">`,
`        <section className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            ["코재 DB", "7건"],
            ["첫코 DB", "9건"],
            ["눈 DB", "7건"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white">`
);

fs.writeFileSync(path, s, "utf8");
console.log("✅ DB 23건 반영 완료");
