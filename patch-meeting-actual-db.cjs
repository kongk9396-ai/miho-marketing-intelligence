const fs = require("fs");

const path = "./app/report/meeting/page.tsx";
let s = fs.readFileSync(path, "utf8");

function mustReplace(oldText, newText, label) {
  if (!s.includes(oldText)) {
    throw new Error(`${label} 위치를 찾지 못했습니다.`);
  }

  s = s.replace(oldText, newText);
}

/* 실제 DB state 추가 */
mustReplace(
`  const [ga4FormStart, setGa4FormStart] = useState("");
  const [ga4FormComplete, setGa4FormComplete] = useState("");`,
`  const [ga4FormStart, setGa4FormStart] = useState("");
  const [ga4FormComplete, setGa4FormComplete] = useState("");
  const [actualDb, setActualDb] = useState("");`,
"actualDb state"
);

/* API 응답값 저장 */
mustReplace(
`        setGa4FormStart(String(data.formStarts ?? 0));
        setGa4FormComplete(String(data.formCompletes ?? 0));`,
`        setGa4FormStart(String(data.formStarts ?? 0));
        setGa4FormComplete(String(data.formCompletes ?? 0));
        setActualDb(String(data.actualDb ?? 0));`,
"API actualDb"
);

/* 분석에서 마지막 단계는 실제 DB 사용 */
mustReplace(
`    const landingFormStart = n(ga4FormStart);
    const landingFormComplete = n(ga4FormComplete);`,
`    const landingFormStart = n(ga4FormStart);

    // 실제 상담 신청(DB)을 최종 전환으로 사용한다.
    // GA4 form_complete는 추적 정상 여부 확인용으로만 사용한다.
    const landingActualDb = n(actualDb);
    const trackedFormComplete = n(ga4FormComplete);`,
"funnel values"
);

/* 마지막 퍼널 단계 */
mustReplace(
`      {
        key: "form_complete",
        label: "폼 완료",
        count: landingFormComplete,
        rate:
          landingFormStart > 0
            ? (landingFormComplete / landingFormStart) * 100
            : null,
      },`,
`      {
        key: "actual_db",
        label: "실제 문의(DB)",
        count: landingActualDb,
        rate:
          landingFormStart > 0
            ? (landingActualDb / landingFormStart) * 100
            : null,
      },`,
"actual DB funnel stage"
);

/* 이탈 계산 마지막 단계 */
mustReplace(
`      {
        from: "폼 시작",
        to: "폼 완료",
        rate:
          landingFormStart > 0
            ? (landingFormComplete / landingFormStart) * 100
            : null,
      },`,
`      {
        from: "폼 시작",
        to: "실제 문의(DB)",
        rate:
          landingFormStart > 0
            ? (landingActualDb / landingFormStart) * 100
            : null,
      },`,
"actual DB drop"
);

/* 액션 문구 */
s = s.replaceAll(
  'worstFunnel?.from === "폼 시작"',
  'worstFunnel?.from === "폼 시작"'
);

s = s.replace(
`      landingAction =
        "폼까지 들어온 사용자가 완료 전에 많이 이탈합니다. 입력 항목 수, 필수 항목, 오류 메시지, 개인정보 동의 영역을 우선 점검하세요.";`,
`      landingAction =
        "폼을 시작했지만 실제 문의(DB)로 이어지는 비율이 낮습니다. 입력 항목 수, 제출 버튼, 개인정보 동의, 제출 후 DB 저장 과정까지 확인하세요.";`
);

/* 추적 이상 경고 */
const insightMarker = `    if (worstFunnel && worstFunnel.rate !== null) {`;

if (!s.includes(insightMarker)) {
  throw new Error("인사이트 위치를 찾지 못했습니다.");
}

s = s.replace(
  insightMarker,
`    if (landingActualDb > 0 && trackedFormComplete === 0) {
      checkPoints.push(
        \`실제 문의(DB)는 \${integer(landingActualDb)}건 발생했지만 GA4 form_complete는 0건입니다. 실제 접수 문제는 아니며 전환 추적 이벤트를 점검해야 합니다.\`
      );

      nextActions.push(
        "신청 완료 시 GA4 form_complete 이벤트가 실제 제출 성공 시점에 발생하는지 GTM/GA4 추적을 점검하세요."
      );
    }

    ${insightMarker}`
);

/* dependency actualDb 추가 */
mustReplace(
`    ga4FormStart,
    ga4FormComplete,
  ]);`,
`    ga4FormStart,
    ga4FormComplete,
    actualDb,
  ]);`,
"dependency"
);

/* 입력칸 폼완료 -> 실제 DB */
mustReplace(
`          <NumberInput
            label="폼 완료"
            value={ga4FormComplete}
            set={setGa4FormComplete}
          />`,
`          <NumberInput
            label="실제 문의(DB)"
            value={actualDb}
            set={setActualDb}
          />`,
"actual DB input"
);

/* 설명문도 수정 */
s = s.replace(
  "이번 기간 GA4 숫자 4개를 입력하면 랜딩 이탈 구간을 자동 분석합니다.",
  "GA4와 실제 문의 데이터를 자동으로 불러와 랜딩 이탈 구간을 분석합니다."
);

s = s.replace(
  "랜딩 세션, CTA 클릭, 폼 시작, 폼 완료",
  "랜딩 세션, CTA 클릭, 폼 시작, 실제 문의(DB)"
);

/* GA4 추적 상태 안내를 입력칸 아래에 추가 */
const inputEnd = `        </div>
      </section>`;

const firstIndex = s.indexOf(
  '<section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">'
);

if (firstIndex !== -1) {
  const endIndex = s.indexOf(inputEnd, firstIndex);

  if (endIndex !== -1) {
    const insertAt = endIndex + `        </div>`.length;

    s =
      s.slice(0, insertAt) +
`
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
        </div>` +
      s.slice(insertAt);
  }
}

fs.writeFileSync(path, s, "utf8");

console.log("✅ 회의용 퍼널을 실제 문의(DB) 기준으로 변경 완료");
