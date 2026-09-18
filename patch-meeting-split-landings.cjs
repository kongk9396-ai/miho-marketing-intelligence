const fs = require("fs");

const path = "./app/report/meeting/page.tsx";
let s = fs.readFileSync(path, "utf8");

function replaceOnce(oldText, newText, label) {
  if (!s.includes(oldText)) {
    throw new Error(`${label} 위치를 찾지 못했습니다.`);
  }
  s = s.replace(oldText, newText);
}

/* -----------------------------------------
   1. 랜딩별 DB 타입 + state 추가
----------------------------------------- */

const stateMarker =
`  const [actualDb, setActualDb] = useState("");`;

replaceOnce(
  stateMarker,
`  const [actualDb, setActualDb] = useState("");

  const [landingDb, setLandingDb] = useState<
    Array<{
      key: string;
      label: string;
      actualDb: number;
      ads: Array<{
        adName: string;
        db: number;
      }>;
    }>
  >([]);`,
  "landingDb state"
);

/* -----------------------------------------
   2. meeting-leads 응답을 state에 저장
----------------------------------------- */

const leadsMarker =
`        const totalActualDb = Array.isArray(leadsData.landings)
          ? leadsData.landings.reduce(
              (sum: number, landing: { actualDb?: number }) =>
                sum + Number(landing.actualDb ?? 0),
              0
            )
          : 0;

        setActualDb(String(totalActualDb));`;

replaceOnce(
  leadsMarker,
`        const parsedLandings = Array.isArray(leadsData.landings)
          ? leadsData.landings
          : [];

        const totalActualDb = parsedLandings.reduce(
          (sum: number, landing: { actualDb?: number }) =>
            sum + Number(landing.actualDb ?? 0),
          0
        );

        setLandingDb(parsedLandings);
        setActualDb(String(totalActualDb));`,
  "landing leads fetch"
);

/* -----------------------------------------
   3. 표시용 변수 추가
----------------------------------------- */

const memoMarker =
`  const analysis = useMemo(() => {`;

if (!s.includes(memoMarker)) {
  throw new Error("analysis useMemo 위치를 찾지 못했습니다.");
}

s = s.replace(
  memoMarker,
`  const firstNoseDb =
    landingDb.find((item) => item.key === "first_nose") ?? {
      key: "first_nose",
      label: "코첫",
      actualDb: 0,
      ads: [],
    };

  const underEyeDb =
    landingDb.find((item) => item.key === "under_eye") ?? {
      key: "under_eye",
      label: "눈밑",
      actualDb: 0,
      ads: [],
    };

${memoMarker}`
);

/* -----------------------------------------
   4. 실제 DB 총합 카드 뒤에 랜딩별 카드 삽입
----------------------------------------- */

const sectionMarker =
`        <div className="mt-3 text-xs text-gray-500">`;

if (!s.includes(sectionMarker)) {
  throw new Error("GA4 추적 안내 영역을 찾지 못했습니다.");
}

s = s.replace(
  sectionMarker,
`        <div className="mt-5 grid gap-4 md:grid-cols-2">

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  코첫 랜딩
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Google Sheet 실제 문의
                </div>
              </div>

              <div className="text-2xl font-bold text-gray-900">
                {firstNoseDb.actualDb}
                <span className="ml-1 text-sm font-medium text-gray-500">
                  건
                </span>
              </div>
            </div>

            {firstNoseDb.ads.length > 0 ? (
              <div className="mt-4 space-y-2">
                {firstNoseDb.ads.map((ad) => (
                  <div
                    key={ad.adName}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate pr-3 text-gray-700">
                      {ad.adName}
                    </span>
                    <span className="shrink-0 font-semibold text-gray-900">
                      DB {ad.db}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-xs text-gray-400">
                광고별 식별 정보가 없습니다.
              </div>
            )}
          </div>


          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  눈밑 랜딩
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Google Sheet 실제 문의
                </div>
              </div>

              <div className="text-2xl font-bold text-gray-900">
                {underEyeDb.actualDb}
                <span className="ml-1 text-sm font-medium text-gray-500">
                  건
                </span>
              </div>
            </div>

            {underEyeDb.ads.length > 0 ? (
              <div className="mt-4 space-y-2">
                {underEyeDb.ads.map((ad) => (
                  <div
                    key={ad.adName}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate pr-3 text-gray-700">
                      {ad.adName}
                    </span>
                    <span className="shrink-0 font-semibold text-gray-900">
                      DB {ad.db}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-xs text-gray-400">
                광고별 식별 정보가 없습니다.
              </div>
            )}
          </div>

        </div>

${sectionMarker}`
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 회의 화면 코첫 / 눈밑 실제 DB 분리 완료");
