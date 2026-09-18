const fs = require("fs");
const path = require("path");

const root = process.cwd();
const componentPath = path.join(root, "components", "report", "landing-db-summary.tsx");

if (!fs.existsSync(componentPath)) {
  console.error("❌ 컴포넌트를 찾지 못했습니다:");
  console.error(componentPath);
  process.exit(1);
}

const backup = `${componentPath}.bak_source_${new Date().toISOString().replace(/[:.]/g, "-")}`;
fs.copyFileSync(componentPath, backup);

const component = `export function LandingDbSummary() {
  const items = [
    {
      startDate: "2026.08.25",
      landing: "눈밑지 랜딩",
      source: "최선다해",
      count: 6,
    },
    {
      startDate: "2026.08.31",
      landing: "코재 랜딩",
      source: "S원장님",
      count: 7,
    },
    {
      startDate: "2026.08.11",
      landing: "첫코 랜딩",
      source: "타나카",
      count: 1,
    },
    {
      startDate: "2026.08.14",
      landing: "남자코 랜딩",
      source: "권태양",
      count: 8,
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">랜딩별 DB 현황</h2>
        <p className="mt-1 text-xs text-gray-500">
          랜딩 시작일과 유입 소재 기준 누적 DB
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.landing + item.source}
            className="rounded-xl border border-gray-200 bg-gray-50/60 p-4"
          >
            <div className="text-[11px] font-medium text-gray-400">
              랜딩 시작일 {item.startDate}
            </div>

            <div className="mt-2 text-sm font-semibold text-gray-800">
              {item.landing}
            </div>

            <div className="mt-1 text-xs text-gray-500">
              유입 소재 <span className="font-semibold text-gray-700">{item.source}</span>
            </div>

            <div className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
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

console.log("✅ 랜딩별 DB 카드에 유입 소재를 추가했습니다.");
console.log("   - 눈밑지 랜딩 → 최선다해 → 6건");
console.log("   - 코재 랜딩 → S원장님 → 7건");
console.log("   - 첫코 랜딩 → 타나카 → 1건");
console.log("   - 남자코 랜딩 → 권태양 → 8건");
console.log("🛟 백업:", backup);
