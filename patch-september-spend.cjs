const fs = require("fs");

const path = "./app/report/meta-weekly-share/page.tsx";
let s = fs.readFileSync(path, "utf8");

const oldBlock = `
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">광고비</p>
            <p className="mt-2 text-2xl font-bold">{won(current.spend)}</p>
          </div>
`;

const newBlock = `
        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">이번 주 광고비</p>
            <p className="mt-2 text-2xl font-bold">{won(current.spend)}</p>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <p className="text-sm text-violet-700">9월 누적 광고비</p>
            <p className="mt-2 text-2xl font-bold">₩922,858</p>
            <p className="mt-1 text-xs text-violet-600">9/1 ~ 9/7 기준</p>
          </div>
`;

if (!s.includes(oldBlock)) {
  throw new Error("상단 광고비 카드 위치를 찾지 못했습니다.");
}

s = s.replace(oldBlock, newBlock);

fs.writeFileSync(path, s, "utf8");
console.log("✅ 9월 누적 광고비 ₩922,858 추가 완료");
