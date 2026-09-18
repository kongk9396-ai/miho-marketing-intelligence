const fs = require("fs");

const path = "./app/report/page.tsx";
let s = fs.readFileSync(path, "utf8");

const target = `          <PageHeader
            title="요약 보고"
            description="광고부터 문의·예약까지 핵심 결과를 한눈에 확인합니다."
          />`;

const replacement = `          <PageHeader
            title="요약 보고"
            description="광고부터 문의·예약까지 핵심 결과를 한눈에 확인합니다."
          />

          <div className="mb-5">
            <Link
              href="/report/meeting"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              회의용 주간 보고 열기 →
            </Link>
          </div>`;

if (!s.includes(target)) {
  throw new Error("오류 화면 PageHeader 위치를 찾지 못했습니다.");
}

s = s.replace(target, replacement);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 오류 상태에서도 회의용 보고 버튼 표시 완료");
