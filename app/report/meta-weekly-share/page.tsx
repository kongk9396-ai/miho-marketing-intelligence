import { LandingDbSummary } from "@/components/report/landing-db-summary";
﻿const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;
const num = (n: number) => n.toLocaleString("ko-KR");

export default function MetaWeeklySharePage() {
  const previous = {
    spend: 930951,
    impressions: 69231,
    clicks: 2795,
    lpv: 2297,
    ctr: 4.04,
    cpc: 333,
    lpvCost: 405,
    cpm: 13447,
  };

  const current = {
    spend: 1033812,
    impressions: 19116,
    clicks: 547,
    lpv: 227,
    ctr: 2.86,
    cpc: 1890,
    lpvCost: 4554,
    cpm: 54081,
  };

  const rows = [
    ["광고비", won(previous.spend), won(current.spend), "+11.0%"],
    ["노출", num(previous.impressions), num(current.impressions), "-72.4%"],
    ["링크 클릭", num(previous.clicks), num(current.clicks), "-80.4%"],
    ["랜딩 페이지 조회", num(previous.lpv), num(current.lpv), "-90.1%"],
    ["CTR", `${previous.ctr}%`, `${current.ctr}%`, "-29.1%"],
    ["CPC", won(previous.cpc), won(current.cpc), "+467.4%"],
    ["LPV당 비용", won(previous.lpvCost), won(current.lpvCost), "+1,023.7%"],
    ["CPM", won(previous.cpm), won(current.cpm), "+302.2%"],
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7">
          <p className="text-sm font-semibold text-gray-500">
            MIHO · META ADS
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            주간 Meta 광고 성과 보고
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            2026-08-31 ~ 2026-09-06 · 전주 대비
          </p>
        </header>

        <LandingDbSummary />

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

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">실제 문의(DB)</p>
            <p className="mt-2 text-2xl font-bold">23건</p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">링크 클릭</p>
            <p className="mt-2 text-2xl font-bold">{num(current.clicks)}</p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">랜딩 페이지 조회</p>
            <p className="mt-2 text-2xl font-bold">{num(current.lpv)}</p>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">첫코 DB</p>
            <p className="mt-2 text-2xl font-bold">9건</p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">코재 DB</p>
            <p className="mt-2 text-2xl font-bold">7건</p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">눈 DB</p>
            <p className="mt-2 text-2xl font-bold">7건</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">CTR</p>
            <p className="mt-2 text-xl font-bold">{current.ctr}%</p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">CPC</p>
            <p className="mt-2 text-xl font-bold">{won(current.cpc)}</p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">LPV당 비용</p>
            <p className="mt-2 text-xl font-bold">{won(current.lpvCost)}</p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">CPM</p>
            <p className="mt-2 text-xl font-bold">{won(current.cpm)}</p>
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border bg-white">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-bold">
              8/24~8/30 vs 8/31~9/6
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4 text-left">지표</th>
                  <th className="px-5 py-4 text-right">8/24~8/30</th>
                  <th className="px-5 py-4 text-right">8/31~9/6</th>
                  <th className="px-5 py-4 text-right">증감</th>
                </tr>
              </thead>

              <tbody>
                {rows.map(([label, prev, curr, change]) => (
                  <tr key={label} className="border-t">
                    <td className="px-5 py-4 font-medium">{label}</td>
                    <td className="px-5 py-4 text-right text-gray-500">
                      {prev}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {curr}
                    </td>
                    <td
                      className={`px-5 py-4 text-right font-semibold ${
                        change.startsWith("-")
                          ? "text-red-500"
                          : "text-orange-500"
                      }`}
                    >
                      {change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-bold">광고별 광고비 집행 현황</h2>
            <p className="mt-1 text-sm text-gray-500">
              2026-08-31 ~ 2026-09-06 기준
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <p className="text-xs font-bold text-orange-600">
                광고비 TOP
              </p>
              <h3 className="mt-2 text-lg font-bold">
                눈밑지_최선다해1
              </h3>
              <p className="mt-2 text-3xl font-bold">
                ₩321,900
              </p>
              <p className="mt-2 text-sm text-gray-600">
                CTR 2.07% · CPC ₩2,728
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold text-gray-500">
                광고비 LOW
              </p>
              <h3 className="mt-2 text-lg font-bold">
                눈밑지_최예원
              </h3>
              <p className="mt-2 text-3xl font-bold">
                ₩1,883
              </p>
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
                    ["1", "눈밑지_최선다해1", "₩321,900", "2.07%", "₩2,728", "₩2,981"],
                    ["2", "코재수술_0831", "₩290,314", "5.02%", "₩987", "₩58,063"],
                    ["3", "눈밑지_최선다해2", "₩180,872", "2.14%", "₩3,066", "₩3,547"],
                    ["4", "260814_남자코", "₩162,574", "1.51%", "₩3,126", "₩3,613"],
                    ["5", "A_첫코_릴스_소재A", "₩58,655", "1.80%", "₩3,087", "₩3,910"],
                    ["6", "비포애프터", "₩17,614", "0.73%", "₩8,807", "₩17,614"],
                    ["7", "눈밑지_최예원", "₩1,883", "8.82%", "₩628", "₩942"],
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


        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-bold">영상 · 랜딩 반응</h2>
            <p className="mt-1 text-sm text-gray-500">
              2026-08-31 ~ 2026-09-06 기준
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold text-violet-600">
                🎬 영상 완주율 TOP
              </p>

              <div className="mt-4 space-y-4">
                {[
                  {
                    name: "눈밑지_최선다해2",
                    views3: 1173,
                    complete: 344,
                    rate: 29.3
                  },
                  {
                    name: "눈밑지_최선다해1",
                    views3: 531,
                    complete: 155,
                    rate: 29.2
                  }
                ].map((v, index) => (
                  <div
                    key={v.name}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-gray-400">
                          {index === 0 ? "1위" : "2위"}
                        </p>
                        <p className="mt-1 font-semibold">{v.name}</p>
                      </div>

                      <p className="text-xl font-bold text-violet-700">
                        {v.rate.toFixed(1)}%
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      3초 시청 {v.views3.toLocaleString("ko-KR")}회 →
                      100% 완주 {v.complete.toLocaleString("ko-KR")}회
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-400">
                3초 이상 시청자 대비 100% 완주 기준
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold text-blue-600">
                🌐 랜딩 도달률 TOP
              </p>

              <div className="mt-4 space-y-3">
                {[
                  {
                    name: "눈밑지_최선다해2",
                    click: 118,
                    lpv: 108,
                    rate: 91.5
                  },
                  {
                    name: "260814_남자코",
                    click: 52,
                    lpv: 45,
                    rate: 86.5
                  },
                  {
                    name: "눈밑지_최선다해1",
                    click: 59,
                    lpv: 51,
                    rate: 86.4
                  },
                  {
                    name: "A_첫코_릴스_소재A",
                    click: 19,
                    lpv: 15,
                    rate: 78.9
                  }
                ].map((v, index) => (
                  <div
                    key={v.name}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div>
                      <p className="text-xs text-gray-400">{index + 1}위</p>
                      <p className="mt-1 font-semibold">{v.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        클릭 {v.click} → LPV {v.lpv}
                      </p>
                    </div>

                    <p className="text-xl font-bold text-blue-700">
                      {v.rate.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-400">
                링크 클릭 대비 실제 랜딩 페이지 조회 기준
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold text-red-500">
                  ⚠️ 확인 필요
                </p>
                <h3 className="mt-2 text-lg font-bold">
                  코재수술_0831
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  링크 클릭 294회 대비 랜딩 페이지 조회가 5회로,
                  랜딩 도달률이 1.7%에 불과합니다.
                </p>
              </div>

              <div className="rounded-xl bg-white px-5 py-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">랜딩 도달률</p>
                <p className="mt-1 text-3xl font-bold text-red-500">
                  1.7%
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-red-700">
              링크 연결, 랜딩 로딩, URL 설정 또는 집계 상태를 우선 확인할 필요가 있습니다.
            </p>
          </div>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-xs font-bold text-red-500">CHECK</p>
            <h3 className="mt-2 font-bold">유입량 급감</h3>
            <p className="mt-2 text-sm leading-6">
              광고비는 전주 대비 11% 증가했지만 노출은 72.4%,
              링크 클릭은 80.4%, LPV는 90.1% 감소했습니다.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-bold text-amber-600">COST</p>
            <h3 className="mt-2 font-bold">유입 비용 상승</h3>
            <p className="mt-2 text-sm leading-6">
              CPC는 333원에서 1,890원, LPV당 비용은
              405원에서 4,554원으로 상승했습니다.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-bold text-blue-600">ACTION</p>
            <h3 className="mt-2 font-bold">소재 우선 점검</h3>
            <p className="mt-2 text-sm leading-6">
              비용 상승이 큰 소재부터 첫 장면, 썸네일,
              카피 후킹을 비교하고 교체 우선순위를 정합니다.
            </p>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-gray-400">
          Meta Ads Weekly Report · 2026-08-31 ~ 2026-09-06
        </p>
      </div>
    </main>
  );
}


