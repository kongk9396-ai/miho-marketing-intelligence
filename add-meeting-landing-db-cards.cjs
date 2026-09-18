const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'app', 'report', 'meeting', 'page.tsx');
const markerStart = '{/* MIHO_LANDING_DB_SUMMARY_START */}';
const markerEnd = '{/* MIHO_LANDING_DB_SUMMARY_END */}';

if (!fs.existsSync(target)) {
  console.error(`❌ 파일을 찾을 수 없습니다: ${target}`);
  console.error('miho-marketing-intelligence 프로젝트 루트에서 실행해주세요.');
  process.exit(1);
}

let src = fs.readFileSync(target, 'utf8');
const backup = `${target}.bak_landing_db_${new Date().toISOString().replace(/[:.]/g, '-')}`;
fs.copyFileSync(target, backup);

const block = `
      ${markerStart}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-950">랜딩별 DB 현황</h2>
          <p className="mt-1 text-xs text-gray-500">
            랜딩 시작일 기준 누적 DB
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { startDate: "2026.08.25", name: "눈밑지 · 최선다해", count: 6 },
            { startDate: "2026.08.31", name: "코재 · S원장님", count: 7 },
            { startDate: "2026.08.11", name: "첫코 · 타나카", count: 1 },
            { startDate: "2026.08.14", name: "남자코 · 권태양", count: 8 },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-4 sm:px-5"
            >
              <div className="text-[11px] font-medium tracking-tight text-gray-400">
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
      ${markerEnd}
`;

// 이미 넣은 적이 있으면 해당 섹션만 최신 값으로 교체.
const start = src.indexOf(markerStart);
const end = src.indexOf(markerEnd);
if (start !== -1 && end !== -1 && end > start) {
  const lineStart = src.lastIndexOf('\n', start) + 1;
  const lineEndPos = src.indexOf('\n', end);
  const lineEnd = lineEndPos === -1 ? src.length : lineEndPos + 1;
  src = src.slice(0, lineStart) + block + src.slice(lineEnd);
  fs.writeFileSync(target, src, 'utf8');
  console.log('✅ 기존 랜딩별 DB 현황 섹션을 최신 값으로 교체했습니다.');
  console.log(`🛟 백업: ${backup}`);
  process.exit(0);
}

const returnIndex = src.indexOf('return (');
if (returnIndex === -1) {
  console.error('❌ page.tsx에서 return ( 위치를 찾지 못했습니다. 파일은 변경하지 않았습니다.');
  process.exit(1);
}

// return 이후 첫 section 앞에 넣되, section 이전에 wrapper(div/main/fragment)가 있는지 확인.
const firstSection = src.indexOf('<section', returnIndex);
if (firstSection === -1) {
  console.error('❌ 삽입 기준이 될 <section>을 찾지 못했습니다. 파일은 변경하지 않았습니다.');
  process.exit(1);
}

const beforeSection = src.slice(returnIndex, firstSection);
const hasWrapper = /<(main|div)\b[^>]*>|<>/.test(beforeSection);
if (!hasWrapper) {
  console.error('❌ JSX 최상위 구조를 안전하게 확인하지 못해 자동 삽입을 중단했습니다.');
  console.error('백업만 생성했고 원본은 변경하지 않았습니다.');
  process.exit(1);
}

src = src.slice(0, firstSection) + block + src.slice(firstSection);
fs.writeFileSync(target, src, 'utf8');

console.log('✅ 미팅 화면에 랜딩별 DB 현황 카드 4개를 추가했습니다.');
console.log('   - 눈밑지 · 최선다해: 6건 / 2026.08.25');
console.log('   - 코재 · S원장님: 7건 / 2026.08.31');
console.log('   - 첫코 · 타나카: 1건 / 2026.08.11');
console.log('   - 남자코 · 권태양: 8건 / 2026.08.14');
console.log(`🛟 백업: ${backup}`);
