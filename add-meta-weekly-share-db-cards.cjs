const fs = require("fs");
const path = require("path");

const root = process.cwd();
const pagePath = path.join(root, "app", "report", "meta-weekly-share", "page.tsx");
const componentDir = path.join(root, "components", "report");
const componentPath = path.join(componentDir, "landing-db-summary.tsx");

if (!fs.existsSync(pagePath)) {
  console.error("❌ 대상 파일을 찾지 못했습니다:");
  console.error(pagePath);
  console.error("\n먼저 아래 명령으로 실제 경로를 확인해 주세요:");
  console.error('Get-ChildItem .\\app -Recurse -File | Select-String "meta-weekly-share"');
  process.exit(1);
}

fs.mkdirSync(componentDir, { recursive: true });

const component = `export function LandingDbSummary() {
  const items = [
    { startDate: "2026.08.25", name: "눈밑지 · 최선다해", count: 6 },
    { startDate: "2026.08.31", name: "코재 · S원장님", count: 7 },
    { startDate: "2026.08.11", name: "첫코 · 타나카", count: 1 },
    { startDate: "2026.08.14", name: "남자코 · 권태양", count: 8 },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">랜딩별 DB 현황</h2>
        <p className="mt-1 text-xs text-gray-500">
          랜딩 시작일 기준 누적 DB
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.name}
            className="rounded-xl border border-gray-200 bg-gray-50/60 p-4"
          >
            <div className="text-[11px] font-medium text-gray-400">
              랜딩 시작일 {item.startDate}
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-700">
              {item.name}
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
              {item.count}
              <span className="ml-1 text-sm font-semibold text-gray-500">건</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

fs.writeFileSync(componentPath, component, "utf8");

let src = fs.readFileSync(pagePath, "utf8");
const backup = `${pagePath}.bak_landing_db_${new Date().toISOString().replace(/[:.]/g, "-")}`;
fs.copyFileSync(pagePath, backup);

const importLine = `import { LandingDbSummary } from "@/components/report/landing-db-summary";`;

if (!src.includes(importLine)) {
  const importMatches = [...src.matchAll(/^import .*;$/gm)];
  if (!importMatches.length) {
    console.error("❌ import 위치를 찾지 못했습니다. page.tsx 상단 구조를 확인해야 합니다.");
    process.exit(1);
  }
  const last = importMatches[importMatches.length - 1];
  const pos = last.index + last[0].length;
  src = src.slice(0, pos) + "\n" + importLine + src.slice(pos);
}

if (!src.includes("<LandingDbSummary />")) {
  const sectionIndex = src.indexOf("<section");
  if (sectionIndex === -1) {
    console.error("❌ 첫 <section> 위치를 찾지 못했습니다. page.tsx 화면 구조를 확인해야 합니다.");
    process.exit(1);
  }

  src =
    src.slice(0, sectionIndex) +
    `<LandingDbSummary />\n\n      ` +
    src.slice(sectionIndex);
}

fs.writeFileSync(pagePath, src, "utf8");

console.log("✅ /report/meta-weekly-share 화면에 랜딩별 DB 카드 4개를 추가했습니다.");
console.log("   - 눈밑지 · 최선다해: 6건 / 2026.08.25");
console.log("   - 코재 · S원장님: 7건 / 2026.08.31");
console.log("   - 첫코 · 타나카: 1건 / 2026.08.11");
console.log("   - 남자코 · 권태양: 8건 / 2026.08.14");
console.log("🛟 백업:", backup);
console.log("📄 컴포넌트:", componentPath);
