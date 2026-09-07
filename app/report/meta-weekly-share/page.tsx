const won = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;
const num = (n: number) => n.toLocaleString("ko-KR");

const previous = {
  label: "2026-08-24 ~ 2026-08-30",
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
  label: "2026-08-31 ~ 2026-09-06",
  spend: 1033812,
  impressions: 19116,
  clicks: 547,
  lpv: 227,
  ctr: 2.86,
  cpc: 1890,
  lpvCost: 4554,
  cpm: 54081,
};

const changes = {
  spend: 11.0,
  impressions: -72.4,
  clicks: -80.4,
  lpv: -90.1,
  ctr: -29.1,
  cpc: 467.4,
  lpvCost: 1023.7,
  cpm: 302.2,
};

const daily = [
  { date: "8/31", spend: 178218 },
  { date: "9/1", spend: 142212 },
  { date: "9/2", spend: 99800 },
  { date: "9/3", spend: 152297 },
  { date: "9/4", spend: 146437 },
  { date: "9/5", spend: 161119 },
  { date: "9/6", spend: 153729 },
];

function Change({ value, lowerBetter = false }: { value: number; lowerBetter?: boolean }) {
  const good = lowerBetter ? value < 0 : value > 0;

  return (
    <span
      className={
        good
          ? "font-semibold text-emerald-600"
          : "font-semibold text-red-500"
      }
    >
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export default function MetaWeeklySharePage() {
  const rows = [
    {
      label: "광고비",
      prev: won(previous.spend),
      curr: won(current.spend),
      change: changes.spend,
      lowerBetter: true,
    },
    {
      label: "노출",
      prev: `${num(previous.impressions)}회`,
      curr: `${num(current.impressions)}회`,
      change: changes.impressions,
    },
    {
      label: "링크 클릭",
      prev: `${num(previous.clicks)}회`,
      curr: `${num(current.clicks)}회`,
      change: changes.clicks,
    },
    {
      label: "랜딩 페이지 조회",
      prev: `${num(previous.lpv)}회`,
      curr: `${num(current.lpv)}회`,
      change: changes.lpv,
    },
    {
      label: "링크 클릭률",
      prev: `${previous.ctr.toFixed(2)}%`,
      curr: `${current.ctr.toFixed(2)}%`,
      change: changes.ctr,
    },
    {
      label: "클릭 1회 비용",
      prev: won(previous.cpc),
      curr: won(current.cpc),
      change: changes.cpc,
      lowerBetter: true,
    },
    {
      label: "LPV 1회 비용",
      prev: won(previous.lpvCost),
      curr: won(current.lpvCost),
      change: changes.lpvCost,
      lowerBetter: true,
    },
    {
      label: "1,000회 노출 비용",
      prev: won(previous.cpm),
      curr: won(current.cpm),
      change: changes.cpm,
      lowerBetter: true,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-5 py-8 text-gray-900">
      <div className="mx-auto max-w-6xl">

        <header className="mb-7">
          <p className="text-sm font-medium text-gray-500">MIHO · META ADS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            주간 Meta 광고 성과 보고
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {current.label} · 전주 대비
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["이번 주 광고비", won(current.spend)],
            ["실제 문의(DB)", "23건"],
            ["링크 클릭", `${num(current.clicks)}회`],
            ["랜딩 페이지 조회", `${num(current.lpv)}회`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            ["CTR", `${current.ctr.toFixed(2)}%`],
            ["CPC", won(current.cpc)],
            ["LPV당 비용", won(current.lpvCost)],
            ["CPM", won(current.cpm)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            ["코재 DB", "7건"],
            ["첫코 DB", "9건"],
            ["눈 DB", "7건"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-bold">지난 기간 vs 이번 기간</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr className="border-b">
                  <th className="px-5 py-4 text-left">지표</th>
                  <th className="px-5 py-4 text-right">{previous.label}</th>
                  <th className="px-5 py-4 text-right">{current.label}</th>
                  <th className="px-5 py-4 text-right">변화</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="px-5 py-4 font-medium">{row.label}</td>
                    <td className="px-5 py-4 text-right text-gray-600">
                      {row.prev}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {row.curr}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Change
                        value={row.change}
                        lowerBetter={row.lowerBetter}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold">이번 기간 일별 광고비</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500">
                  <th className="px-4 py-3 text-left">날짜</th>
                  <th className="px-4 py-3 text-right">광고비</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((d) => (
                  <tr key={d.date} className="border-b last:border-0">
                    <td className="px-4 py-3">{d.date}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {won(d.spend)}
                    </td>
                  </tr>
                ))}

                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3">합계</td>
                  <td className="px-4 py-3 text-right">
                    {won(current.spend)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-xs font-semibold text-red-500">CHECK</p>
            <h3 className="mt-2 font-bold">유입 효율 하락</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              광고비는 전주 대비 11.0% 증가했지만 노출은 72.4%,
              링크 클릭은 80.4%, 랜딩 페이지 조회는 90.1% 감소했습니다.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold text-amber-600">COST</p>
            <h3 className="mt-2 font-bold">유입 비용 상승</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              CPC는 333원에서 1,890원으로, LPV 1회 비용은
              405원에서 4,554원으로 상승했습니다.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-semibold text-blue-600">ACTION</p>
            <h3 className="mt-2 font-bold">소재 우선 점검</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              비용 상승 폭이 큰 소재부터 첫 장면·썸네일·카피 후킹을
              비교하고 교체 우선순위를 정합니다.
            </p>
          </div>
        </section>

        <p className="mt-7 pb-5 text-center text-xs text-gray-400">
          2026-08-31 ~ 2026-09-06 Meta Ads Report
        </p>
      </div>
    </main>
  );
}
