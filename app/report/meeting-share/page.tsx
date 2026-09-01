"use client";

import { useEffect, useState } from "react";

type Report = any;

const won = (v: number) => `₩${Math.round(v).toLocaleString("ko-KR")}`;
const num = (v: number) => Number(v || 0).toLocaleString("ko-KR");

export default function MeetingSharePage() {
  const [data, setData] = useState<Report | null>(null);

  useEffect(() => {
    fetch("/meeting-report.json", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <main className="p-10">보고서를 불러오는 중입니다.</main>;
  }

  const s = data.summary;
  const p = data.previous;

  const change = (now: number, prev: number) =>
    prev ? (((now - prev) / prev) * 100).toFixed(1) : "0.0";

  return (
    <main className="mx-auto max-w-7xl bg-[#f7f8fa] p-6 text-gray-900">
      <div className="mb-6">
        <div className="text-sm text-gray-500">MIHO Marketing Intelligence</div>
        <h1 className="mt-1 text-3xl font-bold">주간 Meta 광고 성과 보고</h1>
        <p className="mt-2 text-gray-600">
          {data.period.current.start} ~ {data.period.current.end}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["광고비", won(s.spend)],
          ["실제 문의(DB)", `${num(s.actualDb)}건`],
          ["링크 클릭률", `${s.ctr.toFixed(2)}%`],
          ["LPV 1회 비용", won(s.lpvCost)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">이번 주 한눈에 보기</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-5">
            <div className="font-bold">✅ 잘된 점</div>
            <p className="mt-3 leading-7">{data.notes.good}</p>
          </div>

          <div className="rounded-xl border p-5">
            <div className="font-bold">⚠️ 확인할 점</div>
            <p className="mt-3 leading-7">{data.notes.check}</p>
          </div>

          <div className="rounded-xl border p-5">
            <div className="font-bold">→ 다음 액션</div>
            <p className="mt-3 leading-7">{data.notes.action}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border bg-white">
        <div className="p-6">
          <h2 className="text-xl font-bold">지난 기간 vs 이번 기간</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-t border-b bg-gray-50">
                <th className="p-4 text-left">지표</th>
                <th className="p-4 text-right">지난 기간</th>
                <th className="p-4 text-right">이번 기간</th>
                <th className="p-4 text-right">변화</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["광고비", p.spend, s.spend, "won"],
                ["노출", p.impressions, s.impressions, "num"],
                ["링크 클릭", p.linkClicks, s.linkClicks, "num"],
                ["랜딩 페이지 조회", p.landingViews, s.landingViews, "num"],
                ["링크 클릭률", p.ctr, s.ctr, "pct"],
                ["클릭 1회 비용", p.cpc, s.cpc, "won"],
                ["LPV 1회 비용", p.lpvCost, s.lpvCost, "won"],
                ["1,000회 노출 비용", p.cpm, s.cpm, "won"],
              ].map(([label, prev, now, type]: any) => {
                const format = (v: number) =>
                  type === "won"
                    ? won(v)
                    : type === "pct"
                    ? `${v.toFixed(2)}%`
                    : num(v);

                return (
                  <tr key={label} className="border-b">
                    <td className="p-4">{label}</td>
                    <td className="p-4 text-right">{format(prev)}</td>
                    <td className="p-4 text-right font-semibold">{format(now)}</td>
                    <td className="p-4 text-right">
                      {Number(change(now, prev)) > 0 ? "+" : ""}
                      {change(now, prev)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">랜딩 이탈 분석</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["실제 문의(DB)", num(s.actualDb)],
            ["코첫 문의", num(data.landings.find((x: any) => x.name === "코첫")?.actualDb ?? 0)],
            ["눈밑 문의", num(data.landings.find((x: any) => x.name === "눈밑")?.actualDb ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-gray-50 p-5">
              <div className="text-sm text-gray-500">{label}</div>
              <div className="mt-2 text-3xl font-bold">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {data.landings.map((landing: any) => (
            <div key={landing.name} className="rounded-xl border p-5">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold">{landing.name} 랜딩</div>
                  <div className="text-sm text-gray-500">Google Sheet 실제 문의</div>
                </div>
                <div className="text-2xl font-bold">{landing.actualDb}건</div>
              </div>

              <div className="mt-4 space-y-2">
                {landing.ads.map((ad: any) => (
                  <div
                    key={ad.name}
                    className="flex justify-between rounded-lg bg-gray-50 px-4 py-3"
                  >
                    <span>{ad.name}</span>
                    <strong>DB {ad.db}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border bg-white">
        <div className="p-6">
          <h2 className="text-xl font-bold">이번 기간 일별 성과</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b bg-gray-50">
                <th className="p-4 text-left">날짜</th>
                <th className="p-4 text-right">광고비</th>
                <th className="p-4 text-right">노출</th>
                <th className="p-4 text-right">클릭</th>
                <th className="p-4 text-right">LPV</th>
                <th className="p-4 text-right">클릭 비용</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((r: any) => (
                <tr key={r.date} className="border-b">
                  <td className="p-4">{r.date}</td>
                  <td className="p-4 text-right">{won(r.spend)}</td>
                  <td className="p-4 text-right">{num(r.impressions)}</td>
                  <td className="p-4 text-right">{num(r.clicks)}</td>
                  <td className="p-4 text-right">{num(r.lpv)}</td>
                  <td className="p-4 text-right">{won(r.cpc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-5 text-xs text-gray-500">
        ※ 공유용 고정 스냅샷입니다. GA4 form_complete 이벤트는 추적 점검 중이며,
        실제 문의(DB)는 Google Sheet 기준입니다.
      </p>
    </main>
  );
}
