"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload } from "lucide-react";

type Row = Record<string, unknown>;

function n(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const x = Number(String(v).replace(/,/g, "").replace(/₩/g, "").replace(/%/g, "").trim());
  return Number.isFinite(x) ? x : 0;
}

function t(v: unknown): string {
  return String(v ?? "").trim();
}

function won(v: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(v);
}

function integer(v: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(v));
}

function pct(v: number | null) {
  return v === null ? "-" : `${v.toFixed(1)}%`;
}

function change(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function get(row: Row, names: string[]) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(row, name)) return row[name];
  }
  return undefined;
}

const H = {
  day: ["일", "날짜", "Day", "Date"],
  campaign: ["캠페인 이름", "Campaign name", "Campaign Name"],
  ad: ["광고 이름", "Ad name", "Ad Name"],
  adId: ["광고 ID", "Ad ID"],

  spend: ["지출 금액", "Amount spent", "Amount spent (KRW)"],
  impressions: ["노출", "Impressions"],
  clicks: ["링크 클릭", "Link clicks"],
  lpv: ["랜딩 페이지 조회", "Landing page views"],

  v3: ["동영상 3초 이상 재생", "3-second video plays"],
  v25: ["동영상 25% 재생", "Video plays at 25%"],
  v50: ["동영상 50% 재생", "Video plays at 50%"],
  v75: ["동영상 75% 재생", "Video plays at 75%"],
  v95: ["동영상 95% 재생", "Video plays at 95%"],
  v100: ["동영상 100% 재생", "Video plays at 100%"],
};

type Metrics = {
  spend: number;
  impressions: number;
  clicks: number;
  lpv: number;
};

function aggregate(rows: Row[]): Metrics {
  return rows.reduce<Metrics>(
    (a, r) => {
      a.spend += n(get(r, H.spend));
      a.impressions += n(get(r, H.impressions));
      a.clicks += n(get(r, H.clicks));
      a.lpv += n(get(r, H.lpv));
      return a;
    },
    { spend: 0, impressions: 0, clicks: 0, lpv: 0 }
  );
}

function ctr(m: Metrics) {
  return m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
}

function cpc(m: Metrics) {
  return m.clicks > 0 ? m.spend / m.clicks : 0;
}

function cpm(m: Metrics) {
  return m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0;
}

function lpvCost(m: Metrics) {
  return m.lpv > 0 ? m.spend / m.lpv : 0;
}

export default function MeetingReportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  // 회의용 GA4 랜딩 퍼널 직접 입력
  const [ga4Sessions, setGa4Sessions] = useState("");
  const [ga4Cta, setGa4Cta] = useState("");
  const [ga4FormStart, setGa4FormStart] = useState("");
  const [ga4FormComplete, setGa4FormComplete] = useState("");
  const [actualDb, setActualDb] = useState("");

  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4AutoLoaded, setGa4AutoLoaded] = useState(false);
  const [ga4Message, setGa4Message] = useState("");

  // 이번 회의 비교 기준
  const [prevStart, setPrevStart] = useState("2026-08-17");
  const [prevEnd, setPrevEnd] = useState("2026-08-23");
  const [currStart, setCurrStart] = useState("2026-08-24");
  const [currEnd, setCurrEnd] = useState("2026-08-31");

  useEffect(() => {
    if (!currStart || !currEnd) return;

    const controller = new AbortController();

    async function loadGa4() {
      setGa4Loading(true);
      setGa4Message("");

      try {
        const params = new URLSearchParams({
          start: currStart,
          end: currEnd,
        });

        const response = await fetch(
          `/api/report/meeting-ga4?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.message || "GA4 데이터를 불러오지 못했습니다."
          );
        }

        setGa4Sessions(String(data.sessions ?? 0));
        setGa4Cta(String(data.ctaClicks ?? 0));
        setGa4FormStart(String(data.formStarts ?? 0));
        setGa4FormComplete(String(data.formCompletes ?? 0));
        setActualDb(String(data.actualDb ?? 0));

        setGa4AutoLoaded(true);
        setGa4Message(
          `GA4에서 ${currStart} ~ ${currEnd} 데이터를 자동으로 불러왔습니다.`
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setGa4AutoLoaded(false);
        setGa4Message(
          "GA4 자동 조회에 실패했습니다. 아래 숫자를 직접 입력해도 분석은 계속 사용할 수 있습니다."
        );
      } finally {
        setGa4Loading(false);
      }
    }

    loadGa4();

    return () => controller.abort();
  }, [currStart, currEnd]);

  const analysis = useMemo(() => {
    const detail = rows.filter((r) => t(get(r, H.day)));

    if (!detail.length) return null;

    const previousRows = detail.filter((r) => {
      const d = t(get(r, H.day));
      return d >= prevStart && d <= prevEnd;
    });

    const currentRows = detail.filter((r) => {
      const d = t(get(r, H.day));
      return d >= currStart && d <= currEnd;
    });

    const previous = aggregate(previousRows);
    const current = aggregate(currentRows);

    // 이번 기간 일별
    const dailyMap = new Map<string, Metrics>();

    for (const r of currentRows) {
      const date = t(get(r, H.day));
      const m = dailyMap.get(date) ?? {
        spend: 0,
        impressions: 0,
        clicks: 0,
        lpv: 0,
      };

      m.spend += n(get(r, H.spend));
      m.impressions += n(get(r, H.impressions));
      m.clicks += n(get(r, H.clicks));
      m.lpv += n(get(r, H.lpv));

      dailyMap.set(date, m);
    }

    const daily = [...dailyMap.entries()]
      .map(([date, m]) => ({ date, ...m }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 영상별 성과 — 이번 기간
    const videoMap = new Map<
      string,
      {
        campaign: string;
        ad: string;
        spend: number;
        v3: number;
        v25: number;
        v50: number;
        v75: number;
        v95: number;
        v100: number;
      }
    >();

    for (const r of currentRows) {
      const ad = t(get(r, H.ad));
      if (!ad) continue;

      const campaign = t(get(r, H.campaign)) || "(캠페인 없음)";
      const adId = t(get(r, H.adId));
      const key = `${campaign}|${adId || ad}`;

      const v = videoMap.get(key) ?? {
        campaign,
        ad,
        spend: 0,
        v3: 0,
        v25: 0,
        v50: 0,
        v75: 0,
        v95: 0,
        v100: 0,
      };

      v.spend += n(get(r, H.spend));
      v.v3 += n(get(r, H.v3));
      v.v25 += n(get(r, H.v25));
      v.v50 += n(get(r, H.v50));
      v.v75 += n(get(r, H.v75));
      v.v95 += n(get(r, H.v95));
      v.v100 += n(get(r, H.v100));

      videoMap.set(key, v);
    }

    const videos = [...videoMap.values()]
      .filter((v) => v.v3 > 0)
      .map((v) => {
        const completion = (v.v100 / v.v3) * 100;

        const stages = [
          { name: "3초 → 25%", from: v.v3, to: v.v25 },
          { name: "25% → 50%", from: v.v25, to: v.v50 },
          { name: "50% → 75%", from: v.v50, to: v.v75 },
          { name: "75% → 95%", from: v.v75, to: v.v95 },
          { name: "95% → 100%", from: v.v95, to: v.v100 },
        ];

        const drops = stages.map((s) => ({
          name: s.name,
          drop:
            s.from > 0
              ? ((s.from - s.to) / s.from) * 100
              : 0,
        }));

        const worst = drops.reduce(
          (best, d) => (d.drop > best.drop ? d : best),
          { name: "-", drop: 0 }
        );

        return {
          ...v,
          completion,
          worstStage: worst.name,
          worstDrop: worst.drop,
        };
      })
      .sort((a, b) => b.completion - a.completion);

    const landingSessions = n(ga4Sessions);
    const landingCta = n(ga4Cta);
    const landingFormStart = n(ga4FormStart);

    // 실제 상담 신청(DB)을 최종 전환으로 사용한다.
    // GA4 form_complete는 추적 정상 여부 확인용으로만 사용한다.
    const landingActualDb = n(actualDb);
    const trackedFormComplete = n(ga4FormComplete);

    const landingFunnel = [
      {
        key: "sessions",
        label: "랜딩 진입",
        count: landingSessions,
        rate: null as number | null,
      },
      {
        key: "cta",
        label: "CTA 클릭",
        count: landingCta,
        rate:
          landingSessions > 0
            ? (landingCta / landingSessions) * 100
            : null,
      },
      {
        key: "form_start",
        label: "폼 시작",
        count: landingFormStart,
        rate:
          landingCta > 0
            ? (landingFormStart / landingCta) * 100
            : null,
      },
      {
        key: "actual_db",
        label: "실제 문의(DB)",
        count: landingActualDb,
        rate:
          landingFormStart > 0
            ? (landingActualDb / landingFormStart) * 100
            : null,
      },
    ];

    const funnelDrops = [
      {
        from: "랜딩 진입",
        to: "CTA 클릭",
        rate:
          landingSessions > 0
            ? (landingCta / landingSessions) * 100
            : null,
      },
      {
        from: "CTA 클릭",
        to: "폼 시작",
        rate:
          landingCta > 0
            ? (landingFormStart / landingCta) * 100
            : null,
      },
      {
        from: "폼 시작",
        to: "실제 문의(DB)",
        rate:
          landingFormStart > 0
            ? (landingActualDb / landingFormStart) * 100
            : null,
      },
    ].filter((x) => x.rate !== null);

    const worstFunnel =
      funnelDrops.length > 0
        ? funnelDrops.reduce((worst, item) =>
            (item.rate ?? 100) < (worst.rate ?? 100)
              ? item
              : worst
          )
        : null;

    let landingAction = "";

    if (worstFunnel?.from === "랜딩 진입") {
      landingAction =
        "랜딩에 들어온 뒤 CTA로 넘어가는 구간을 먼저 확인하세요. 핵심 혜택·전후사진·가격 정보와 CTA 위치를 더 위로 배치하는 테스트가 우선입니다.";
    } else if (worstFunnel?.from === "CTA 클릭") {
      landingAction =
        "CTA는 눌리지만 폼 시작으로 이어지는 비율이 가장 낮습니다. 버튼 클릭 후 폼 노출 방식, 로딩, 입력 진입 과정의 마찰을 확인하세요.";
    } else if (worstFunnel?.from === "폼 시작") {
      landingAction =
        "폼을 시작했지만 실제 문의(DB)로 이어지는 비율이 낮습니다. 입력 항목 수, 제출 버튼, 개인정보 동의, 제출 후 DB 저장 과정까지 확인하세요.";
    }

    const goodPoints: string[] = [];
    const checkPoints: string[] = [];
    const nextActions: string[] = [];

    const prevCtr = ctr(previous);
    const currCtr = ctr(current);
    const prevCpc = cpc(previous);
    const currCpc = cpc(current);
    const prevLpvCost = lpvCost(previous);
    const currLpvCost = lpvCost(current);

    if (current.impressions > 0 && previous.impressions > 0) {
      if (currCtr > prevCtr) {
        goodPoints.push(
          `링크 클릭률이 지난 기간 ${prevCtr.toFixed(2)}% → 이번 기간 ${currCtr.toFixed(2)}%로 개선됐습니다.`
        );
      } else if (currCtr < prevCtr) {
        checkPoints.push(
          `링크 클릭률이 지난 기간 ${prevCtr.toFixed(2)}% → 이번 기간 ${currCtr.toFixed(2)}%로 낮아졌습니다.`
        );
        nextActions.push(
          "클릭률이 낮아진 광고부터 첫 장면·카피·썸네일 후킹을 비교하세요."
        );
      }
    }

    if (previous.clicks > 0 && current.clicks > 0) {
      if (currCpc < prevCpc) {
        goodPoints.push(
          `클릭 1회 비용이 ${won(prevCpc)} → ${won(currCpc)}로 낮아졌습니다.`
        );
      } else if (currCpc > prevCpc) {
        checkPoints.push(
          `클릭 1회 비용이 ${won(prevCpc)} → ${won(currCpc)}로 상승했습니다.`
        );
      }
    }

    if (previous.lpv > 0 && current.lpv > 0) {
      if (currLpvCost < prevLpvCost) {
        goodPoints.push(
          `랜딩 페이지 조회 1회 비용이 ${won(prevLpvCost)} → ${won(currLpvCost)}로 개선됐습니다.`
        );
      } else if (currLpvCost > prevLpvCost) {
        checkPoints.push(
          `랜딩 페이지 조회 1회 비용이 ${won(prevLpvCost)} → ${won(currLpvCost)}로 상승했습니다.`
        );
        nextActions.push(
          "클릭은 발생하지만 랜딩 도달 효율이 떨어지는 광고가 있는지 광고별 LPV 비용을 확인하세요."
        );
      }
    }

    if (videos.length > 0) {
      const bestVideo = videos[0];

      goodPoints.push(
        `영상 완주율이 가장 높은 광고는 “${bestVideo.ad}”이며 3초 시청자 기준 ${bestVideo.completion.toFixed(1)}%가 끝까지 시청했습니다.`
      );

      const worstVideo = [...videos].sort(
        (a, b) => b.worstDrop - a.worstDrop
      )[0];

      if (worstVideo) {
        checkPoints.push(
          `“${worstVideo.ad}”는 ${worstVideo.worstStage} 구간에서 이탈이 가장 큽니다(-${worstVideo.worstDrop.toFixed(1)}%).`
        );

        nextActions.push(
          `“${worstVideo.ad}”의 ${worstVideo.worstStage} 구간을 짧게 줄이거나 핵심 내용을 앞당기는 편집 테스트를 권장합니다.`
        );
      }
    }

    if (landingActualDb > 0 && trackedFormComplete === 0) {
      checkPoints.push(
        `실제 문의(DB)는 ${integer(landingActualDb)}건 발생했지만 GA4 form_complete는 0건입니다. 실제 접수 문제는 아니며 전환 추적 이벤트를 점검해야 합니다.`
      );

      nextActions.push(
        "신청 완료 시 GA4 form_complete 이벤트가 실제 제출 성공 시점에 발생하는지 GTM/GA4 추적을 점검하세요."
      );
    }

        if (worstFunnel && worstFunnel.rate !== null) {
      checkPoints.push(
        `랜딩 퍼널에서 가장 큰 이탈은 ${worstFunnel.from} → ${worstFunnel.to} 구간입니다. 다음 단계 이동률은 ${worstFunnel.rate.toFixed(1)}%입니다.`
      );

      if (landingAction) {
        nextActions.push(landingAction);
      }
    }

    return {
      previous,
      current,
      daily,
      videos,
      landingFunnel,
      worstFunnel,
      goodPoints,
      checkPoints,
      nextActions,
    };
  }, [
    rows,
    prevStart,
    prevEnd,
    currStart,
    currEnd,
    ga4Sessions,
    ga4Cta,
    ga4FormStart,
    ga4FormComplete,
    actualDb,
  ]);

  async function handleFile(file: File | null) {
    if (!file) return;

    setError("");
    setRows([]);
    setFileName(file.name);

    try {
      const lower = file.name.toLowerCase();

      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const sheetName = wb.SheetNames[0];

        if (!sheetName) throw new Error("엑셀 시트를 찾지 못했습니다.");

        const data = XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheetName], {
          defval: "",
          raw: false,
        });

        setRows(data);
        return;
      }

      if (lower.endsWith(".csv")) {
        const csv = await file.text();

        Papa.parse<Row>(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            setRows(result.data);
          },
          error: (err: Error) => {
            setError(err.message);
          },
        });

        return;
      }

      setError("CSV 또는 XLSX만 사용할 수 있습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일 읽기 오류");
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold text-blue-600">
          회의용 · Meta 파일 직접 분석
        </p>
        <h1 className="mt-1 text-3xl font-bold">
          Meta 주간 광고 보고
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          DB 누적값 없이 업로드한 파일만 기준으로 계산합니다.
        </p>
      </div>

      <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-white p-5 hover:border-blue-400">
        <Upload className="h-6 w-6 text-blue-600" />
        <div>
          <div className="font-semibold">
            {fileName || "Meta CSV / XLSX 선택"}
          </div>
          <div className="text-sm text-gray-500">
            비교할 기간이 모두 들어 있는 상세 보고서를 선택하세요.
          </div>
        </div>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="mb-6 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
        <DateInput label="지난 기간 시작" value={prevStart} set={setPrevStart} />
        <DateInput label="지난 기간 종료" value={prevEnd} set={setPrevEnd} />
        <DateInput label="이번 기간 시작" value={currStart} set={setCurrStart} />
        <DateInput label="이번 기간 종료" value={currEnd} set={setCurrEnd} />
      </div>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            GA4 랜딩 퍼널 입력
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            이번 기간을 기준으로 GA4 데이터를 자동으로 불러옵니다.
            자동 조회가 안 될 때만 아래 값을 직접 입력하면 됩니다.
          </p>

          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              ga4AutoLoaded
                ? "border-green-200 bg-green-50 text-green-700"
                : ga4Loading
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {ga4Loading
              ? "GA4 데이터를 불러오는 중..."
              : ga4Message ||
                "기간을 선택하면 GA4 데이터를 자동 조회합니다."}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberInput
            label="랜딩 진입(세션)"
            value={ga4Sessions}
            set={setGa4Sessions}
          />
          <NumberInput
            label="CTA 클릭"
            value={ga4Cta}
            set={setGa4Cta}
          />
          <NumberInput
            label="폼 시작"
            value={ga4FormStart}
            set={setGa4FormStart}
          />
          <NumberInput
            label="실제 문의(DB)"
            value={actualDb}
            set={setActualDb}
          />
        </div>
        <div className="mt-3 text-xs text-gray-500">
          GA4 form_complete 추적값:{" "}
          <span className="font-semibold">
            {ga4FormComplete || "0"}건
          </span>
          {n(actualDb) > 0 && n(ga4FormComplete) === 0 ? (
            <span className="ml-2 font-semibold text-amber-600">
              · 실제 DB는 있으므로 GA4 완료 추적 점검 필요
            </span>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {analysis ? (
        <>
          <Section title="이번 주 한눈에 보기">
            <div className="grid gap-4 p-5 lg:grid-cols-3">
              <InsightCard
                title="잘된 점"
                icon="✅"
                items={
                  analysis.goodPoints.length
                    ? analysis.goodPoints
                    : ["현재 데이터에서 뚜렷한 개선 신호가 아직 확인되지 않았습니다."]
                }
              />

              <InsightCard
                title="확인할 점"
                icon="⚠️"
                items={
                  analysis.checkPoints.length
                    ? analysis.checkPoints
                    : ["현재 입력된 데이터에서 특별한 경고 신호는 확인되지 않았습니다."]
                }
              />

              <InsightCard
                title="다음 액션"
                icon="→"
                items={
                  analysis.nextActions.length
                    ? analysis.nextActions
                    : ["추가 데이터가 쌓이면 우선순위를 자동으로 제안합니다."]
                }
              />
            </div>
          </Section>

          <Section title="지난 기간 vs 이번 기간">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>지표</Th>
                    <Th right>{prevStart} ~ {prevEnd}</Th>
                    <Th right>{currStart} ~ {currEnd}</Th>
                    <Th right>변화</Th>
                  </tr>
                </thead>
                <tbody>
                  <CompareRow
                    name="광고비"
                    prev={analysis.previous.spend}
                    curr={analysis.current.spend}
                    format={won}
                  />
                  <CompareRow
                    name="노출"
                    prev={analysis.previous.impressions}
                    curr={analysis.current.impressions}
                    format={(v) => `${integer(v)}회`}
                  />
                  <CompareRow
                    name="링크 클릭"
                    prev={analysis.previous.clicks}
                    curr={analysis.current.clicks}
                    format={(v) => `${integer(v)}회`}
                  />
                  <CompareRow
                    name="랜딩 페이지 조회"
                    prev={analysis.previous.lpv}
                    curr={analysis.current.lpv}
                    format={(v) => `${integer(v)}회`}
                  />
                  <CompareRow
                    name="링크 클릭률"
                    prev={ctr(analysis.previous)}
                    curr={ctr(analysis.current)}
                    format={(v) => `${v.toFixed(2)}%`}
                  />
                  <CompareRow
                    name="클릭 1회 비용"
                    prev={cpc(analysis.previous)}
                    curr={cpc(analysis.current)}
                    format={won}
                  />
                  <CompareRow
                    name="LPV 1회 비용"
                    prev={lpvCost(analysis.previous)}
                    curr={lpvCost(analysis.current)}
                    format={won}
                  />
                  <CompareRow
                    name="1,000회 노출 비용"
                    prev={cpm(analysis.previous)}
                    curr={cpm(analysis.current)}
                    format={won}
                  />
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="이번 기간 일별 성과">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>날짜</Th>
                    <Th right>광고비</Th>
                    <Th right>노출</Th>
                    <Th right>클릭</Th>
                    <Th right>LPV</Th>
                    <Th right>클릭 비용</Th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.daily.map((r) => {
                    const m: Metrics = r;
                    return (
                      <tr key={r.date} className="border-t">
                        <Td>{r.date}</Td>
                        <Td right>{won(r.spend)}</Td>
                        <Td right>{integer(r.impressions)}</Td>
                        <Td right>{integer(r.clicks)}</Td>
                        <Td right>{integer(r.lpv)}</Td>
                        <Td right>{r.clicks ? won(cpc(m)) : "-"}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="영상별 완주 성과">
            <div className="border-b bg-blue-50 px-5 py-3 text-sm text-blue-800">
              완주율 = 3초 이상 본 사람 중 100%까지 본 비율 · 높은 순
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>캠페인</Th>
                    <Th>영상/광고</Th>
                    <Th right>3초</Th>
                    <Th right>25%</Th>
                    <Th right>50%</Th>
                    <Th right>75%</Th>
                    <Th right>100%</Th>
                    <Th right>완주율</Th>
                    <Th>가장 큰 이탈</Th>
                  </tr>
                </thead>

                <tbody>
                  {analysis.videos.map((v, i) => (
                    <tr
                      key={`${v.campaign}-${v.ad}-${i}`}
                      className="border-t"
                    >
                      <Td>{v.campaign}</Td>
                      <Td>
                        <div className="font-medium">{v.ad}</div>
                        <div className="text-xs text-gray-400">
                          광고비 {won(v.spend)}
                        </div>
                      </Td>
                      <Td right>{integer(v.v3)}</Td>
                      <Td right>{integer(v.v25)}</Td>
                      <Td right>{integer(v.v50)}</Td>
                      <Td right>{integer(v.v75)}</Td>
                      <Td right>{integer(v.v100)}</Td>
                      <Td right>
                        <span className="font-semibold">
                          {v.completion.toFixed(1)}%
                        </span>
                      </Td>
                      <Td>
                        {v.worstStage}
                        <span className="ml-1 text-red-600">
                          (-{v.worstDrop.toFixed(1)}%)
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="랜딩 이탈 분석">
            {analysis.landingFunnel[0].count > 0 ? (
              <div className="p-5">
                <div className="grid gap-3 md:grid-cols-4">
                  {analysis.landingFunnel.map((stage, index) => (
                    <div
                      key={stage.key}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="text-sm text-gray-500">
                        {index + 1}. {stage.label}
                      </div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">
                        {integer(stage.count)}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {stage.rate === null
                          ? "기준 100%"
                          : `이전 단계의 ${stage.rate.toFixed(1)}%`}
                      </div>
                    </div>
                  ))}
                </div>

                {analysis.worstFunnel ? (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="font-semibold text-amber-900">
                      ⚠️ 가장 큰 이탈 구간
                    </div>
                    <p className="mt-1 text-sm text-amber-800">
                      {analysis.worstFunnel.from} →{" "}
                      {analysis.worstFunnel.to}
                      {" · "}
                      다음 단계 이동률{" "}
                      {analysis.worstFunnel.rate?.toFixed(1)}%
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="font-semibold text-gray-900">
                    스크롤 구간 분석
                  </div>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    현재 GA4 저장 구조에는 25%·50%·75%·90% 스크롤 값이
                    구간별로 분리되어 있지 않아 임의로 표시하지 않습니다.
                    현재는 랜딩 진입 → CTA 클릭 → 폼 시작 → 폼 완료를 정확하게 분석합니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                위 GA4 입력칸에 이번 기간의 랜딩 세션, CTA 클릭,
                폼 시작, 폼 완료를 입력하면 자동 분석됩니다.
              </div>
            )}
          </Section>
        </>
      ) : (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          8/17~8/31 상세 Meta 파일을 선택하세요.
        </div>
      )}
    </main>
  );
}

function CompareRow({
  name,
  prev,
  curr,
  format,
}: {
  name: string;
  prev: number;
  curr: number;
  format: (v: number) => string;
}) {
  const diff = change(curr, prev);

  return (
    <tr className="border-t">
      <Td>{name}</Td>
      <Td right>{format(prev)}</Td>
      <Td right>
        <span className="font-semibold">{format(curr)}</span>
      </Td>
      <Td right>
        <span
          className={
            diff === null
              ? "text-gray-400"
              : diff > 0
                ? "text-red-600"
                : diff < 0
                  ? "text-blue-600"
                  : "text-gray-500"
          }
        >
          {diff === null
            ? "-"
            : `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`}
        </span>
      </Td>
    </tr>
  );
}

function DateInput({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
}) {
  return (
    <label>
      <div className="mb-1 text-xs font-medium text-gray-500">
        {label}
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Th({
  children,
  right = false,
}: {
  children: ReactNode;
  right?: boolean;
}) {
  return (
    <th
      className={`bg-gray-50 px-5 py-3 font-medium text-gray-500 ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right = false,
}: {
  children: ReactNode;
  right?: boolean;
}) {
  return (
    <td className={`px-5 py-3 ${right ? "text-right" : "text-left"}`}>
      {children}
    </td>
  );
}

function NumberInput({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
}) {
  return (
    <label>
      <div className="mb-1 text-xs font-medium text-gray-500">
        {label}
      </div>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder="0"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function InsightCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center gap-2 font-bold text-gray-900">
        <span>{icon}</span>
        <span>{title}</span>
      </div>

      <div className="space-y-3">
        {items.slice(0, 4).map((item, index) => (
          <p
            key={index}
            className="text-sm leading-6 text-gray-700"
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

