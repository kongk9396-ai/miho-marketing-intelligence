const fs = require("fs");

const path = "./app/report/page.tsx";
let s = fs.readFileSync(path, "utf8");

const oldText = `      <PageHeader
        title="요약 보고"
        description="광고 성과부터 문의·예약까지, 지금 알아야 할 내용만 정리했습니다."
      />

      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-4">`;

const newText = `      <PageHeader
        title="요약 보고"
        description="광고 성과부터 문의·예약까지, 지금 알아야 할 내용만 정리했습니다."
      />

      <div className="mb-5">
        <Link
          href="/report/meeting"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          회의용 주간 보고 열기 →
        </Link>
      </div>

      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-4">`;

if (!s.includes(oldText)) {
  throw new Error("요약 보고 PageHeader 위치를 찾지 못했습니다.");
}

s = s.replace(oldText, newText);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 회의용 주간 보고 버튼 추가 완료");
