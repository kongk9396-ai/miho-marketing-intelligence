const fs = require("fs");

const path = "./app/report/meeting/page.tsx";
let s = fs.readFileSync(path, "utf8");

function replaceOnce(oldText, newText, label) {
  if (!s.includes(oldText)) {
    throw new Error(`${label} 위치를 찾지 못했습니다.`);
  }

  s = s.replace(oldText, newText);
}

/* useEffect 추가 */
replaceOnce(
  'import { useMemo, useState } from "react";',
  'import { useEffect, useMemo, useState } from "react";',
  "React import"
);

/* GA4 상태 추가 */
replaceOnce(
`  const [ga4Sessions, setGa4Sessions] = useState("");
  const [ga4Cta, setGa4Cta] = useState("");
  const [ga4FormStart, setGa4FormStart] = useState("");
  const [ga4FormComplete, setGa4FormComplete] = useState("");`,
`  const [ga4Sessions, setGa4Sessions] = useState("");
  const [ga4Cta, setGa4Cta] = useState("");
  const [ga4FormStart, setGa4FormStart] = useState("");
  const [ga4FormComplete, setGa4FormComplete] = useState("");

  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4AutoLoaded, setGa4AutoLoaded] = useState(false);
  const [ga4Message, setGa4Message] = useState("");`,
  "GA4 state"
);

/* currStart/currEnd 선언 뒤 자동 fetch 추가 */
const marker = `  const [currStart, setCurrStart] = useState("2026-08-24");
  const [currEnd, setCurrEnd] = useState("2026-08-31");`;

replaceOnce(
marker,
`${marker}

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
          \`/api/report/meeting-ga4?\${params.toString()}\`,
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

        setGa4AutoLoaded(true);
        setGa4Message(
          \`GA4에서 \${currStart} ~ \${currEnd} 데이터를 자동으로 불러왔습니다.\`
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
  }, [currStart, currEnd]);`,
  "GA4 auto fetch"
);

/* GA4 설명문 교체 */
replaceOnce(
`          <p className="mt-1 text-sm text-gray-500">
            이번 기간 GA4 숫자 4개를 입력하면 랜딩 이탈 구간을 자동 분석합니다.
          </p>`,
`          <p className="mt-1 text-sm text-gray-500">
            이번 기간을 기준으로 GA4 데이터를 자동으로 불러옵니다.
            자동 조회가 안 될 때만 아래 값을 직접 입력하면 됩니다.
          </p>

          <div
            className={\`mt-3 rounded-lg border px-3 py-2 text-sm \${
              ga4AutoLoaded
                ? "border-green-200 bg-green-50 text-green-700"
                : ga4Loading
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
            }\`}
          >
            {ga4Loading
              ? "GA4 데이터를 불러오는 중..."
              : ga4Message ||
                "기간을 선택하면 GA4 데이터를 자동 조회합니다."}
          </div>`,
  "GA4 description"
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 회의용 GA4 자동 조회 연결 완료");
