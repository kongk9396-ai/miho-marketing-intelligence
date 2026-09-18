const fs = require("fs");

const path = "./app/report/meta-weekly-share/page.tsx";
let s = fs.readFileSync(path, "utf8");

const marker = `        <section className="mt-7 grid gap-4 md:grid-cols-3">`;

const block = `
        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-bold">광고별 광고비 집행 현황</h2>
            <p className="mt-1 text-sm text-gray-500">
              2026-08-31 ~ 2026-09-06 기준
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <p className="text-xs font-bold text-orange-600">광고비 TOP</p>
              <h3 className="mt-2 text-lg font-bold">눈밑지_최선다해2</h3>
              <p className="mt-2 text-3xl font-bold">₩321,900</p>
              <p className="mt-2 text-sm text-gray-600">
                이번 기간 가장 많은 광고비가 집행된 소재
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold text-gray-500">광고비 LOW</p>
              <h3 className="mt-2 text-lg font-bold">눈밑지_최예원</h3>
              <p className="mt-2 text-3xl font-bold">₩1,883</p>
              <p className="mt-2 text-sm text-gray-600">
                집행량이 적어 성과 판단에는 표본이 부족합니다.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b px-5 py-4">
              <h3 className="font-bold">광고비 순위</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-5 py-4 text-left">순위</th>
                    <th className="px-5 py-4 text-left">광고</th>
                    <th className="px-5 py-4 text-right">광고비</th>
                    <th className="px-5 py-4 text-right">CTR</th>
                    <th className="px-5 py-4 text-right">CPC</th>
                    <th className="px-5 py-4 text-right">LPV당 비용</th>
                  </tr>
                </thead>

                <tbody>
                  {[
                    ["1", "눈밑지_최선다해2", "₩321,900", "2.07%", "₩2,728", "₩2,981"],
                    ["2", "코재수술_0831", "₩290,314", "5.02%", "₩987", "₩58,063"],
                    ["3", "눈밑지_최선다해1", "₩180,872", "2.14%", "₩3,066", "₩3,547"],
                    ["4", "260814_남자코", "₩162,574", "1.51%", "₩3,126", "₩3,613"],
                    ["5", "A_첫코_릴스_소재A", "₩58,655", "1.80%", "₩3,087", "₩3,910"],
                    ["6", "비포애프터", "₩17,614", "0.73%", "₩8,807", "₩17,614"],
                    ["7", "눈밑지_최예원", "₩1,883", "8.82%", "₩628", "₩942"]
                  ].map(([rank, ad, spend, ctr, cpc, lpv]) => (
                    <tr key={ad} className="border-t">
                      <td className="px-5 py-4 font-medium">{rank}</td>
                      <td className="px-5 py-4">{ad}</td>
                      <td className="px-5 py-4 text-right font-semibold">{spend}</td>
                      <td className="px-5 py-4 text-right">{ctr}</td>
                      <td className="px-5 py-4 text-right">{cpc}</td>
                      <td className="px-5 py-4 text-right">{lpv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

`;

if (!s.includes(marker)) {
  throw new Error("삽입 위치를 찾지 못했습니다.");
}

if (s.includes("광고별 광고비 집행 현황")) {
  console.log("이미 광고비 순위 섹션이 있습니다.");
} else {
  s = s.replace(marker, block + marker);
  fs.writeFileSync(path, s, "utf8");
  console.log("✅ 광고비 TOP/LOW + 순위표 화면 추가 완료");
}
