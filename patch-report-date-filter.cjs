const fs = require("fs");

const p = "./app/report/page.tsx";
let s = fs.readFileSync(p, "utf8");

function mustReplace(oldText, newText, label) {
  if (!s.includes(oldText)) {
    throw new Error(label + " 위치를 찾지 못했습니다.");
  }
  s = s.replace(oldText, newText);
}

/* -------------------------------------------------------
   1. 날짜 유틸 추가
------------------------------------------------------- */

const dynamicLine = `export const dynamic = "force-dynamic";`;

mustReplace(
  dynamicLine,
`${dynamicLine}

function dateOnly(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return \`\${y}-\${m}-\${d}\`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function resolveReportRange(params: {
  preset?: string;
  start?: string;
  end?: string;
}) {
  const now = new Date();

  if (
    params.start &&
    params.end &&
    /^\\d{4}-\\d{2}-\\d{2}$/.test(params.start) &&
    /^\\d{4}-\\d{2}-\\d{2}$/.test(params.end)
  ) {
    return {
      preset: "custom",
      startDate: params.start,
      endDate: params.end,
      label: "직접 선택",
    };
  }

  if (params.preset === "this-week") {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = addDays(now, mondayOffset);

    return {
      preset: "this-week",
      startDate: dateOnly(monday),
      endDate: dateOnly(now),
      label: "이번 주",
    };
  }

  if (params.preset === "last-week") {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const thisMonday = addDays(now, mondayOffset);
    const lastMonday = addDays(thisMonday, -7);
    const lastSunday = addDays(thisMonday, -1);

    return {
      preset: "last-week",
      startDate: dateOnly(lastMonday),
      endDate: dateOnly(lastSunday),
      label: "지난주",
    };
  }

  const end = now;
  const start = addDays(end, -6);

  return {
    preset: "7d",
    startDate: dateOnly(start),
    endDate: dateOnly(end),
    label: "최근 7일",
  };
}`,
  "dynamic"
);

/* -------------------------------------------------------
   2. 페이지 props + 선택기간
------------------------------------------------------- */

mustReplace(
`export default async function ReportPage() {
  let summary;`,
`interface ReportPageProps {
  searchParams: Promise<{
    preset?: string;
    start?: string;
    end?: string;
  }>;
}

export default async function ReportPage({
  searchParams,
}: ReportPageProps) {
  const params = await searchParams;
  const selectedRange = resolveReportRange(params);

  let summary;`,
  "ReportPage"
);

/* -------------------------------------------------------
   3. builder에 날짜 전달
------------------------------------------------------- */

mustReplace(
`    summary = await buildAdPerformanceSummary();`,
`    summary = await buildAdPerformanceSummary({
      startDate: selectedRange.startDate,
      endDate: selectedRange.endDate,
    });`,
  "buildAdPerformanceSummary"
);

/* -------------------------------------------------------
   4. recentDays는 builder가 이미 선택 기간만 반환
------------------------------------------------------- */

const recentStart = s.indexOf(
`  /*
   * 요약 보고 기간 정합성`
);

const recentEndMarker = `  /*
   * 광고 판단
   */`;

const recentEnd = s.indexOf(recentEndMarker);

if (recentStart === -1 || recentEnd === -1) {
  throw new Error("기간 계산 블록을 찾지 못했습니다.");
}

const newPeriodBlock = `  /*
   * 선택한 기간 데이터.
   * Meta 데이터가 없는 뒤쪽 날짜는 CPA 왜곡 방지를 위해
   * 마지막 광고비 확인일까지 KPI 계산에서 제외한다.
   */
  const allDaily = summary.dailyPerformance;

  let latestMetaIndex = -1;

  for (let i = allDaily.length - 1; i >= 0; i -= 1) {
    if (allDaily[i].spend > 0) {
      latestMetaIndex = i;
      break;
    }
  }

  const recentDays =
    latestMetaIndex >= 0
      ? allDaily.slice(0, latestMetaIndex + 1)
      : allDaily;

  const periodSpend = recentDays.reduce(
    (sum, row) => sum + row.spend,
    0
  );

  const periodDb = recentDays.reduce(
    (sum, row) => sum + row.db,
    0
  );

  const periodValidDb = recentDays.reduce(
    (sum, row) => sum + row.validDb,
    0
  );

  const periodBookings = recentDays.reduce(
    (sum, row) => sum + row.bookings,
    0
  );

  const periodCpa =
    periodDb > 0 ? periodSpend / periodDb : null;

  const latestMetaDate =
    recentDays.length > 0
      ? recentDays[recentDays.length - 1].date
      : null;

  const laterDbRows =
    latestMetaDate !== null
      ? allDaily.filter(
          (row) =>
            row.date > latestMetaDate &&
            (row.db > 0 ||
              row.validDb > 0 ||
              row.bookings > 0)
        )
      : [];

  const hasDateMismatch = laterDbRows.length > 0;

`;

s =
  s.slice(0, recentStart) +
  newPeriodBlock +
  s.slice(recentEnd);

/* -------------------------------------------------------
   5. 기간 UI 삽입
------------------------------------------------------- */

const pageHeaderEnd = `      {/* 기간 */}`;

const filterUi = `      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              보고 기간
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {selectedRange.startDate} ~ {selectedRange.endDate}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/report?preset=this-week"
              className={\`rounded-lg border px-3 py-2 text-xs font-medium transition \${
                selectedRange.preset === "this-week"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }\`}
            >
              이번 주
            </Link>

            <Link
              href="/report?preset=last-week"
              className={\`rounded-lg border px-3 py-2 text-xs font-medium transition \${
                selectedRange.preset === "last-week"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }\`}
            >
              지난주
            </Link>

            <Link
              href="/report?preset=7d"
              className={\`rounded-lg border px-3 py-2 text-xs font-medium transition \${
                selectedRange.preset === "7d"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }\`}
            >
              최근 7일
            </Link>
          </div>
        </div>

        <form
          method="GET"
          action="/report"
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-4"
        >
          <div>
            <label
              htmlFor="report-start"
              className="mb-1 block text-xs text-gray-500"
            >
              시작일
            </label>
            <input
              id="report-start"
              name="start"
              type="date"
              defaultValue={selectedRange.startDate}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700"
            />
          </div>

          <div>
            <label
              htmlFor="report-end"
              className="mb-1 block text-xs text-gray-500"
            >
              종료일
            </label>
            <input
              id="report-end"
              name="end"
              type="date"
              defaultValue={selectedRange.endDate}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800"
          >
            기간 조회
          </button>
        </form>
      </section>

      {/* 기간 */}`;

mustReplace(
  pageHeaderEnd,
  filterUi,
  "기간 UI"
);

/* -------------------------------------------------------
   6. 기존 '최근 수집 7일' 표시를 선택기간으로 변경
------------------------------------------------------- */

s = s.replace(
  `광고 데이터 기준 최근 7일`,
  `{selectedRange.label}`
);

s = s.replaceAll(
  `최근 7일 추이`,
  `기간별 일자 추이`
);

s = s.replaceAll(
  `최근 7일 동안`,
  `선택한 기간 동안`
);

fs.writeFileSync(p, s, "utf8");

console.log("✅ 요약 보고 기간 필터 추가 완료");
