export default function MetaWeeklySharePage() {
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const videoSteps = [
    { label: "3초 이상 재생", value: 19515, rate: 100 },
    { label: "25% 재생", value: 13974, rate: 71.6 },
    { label: "50% 재생", value: 8449, rate: 43.3 },
    { label: "75% 재생", value: 6107, rate: 31.3 },
    { label: "95% 재생", value: 4249, rate: 21.8 },
    { label: "100% 재생", value: 4051, rate: 20.8 },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-8 text-zinc-900 md:px-8">
      <div className="mx-auto max-w-7xl">


        {/* MIHO_SEPTEMBER_META_MONTHLY_20261002 */}
        <section className="mb-10">

          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              MONTHLY REPORT
            </div>

            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              2026년 9월 Meta 광고 성과
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Meta Ads 2026-09-01 ~ 2026-09-30 기준
              · 실제 DB는 주간 집계 기준
            </p>
          </div>


          {/* BUDGET */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                월 운영예산
              </div>

              <div className="mt-2 text-3xl font-bold">
                ₩4,000,000
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-sm">
              <div className="text-sm text-zinc-300">
                실제 광고비
              </div>

              <div className="mt-2 text-3xl font-bold">
                ₩4,274,352
              </div>

              <div className="mt-2 text-sm font-semibold text-red-300">
                예산 대비 +₩274,352
              </div>
            </div>


            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <div className="text-sm text-red-600">
                예산 집행률
              </div>

              <div className="mt-2 text-3xl font-bold text-red-600">
                106.9%
              </div>

              <div className="mt-2 text-sm text-red-500">
                월 예산 6.9% 초과
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                10월 관리 기준
              </div>

              <div className="mt-2 text-3xl font-bold">
                ₩4,000,000
              </div>

              <div className="mt-2 text-xs leading-5 text-zinc-400">
                활성 캠페인의 일일 예산 합계 별도 관리
              </div>
            </div>

          </div>


          {/* TOTAL PERFORMANCE */}
          <div className="mb-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h3 className="text-lg font-bold">
                9월 전체 Meta 성과
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Meta Ads CSV 월간 집계
              </p>
            </div>


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">
                  도달
                </div>
                <div className="mt-2 text-2xl font-bold">
                  335,447
                </div>
              </div>


              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">
                  노출
                </div>
                <div className="mt-2 text-2xl font-bold">
                  484,174
                </div>
              </div>


              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">
                  빈도
                </div>
                <div className="mt-2 text-2xl font-bold">
                  1.44
                </div>
              </div>


              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">
                  CPM
                </div>
                <div className="mt-2 text-2xl font-bold">
                  ₩8,828
                </div>
              </div>


              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">
                  링크 클릭
                </div>
                <div className="mt-2 text-2xl font-bold">
                  12,984
                </div>
              </div>


              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">
                  링크 CPC
                </div>
                <div className="mt-2 text-2xl font-bold">
                  ₩329
                </div>
              </div>


              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">
                  랜딩 페이지 조회
                </div>
                <div className="mt-2 text-2xl font-bold">
                  10,252
                </div>
              </div>


              <div className="rounded-xl bg-zinc-900 p-4 text-white">
                <div className="text-xs text-zinc-300">
                  LPV당 비용
                </div>
                <div className="mt-2 text-2xl font-bold">
                  ₩417
                </div>
              </div>

            </div>
          </div>


          {/* TREATMENT */}
          <div className="mb-5 rounded-2xl border border-zinc-200 bg-white shadow-sm">

            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="font-bold">
                시술별 광고비 및 랜딩 유입
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">

                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium">
                      구분
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      광고비
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      LPV
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      LPV당 비용
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">

                  <tr>
                    <td className="px-5 py-4 font-medium">하안검</td>
                    <td className="px-5 py-4 text-right">₩1,544,648</td>
                    <td className="px-5 py-4 text-right">8,300</td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                      ₩186
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">눈밑지</td>
                    <td className="px-5 py-4 text-right">₩1,093,814</td>
                    <td className="px-5 py-4 text-right">454</td>
                    <td className="px-5 py-4 text-right">₩2,409</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">남자코</td>
                    <td className="px-5 py-4 text-right">₩692,958</td>
                    <td className="px-5 py-4 text-right">891</td>
                    <td className="px-5 py-4 text-right">₩778</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">코재</td>
                    <td className="px-5 py-4 text-right">₩686,104</td>
                    <td className="px-5 py-4 text-right">429</td>
                    <td className="px-5 py-4 text-right">₩1,599</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">첫코</td>
                    <td className="px-5 py-4 text-right">₩253,828</td>
                    <td className="px-5 py-4 text-right">178</td>
                    <td className="px-5 py-4 text-right">₩1,426</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">눈썹거상</td>
                    <td className="px-5 py-4 text-right">₩3,000</td>
                    <td className="px-5 py-4 text-right">0</td>
                    <td className="px-5 py-4 text-right">-</td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>


          {/* PLACEMENT */}
          <div className="mb-5 rounded-2xl border border-zinc-200 bg-white shadow-sm">

            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="font-bold">
                주요 게재 위치 성과
              </h3>

              <p className="mt-1 text-xs text-zinc-400">
                랜딩 페이지 조회 효율 기준
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">

                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium">게재 위치</th>
                    <th className="px-5 py-4 text-right font-medium">광고비</th>
                    <th className="px-5 py-4 text-right font-medium">LPV</th>
                    <th className="px-5 py-4 text-right font-medium">LPV당 비용</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">

                  <tr>
                    <td className="px-5 py-4 font-medium">Feed</td>
                    <td className="px-5 py-4 text-right">₩1,902,181</td>
                    <td className="px-5 py-4 text-right">5,932</td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                      ₩321
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">Instagram Reels</td>
                    <td className="px-5 py-4 text-right">₩1,728,086</td>
                    <td className="px-5 py-4 text-right">3,983</td>
                    <td className="px-5 py-4 text-right">₩434</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">Facebook Reels</td>
                    <td className="px-5 py-4 text-right">₩253,901</td>
                    <td className="px-5 py-4 text-right">131</td>
                    <td className="px-5 py-4 text-right text-red-500">
                      ₩1,938
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">Instagram Stories</td>
                    <td className="px-5 py-4 text-right">₩246,875</td>
                    <td className="px-5 py-4 text-right">106</td>
                    <td className="px-5 py-4 text-right text-red-500">
                      ₩2,329
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">Facebook Stories</td>
                    <td className="px-5 py-4 text-right">₩39,404</td>
                    <td className="px-5 py-4 text-right">56</td>
                    <td className="px-5 py-4 text-right">₩704</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">Threads Feed</td>
                    <td className="px-5 py-4 text-right">₩54,665</td>
                    <td className="px-5 py-4 text-right">28</td>
                    <td className="px-5 py-4 text-right text-red-500">
                      ₩1,952
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>


          {/* WEEKLY DB */}
          <div className="mb-5 rounded-2xl border border-zinc-200 bg-white shadow-sm">

            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="font-bold">
                실제 DB 주간 추이
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-400">
                실제 DB 유입 기준 · 첫/마지막 주는 월 경계일을 포함한 주간 집계
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">

                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium">기간</th>
                    <th className="px-5 py-4 text-right font-medium">코재</th>
                    <th className="px-5 py-4 text-right font-medium">첫코</th>
                    <th className="px-5 py-4 text-right font-medium">눈밑</th>
                    <th className="px-5 py-4 text-right font-medium">전체</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">

                  <tr>
                    <td className="px-5 py-4 font-medium">8/30 ~ 9/5</td>
                    <td className="px-5 py-4 text-right">7</td>
                    <td className="px-5 py-4 text-right">10</td>
                    <td className="px-5 py-4 text-right">4</td>
                    <td className="px-5 py-4 text-right font-bold">21</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">9/6 ~ 9/12</td>
                    <td className="px-5 py-4 text-right">3</td>
                    <td className="px-5 py-4 text-right">3</td>
                    <td className="px-5 py-4 text-right">9</td>
                    <td className="px-5 py-4 text-right font-bold">15</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">9/13 ~ 9/19</td>
                    <td className="px-5 py-4 text-right">6</td>
                    <td className="px-5 py-4 text-right">2</td>
                    <td className="px-5 py-4 text-right">12</td>
                    <td className="px-5 py-4 text-right font-bold">20</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">9/20 ~ 9/26</td>
                    <td className="px-5 py-4 text-right">8</td>
                    <td className="px-5 py-4 text-right">2</td>
                    <td className="px-5 py-4 text-right">6</td>
                    <td className="px-5 py-4 text-right font-bold">16</td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">9/27 ~ 10/3</td>
                    <td className="px-5 py-4 text-right">2</td>
                    <td className="px-5 py-4 text-right">0</td>
                    <td className="px-5 py-4 text-right">4</td>
                    <td className="px-5 py-4 text-right font-bold">6</td>
                  </tr>

                  <tr className="bg-zinc-900 text-white">
                    <td className="px-5 py-4 font-bold">
                      주간 집계 합계
                    </td>
                    <td className="px-5 py-4 text-right font-bold">26</td>
                    <td className="px-5 py-4 text-right font-bold">17</td>
                    <td className="px-5 py-4 text-right font-bold">35</td>
                    <td className="px-5 py-4 text-right text-lg font-bold">78</td>
                  </tr>

                </tbody>
              </table>
            </div>

            <div className="border-t border-zinc-100 px-5 py-3 text-xs leading-5 text-zinc-400">
              ※ 78건은 8/30~10/3 주간 보고 구간 합계이며,
              9월 1~30일만의 순수 월간 DB 합계와는 다릅니다.
            </div>
          </div>


          {/* MONTHLY INSIGHT */}
          <div className="grid gap-4 lg:grid-cols-3">

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-red-400">
                BUDGET
              </div>

              <h3 className="mt-2 text-lg font-bold text-red-700">
                월 예산 27.4만원 초과
              </h3>

              <p className="mt-3 text-sm leading-6 text-red-700/80">
                9월 Meta 광고비는 4,274,352원으로
                월 운영예산 400만원보다 274,352원 초과 집행됐습니다.
                예산 집행률은 106.9%입니다.
              </p>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                TRAFFIC
              </div>

              <h3 className="mt-2 text-lg font-bold">
                Feed · Instagram Reels 중심
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                주요 게재 위치 중 Feed의 LPV당 비용은 321원,
                Instagram Reels는 434원으로 확인됩니다.
                Stories와 Facebook Reels는 상대적으로 높은 LPV 비용을 보였습니다.
              </p>
            </div>


            <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-6 text-white shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                ACTION
              </div>

              <h3 className="mt-2 text-lg font-bold">
                10월 예산 통제 강화
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-300">
                캠페인별 일일 예산만 확인하지 않고
                활성 캠페인의 일일 예산 합계와 월 누적 집행액을 함께 관리합니다.
                월 400만원 기준 평균 일일 집행 가능액도 같이 확인합니다.
              </p>
            </div>

          </div>

        </section>

        {/* HEADER */}
        <header className="mb-8">
          <div className="text-sm font-medium text-zinc-500">
            MIHO Marketing Intelligence
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            주간 Meta 광고 성과 보고
          </h1>

          <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-500">
            <span>2026-09-06 ~ 2026-09-12</span>
            <span>·</span>
            <span>전주 2026-08-30 ~ 2026-09-05 대비</span>
          </div>
        </header>


        {/* LANDING DB */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              랜딩별 DB 유입
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              이번 주 실제 문의 DB 기준
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-zinc-500">
                첫코 랜딩
              </div>

              <div className="mt-3 text-3xl font-bold">
                3건
              </div>

              <div className="mt-2 text-sm text-zinc-500">
                유입 소재 · 타나카
              </div>

              <div className="mt-3 text-sm font-semibold text-red-500">
                10 → 3건 · -70.0%
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-zinc-500">
                코재 랜딩
              </div>

              <div className="mt-3 text-3xl font-bold">
                3건
              </div>

              <div className="mt-2 text-sm text-zinc-500">
                유입 소재 · S원장님
              </div>

              <div className="mt-3 text-sm font-semibold text-red-500">
                7 → 3건 · -57.1%
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-zinc-500">
                눈밑 랜딩
              </div>

              <div className="mt-3 text-3xl font-bold">
                9건
              </div>

              <div className="mt-2 text-sm text-zinc-500">
                유입 소재 · 최선다해
              </div>

              <div className="mt-3 text-sm font-semibold text-emerald-600">
                4 → 9건 · +125.0%
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-sm">
              <div className="text-sm font-medium text-zinc-300">
                전체 DB
              </div>

              <div className="mt-3 text-3xl font-bold">
                15건
              </div>

              <div className="mt-2 text-sm text-zinc-300">
                전주 21건
              </div>

              <div className="mt-3 text-sm font-semibold text-red-300">
                -6건 · -28.6%
              </div>
            </div>
          </div>
        </section>


        {/* SPEND */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              광고비 집행 현황
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                이번 주 광고비
              </div>

              <div className="mt-2 text-3xl font-bold">
                ₩907,867
              </div>

              <div className="mt-2 text-sm text-red-500">
                +₩52,273 · +6.1%
              </div>

              <div className="mt-1 text-xs text-zinc-400">
                전주 ₩855,594
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                9월 누적 광고비
              </div>

              <div className="mt-2 text-3xl font-bold">
                ₩2,343,239
              </div>

              <div className="mt-2 text-xs text-zinc-400">
                Meta CSV · 9/1~9/17
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                이번 주 DB당 비용
              </div>

              <div className="mt-2 text-3xl font-bold">
                ₩60,524
              </div>

              <div className="mt-2 text-sm text-red-500">
                +41.5%
              </div>

              <div className="mt-1 text-xs text-zinc-400">
                전주 약 ₩42,780
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                DB 변화
              </div>

              <div className="mt-2 text-3xl font-bold">
                -25.0%
              </div>

              <div className="mt-2 text-xs text-zinc-400">
                광고비 +6.1% · DB -25.0%
              </div>
            </div>
          </div>
        </section>


        {/* META PERFORMANCE */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Meta 유입 성과
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Meta Ads CSV 누적 기준 · 2026-09-01 ~ 2026-09-17
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                도달
              </div>
              <div className="mt-2 text-2xl font-bold">
                77,221
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                노출
              </div>
              <div className="mt-2 text-2xl font-bold">
                119,002
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                빈도
              </div>
              <div className="mt-2 text-2xl font-bold">
                1.54
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                CPM
              </div>
              <div className="mt-2 text-2xl font-bold">
                ₩19,691
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                링크 클릭
              </div>
              <div className="mt-2 text-2xl font-bold">
                2,302
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                링크 CTR
              </div>
              <div className="mt-2 text-2xl font-bold">
                1.93%
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                링크 CPC
              </div>
              <div className="mt-2 text-2xl font-bold">
                ₩1,018
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                랜딩 페이지 조회
              </div>
              <div className="mt-2 text-2xl font-bold">
                1,552
              </div>
            </div>
          </div>
        </section>


        {/* LANDING FUNNEL */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              랜딩 유입 퍼널
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-zinc-500">
                링크 클릭
              </div>

              <div className="mt-2 text-3xl font-bold">
                2,302
              </div>

              <div className="mt-4 h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-zinc-800"
                  style={{ width: "100%" }}
                />
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-zinc-500">
                랜딩 페이지 조회
              </div>

              <div className="mt-2 text-3xl font-bold">
                1,552
              </div>

              <div className="mt-2 text-sm font-semibold text-zinc-700">
                도달률 67.4%
              </div>

              <div className="mt-4 h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-zinc-800"
                  style={{ width: "67.4%" }}
                />
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-zinc-500">
                LPV당 비용
              </div>

              <div className="mt-2 text-3xl font-bold">
                ₩1,510
              </div>

              <div className="mt-2 text-xs text-zinc-400">
                ₩2,343,239 ÷ 1,552 LPV
              </div>
            </div>
          </div>
        </section>


        {/* VIDEO */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              영상 시청 반응
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              3초 이상 시청자를 기준으로 단계별 잔존율 계산
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-zinc-500">
                3초 이상 영상 재생
              </div>

              <div className="mt-2 text-3xl font-bold">
                19,515
              </div>

              <div className="mt-2 text-xs text-zinc-400">
                재생당 비용 약 ₩120
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-zinc-500">
                100% 영상 재생
              </div>

              <div className="mt-2 text-3xl font-bold">
                4,051
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-6 text-white shadow-sm">
              <div className="text-sm text-zinc-300">
                영상 완주율
              </div>

              <div className="mt-2 text-3xl font-bold">
                20.8%
              </div>

              <div className="mt-2 text-xs text-zinc-400">
                100% 재생 ÷ 3초 이상 재생
              </div>
            </div>
          </div>


          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 text-sm font-semibold">
              영상 시청 잔존
            </div>

            <div className="space-y-5">
              {videoSteps.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">
                      {item.label}
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold">
                        {fmt(item.value)}
                      </span>
                      <span className="ml-2 text-xs text-zinc-400">
                        {item.rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-800"
                      style={{ width: item.rate + "%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* DB COMPARE TABLE */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              DB 전주 비교
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium">
                      구분
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      8/30~9/5
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      9/6~9/12
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      증감
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      증감률
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-5 py-4 font-medium">
                      첫코
                    </td>
                    <td className="px-5 py-4 text-right">
                      10
                    </td>
                    <td className="px-5 py-4 text-right">
                      3
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-red-500">
                      -6
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-red-500">
                      -70.0%
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">
                      코재
                    </td>
                    <td className="px-5 py-4 text-right">
                      7
                    </td>
                    <td className="px-5 py-4 text-right">
                      3
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-red-500">
                      -4
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-red-500">
                      -57.1%
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium">
                      눈밑
                    </td>
                    <td className="px-5 py-4 text-right">
                      4
                    </td>
                    <td className="px-5 py-4 text-right">
                      9
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                      +5
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                      +125.0%
                    </td>
                  </tr>

                  <tr className="bg-zinc-50 font-semibold">
                    <td className="px-5 py-4">
                      전체
                    </td>
                    <td className="px-5 py-4 text-right">
                      21
                    </td>
                    <td className="px-5 py-4 text-right">
                      15
                    </td>
                    <td className="px-5 py-4 text-right text-red-500">
                      -6
                    </td>
                    <td className="px-5 py-4 text-right text-red-500">
                      -28.6%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>


        {/* INSIGHT */}
        <section className="mb-8">
          <div className="grid gap-4 lg:grid-cols-3">

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                CHECK
              </div>

              <h3 className="mt-2 text-lg font-bold">
                DB 전환 감소
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                이번 주 광고비는 전주 대비 6.1% 증가했지만
                전체 DB는 21건에서 15건으로 28.6% 감소했습니다.
                특히 첫코와 코재의 DB 감소폭이 크게 나타났습니다.
              </p>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                COST
              </div>

              <h3 className="mt-2 text-lg font-bold">
                DB당 비용 상승
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                전주 DB당 비용은 약 ₩42,780이었으나
                이번 주는 약 ₩60,524로 상승했습니다.
                광고비 증가와 DB 감소가 동시에 발생하면서
                DB당 비용이 약 41.5% 높아졌습니다.
              </p>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                ACTION
              </div>

              <h3 className="mt-2 text-lg font-bold">
                눈밑 유지 · 첫코/코재 점검
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                눈밑은 최선다해 소재에서 DB가 4건에서 9건으로 증가해
                현재 조건을 유지하며 추이를 확인합니다.
                첫코 타나카와 코재 S원장님은 광고 유입 이후
                랜딩 및 문의 전환 구간을 우선 점검합니다.
              </p>
            </div>

          </div>
        </section>


        {/* SUMMARY */}
        <section className="mb-8 rounded-2xl border border-zinc-900 bg-zinc-900 p-6 text-white md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Weekly Summary
          </div>

          <h2 className="mt-2 text-2xl font-bold">
            광고비는 증가했지만 DB는 감소
          </h2>

          <div className="mt-5 space-y-3 text-sm leading-6 text-zinc-300">
            <p>
              이번 주 광고비는 ₩907,867로 전주 대비
              ₩52,273(+6.1%) 증가했습니다.
            </p>

            <p>
              전체 DB는 21건에서 15건으로 6건(-28.6%) 감소했으며,
              DB당 비용은 약 ₩42,780에서 ₩60,524로 약 41.5% 상승했습니다.
            </p>

            <p>
              첫코는 타나카 소재에서 3건, 코재는 S원장님 소재에서 3건으로
              각각 전주 대비 감소했습니다.
            </p>

            <p>
              반면 눈밑 최선다해 소재는 4건에서 9건으로
              125.0% 증가했습니다.
            </p>

            <p>
              Meta 누적 데이터 기준 링크 클릭은 2,302건,
              랜딩 페이지 조회는 1,552건으로 랜딩 도달률은 67.4%입니다.
              영상 3초 이상 재생 19,515건 중 100% 재생은 4,051건으로
              3초 시청자 대비 완주율은 20.8%입니다.
            </p>
          </div>
        </section>


        
        {/* MODOODOC_COMPETITOR_COMPARE_20260918 */}
        <section className="mb-8">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              AI SEARCH
            </div>

            <h2 className="mt-2 text-2xl font-bold">
              모두닥 경쟁 병원 비교
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              AI 검색에서 병원 정보를 찾을 때 모두닥 같은 병원 정보 사이트도
              참고될 수 있다고 해서 직접 비교해봤습니다.
              미호와 모두닥 정보가 잘 채워져 있는 병원을 비교해보니
              몇 가지 차이가 있었습니다.
            </p>
          </div>


          {/* SUMMARY CARDS */}
          <div className="mb-5 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-sm">
              <div className="text-sm text-zinc-300">
                미호성형외과
              </div>

              <div className="mt-3 text-3xl font-bold">
                리뷰 9개
              </div>

              <div className="mt-3 text-sm leading-6 text-zinc-300">
                정보공개 미동의
                <br />
                현재 모두닥에 보이는 수술 정보가 적은 편
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                디엠성형외과
              </div>

              <div className="mt-3 text-3xl font-bold">
                리뷰 74개
              </div>

              <div className="mt-3 text-sm leading-6 text-zinc-600">
                정보공개 동의
                <br />
                눈·코 수술 항목이 여러 개 등록되어 있음
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                루비성형외과
              </div>

              <div className="mt-3 text-3xl font-bold">
                리뷰 110개
              </div>

              <div className="mt-3 text-sm leading-6 text-zinc-600">
                정보공개 동의
                <br />
                눈·코·리프팅 등 여러 수술 정보가 노출됨
              </div>
            </div>

          </div>


          {/* COMPARE TABLE */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-4">
              <div className="font-semibold">
                모두닥에서 실제로 보이는 정보 비교
              </div>

              <div className="mt-1 text-xs text-zinc-400">
                모두닥 공개 페이지 확인 기준 · 정보는 이후 변경될 수 있음
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium">
                      확인 항목
                    </th>

                    <th className="px-5 py-4 text-left font-medium">
                      미호성형외과
                    </th>

                    <th className="px-5 py-4 text-left font-medium">
                      디엠성형외과
                    </th>

                    <th className="px-5 py-4 text-left font-medium">
                      루비성형외과
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">

                  <tr>
                    <td className="px-5 py-4 font-medium">
                      정보공개
                    </td>

                    <td className="px-5 py-4 font-semibold text-red-500">
                      미동의
                    </td>

                    <td className="px-5 py-4 font-semibold text-emerald-600">
                      동의
                    </td>

                    <td className="px-5 py-4 font-semibold text-emerald-600">
                      동의
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      리뷰 수
                    </td>

                    <td className="px-5 py-4">
                      9개
                    </td>

                    <td className="px-5 py-4">
                      74개
                    </td>

                    <td className="px-5 py-4">
                      110개
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      눈밑지방재배치
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      관련 정보가 적음
                    </td>

                    <td className="px-5 py-4">
                      리뷰 26건 확인
                    </td>

                    <td className="px-5 py-4">
                      리뷰 29건 확인
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      코 관련 정보
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      기능코·필러 위주로 보임
                    </td>

                    <td className="px-5 py-4">
                      코상담·코끝·콧대·기능코 등
                    </td>

                    <td className="px-5 py-4">
                      코 관련 여러 항목 노출
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      눈 관련 정보
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      실제 주력 수술에 비해 적음
                    </td>

                    <td className="px-5 py-4">
                      눈밑·하안검·쌍꺼풀 등
                    </td>

                    <td className="px-5 py-4">
                      눈밑·쌍꺼풀 등 여러 항목
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      가격 / 시술 정보
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      현재 보이는 정보가 적음
                    </td>

                    <td className="px-5 py-4">
                      여러 항목 확인 가능
                    </td>

                    <td className="px-5 py-4">
                      여러 항목 확인 가능
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>


          {/* WHAT I FOUND */}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                CHECK
              </div>

              <h3 className="mt-2 text-lg font-bold">
                미호는 실제 하는 수술에 비해 정보가 적습니다
              </h3>

              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                <p>
                  직접 확인해보니 미호는 실제로 광고하고 있는
                  첫코, 코재수술, 눈밑지방재배치, 하안검 같은 수술에 비해
                  모두닥에 올라가 있는 정보가 많이 적었습니다.
                </p>

                <p>
                  반면 비교한 병원들은 수술명이 세부적으로 많이 등록되어 있고
                  각 수술별 리뷰도 같이 쌓여 있었습니다.
                </p>

                <p>
                  그래서 처음 보는 사람이 모두닥만 보고 비교하면
                  미호가 어떤 수술을 주로 하는 병원인지 바로 알기 어려운 상태입니다.
                </p>
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                AI SEARCH
              </div>

              <h3 className="mt-2 text-lg font-bold">
                AI 검색에서도 정보가 많은 쪽이 설명하기 쉽습니다
              </h3>

              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                <p>
                  AI가 꼭 모두닥만 보고 답변한다고 볼 수는 없지만,
                  병원명과 수술명, 리뷰, 가격 같은 정보가 여러 사이트에
                  자세하게 올라가 있으면 병원을 설명할 때 참고할 정보도 많아집니다.
                </p>

                <p>
                  따라서 모두닥만 수정하는 게 아니라
                  홈페이지, 네이버, 구글, 카카오 등에 올라간 병원 정보도
                  같이 맞춰주는 방향으로 보는 게 좋겠습니다.
                </p>
              </div>
            </div>

          </div>


          {/* ACTION */}
          <div className="mt-5 rounded-2xl border border-zinc-900 bg-zinc-900 p-6 text-white shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              ACTION
            </div>

            <h3 className="mt-2 text-xl font-bold">
              우선 수정하면 좋을 부분
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  01. 정보공개 확인
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  모두닥에서 현재 정보공개 미동의로 나오기 때문에
                  병원에서 수정할 수 있는지 먼저 확인합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  02. 주력 수술 추가
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  첫코, 코재수술, 코성형, 눈밑지방재배치,
                  하안검 등 실제 주력 수술을 더 잘 보이게 추가합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  03. 리뷰 늘리기
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  단순히 전체 리뷰 수만 늘리기보다
                  코·눈밑·하안검처럼 수술별 리뷰가 쌓이는 게 중요합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  04. 병원 정보 확인
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  주소, 전화번호, 진료시간, 의료진 정보가
                  현재 병원 정보와 맞는지 확인하고 수정합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  05. 가격 정보 확인
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  모두닥에서 등록 가능한 수술이나 상담 가격이 있다면
                  실제 검색하는 수술명 기준으로 추가합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  06. 다른 채널도 같이 수정
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  홈페이지, 네이버, 구글, 카카오에도
                  같은 수술 정보와 병원 정보가 잘 올라가 있는지 같이 확인합니다.
                </p>
              </div>

            </div>
          </div>


          {/* EASY SUMMARY */}
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-sm font-semibold">
              한 줄 정리
            </div>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              경쟁 병원보다 미호의 모두닥 정보가 적어서,
              우선 실제로 많이 하는 코·눈밑 수술 정보를 채우고
              리뷰와 병원 기본 정보를 같이 정리하는 게 필요해 보입니다.
            </p>
          </div>

        </section>

        <footer className="pb-6 text-center text-xs text-zinc-400">
          MIHO Marketing Intelligence · Meta Weekly Report · 2026-09-06 ~ 2026-09-12
        </footer>

      </div>
    </main>
  );
}
