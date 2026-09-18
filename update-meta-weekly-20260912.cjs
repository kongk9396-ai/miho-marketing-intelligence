const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "app",
  "report",
  "meta-weekly-share",
  "page.tsx"
);

if (!fs.existsSync(target)) {
  throw new Error("대상 파일 없음: " + target);
}

let src = fs.readFileSync(target, "utf8");

const marker = "DB_WEEK_COMPARE_20260912";

if (src.includes(marker)) {
  console.log("이미 이번 주 DB 비교 섹션이 들어가 있습니다.");
  process.exit(0);
}

const backup =
  target +
  ".bak_" +
  new Date().toISOString().replace(/[:.]/g, "-");

fs.copyFileSync(target, backup);
console.log("백업 생성:", backup);

const block = String.raw`
        {/* DB_WEEK_COMPARE_20260912 */}
        <section className="mt-8 space-y-5">
          <div>
            <div className="text-sm text-zinc-500">
              2026.08.30 - 09.05 vs 2026.09.06 - 09.12
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              전주 대비 DB 유입
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              전체 DB는 20건에서 15건으로 5건 감소했습니다.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">전체 DB</div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold">15건</span>
                <span className="pb-1 text-sm font-semibold text-red-500">
                  -5건 (-25.0%)
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                이전 기간 20건
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">코재수술 DB</div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold">3건</span>
                <span className="pb-1 text-sm font-semibold text-red-500">
                  -4건 (-57.1%)
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                이전 기간 7건
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">첫코 DB</div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold">3건</span>
                <span className="pb-1 text-sm font-semibold text-red-500">
                  -6건 (-66.7%)
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                이전 기간 9건
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">눈밑 DB</div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold">9건</span>
                <span className="pb-1 text-sm font-semibold text-emerald-600">
                  +5건 (+125.0%)
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                이전 기간 4건
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="font-semibold">DB 상세 비교</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">구분</th>
                    <th className="px-5 py-3 text-right font-medium">8/30~9/5</th>
                    <th className="px-5 py-3 text-right font-medium">9/6~9/12</th>
                    <th className="px-5 py-3 text-right font-medium">증감</th>
                    <th className="px-5 py-3 text-right font-medium">증감률</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-5 py-4 font-medium">코재수술</td>
                    <td className="px-5 py-4 text-right">7</td>
                    <td className="px-5 py-4 text-right">3</td>
                    <td className="px-5 py-4 text-right font-semibold text-red-500">-4</td>
                    <td className="px-5 py-4 text-right font-semibold text-red-500">-57.1%</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">첫코</td>
                    <td className="px-5 py-4 text-right">9</td>
                    <td className="px-5 py-4 text-right">3</td>
                    <td className="px-5 py-4 text-right font-semibold text-red-500">-6</td>
                    <td className="px-5 py-4 text-right font-semibold text-red-500">-66.7%</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">눈밑</td>
                    <td className="px-5 py-4 text-right">4</td>
                    <td className="px-5 py-4 text-right">9</td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-600">+5</td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-600">+125.0%</td>
                  </tr>

                  <tr className="bg-zinc-50 font-semibold">
                    <td className="px-5 py-4">합계</td>
                    <td className="px-5 py-4 text-right">20</td>
                    <td className="px-5 py-4 text-right">15</td>
                    <td className="px-5 py-4 text-right text-red-500">-5</td>
                    <td className="px-5 py-4 text-right text-red-500">-25.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold">Meta 광고 집행 현황</h3>
              <p className="text-xs text-zinc-400">
                광고 관리자 CSV 집계 기간: 2026.08.31 - 09.13
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs text-zinc-500">광고비</div>
                <div className="mt-1 text-xl font-bold">₩1,941,499</div>
              </div>

              <div>
                <div className="text-xs text-zinc-500">노출</div>
                <div className="mt-1 text-xl font-bold">69,660</div>
              </div>

              <div>
                <div className="text-xs text-zinc-500">전체 클릭</div>
                <div className="mt-1 text-xl font-bold">2,150</div>
              </div>

              <div>
                <div className="text-xs text-zinc-500">링크 클릭</div>
                <div className="mt-1 text-xl font-bold">1,403</div>
              </div>

              <div>
                <div className="text-xs text-zinc-500">전체 CTR</div>
                <div className="mt-1 text-xl font-bold">3.09%</div>
              </div>

              <div>
                <div className="text-xs text-zinc-500">링크 CTR</div>
                <div className="mt-1 text-xl font-bold">2.01%</div>
              </div>

              <div>
                <div className="text-xs text-zinc-500">링크 CPC</div>
                <div className="mt-1 text-xl font-bold">₩1,384</div>
              </div>

              <div>
                <div className="text-xs text-zinc-500">전체 DB 변화</div>
                <div className="mt-1 text-xl font-bold text-red-500">-25.0%</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <h3 className="font-semibold">주간 분석</h3>
            <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              <p>
                전체 DB는 20건에서 15건으로 전주 대비 5건(-25.0%) 감소했습니다.
              </p>
              <p>
                코재수술은 7건에서 3건으로 4건(-57.1%), 첫코는 9건에서
                3건으로 6건(-66.7%) 감소해 전체 DB 감소의 주요 요인으로 확인됩니다.
              </p>
              <p>
                반면 눈밑 DB는 4건에서 9건으로 5건(+125.0%) 증가해
                코재 및 첫코의 감소분을 일부 상쇄했습니다.
              </p>
              <p>
                다음 주에는 코재·첫코의 광고 유입량과 랜딩 이후 전환율을
                분리 확인하고, 증가세를 보인 눈밑 캠페인은 소재 및 타겟 조건을
                유지하면서 추가 추이를 확인할 필요가 있습니다.
              </p>
            </div>
          </div>
        </section>
`;

const closeMain = src.lastIndexOf("</main>");

if (closeMain === -1) {
  throw new Error(
    "</main>을 찾지 못했습니다. 기존 페이지 구조를 보호하기 위해 수정하지 않았습니다."
  );
}

src = src.slice(0, closeMain) + block + "\n" + src.slice(closeMain);

fs.writeFileSync(target, src, "utf8");

console.log("완료: DB 전주 비교 + Meta 전체기간 현황 추가");
console.log("수정 파일:", target);
