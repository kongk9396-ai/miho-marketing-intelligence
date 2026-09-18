const fs = require("fs");

const path = "./app/report/meeting/page.tsx";
let s = fs.readFileSync(path, "utf8");

function mustReplace(oldText, newText, label) {
  if (!s.includes(oldText)) {
    throw new Error(`${label} 위치를 찾지 못했습니다.`);
  }

  s = s.replace(oldText, newText);
}

/* 1. GA4 입력 state 추가 */
mustReplace(
`  const [error, setError] = useState("");

  // 이번 회의 비교 기준`,
`  const [error, setError] = useState("");

  // 회의용 GA4 랜딩 퍼널 직접 입력
  const [ga4Sessions, setGa4Sessions] = useState("");
  const [ga4Cta, setGa4Cta] = useState("");
  const [ga4FormStart, setGa4FormStart] = useState("");
  const [ga4FormComplete, setGa4FormComplete] = useState("");

  // 이번 회의 비교 기준`,
"GA4 state"
);

/* 2. analysis return 직전에 랜딩 퍼널 + 자동 진단 추가 */
mustReplace(
`    return {
      previous,
      current,
      daily,
      videos,
    };
  }, [rows, prevStart, prevEnd, currStart, currEnd]);`,
`    const landingSessions = n(ga4Sessions);
    const landingCta = n(ga4Cta);
    const landingFormStart = n(ga4FormStart);
    const landingFormComplete = n(ga4FormComplete);

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
        key: "form_complete",
        label: "폼 완료",
        count: landingFormComplete,
        rate:
          landingFormStart > 0
            ? (landingFormComplete / landingFormStart) * 100
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
        to: "폼 완료",
        rate:
          landingFormStart > 0
            ? (landingFormComplete / landingFormStart) * 100
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
        "폼까지 들어온 사용자가 완료 전에 많이 이탈합니다. 입력 항목 수, 필수 항목, 오류 메시지, 개인정보 동의 영역을 우선 점검하세요.";
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
          \`링크 클릭률이 지난 기간 \${prevCtr.toFixed(2)}% → 이번 기간 \${currCtr.toFixed(2)}%로 개선됐습니다.\`
        );
      } else if (currCtr < prevCtr) {
        checkPoints.push(
          \`링크 클릭률이 지난 기간 \${prevCtr.toFixed(2)}% → 이번 기간 \${currCtr.toFixed(2)}%로 낮아졌습니다.\`
        );
        nextActions.push(
          "클릭률이 낮아진 광고부터 첫 장면·카피·썸네일 후킹을 비교하세요."
        );
      }
    }

    if (previous.clicks > 0 && current.clicks > 0) {
      if (currCpc < prevCpc) {
        goodPoints.push(
          \`클릭 1회 비용이 \${won(prevCpc)} → \${won(currCpc)}로 낮아졌습니다.\`
        );
      } else if (currCpc > prevCpc) {
        checkPoints.push(
          \`클릭 1회 비용이 \${won(prevCpc)} → \${won(currCpc)}로 상승했습니다.\`
        );
      }
    }

    if (previous.lpv > 0 && current.lpv > 0) {
      if (currLpvCost < prevLpvCost) {
        goodPoints.push(
          \`랜딩 페이지 조회 1회 비용이 \${won(prevLpvCost)} → \${won(currLpvCost)}로 개선됐습니다.\`
        );
      } else if (currLpvCost > prevLpvCost) {
        checkPoints.push(
          \`랜딩 페이지 조회 1회 비용이 \${won(prevLpvCost)} → \${won(currLpvCost)}로 상승했습니다.\`
        );
        nextActions.push(
          "클릭은 발생하지만 랜딩 도달 효율이 떨어지는 광고가 있는지 광고별 LPV 비용을 확인하세요."
        );
      }
    }

    if (videos.length > 0) {
      const bestVideo = videos[0];

      goodPoints.push(
        \`영상 완주율이 가장 높은 광고는 “\${bestVideo.ad}”이며 3초 시청자 기준 \${bestVideo.completion.toFixed(1)}%가 끝까지 시청했습니다.\`
      );

      const worstVideo = [...videos].sort(
        (a, b) => b.worstDrop - a.worstDrop
      )[0];

      if (worstVideo) {
        checkPoints.push(
          \`“\${worstVideo.ad}”는 \${worstVideo.worstStage} 구간에서 이탈이 가장 큽니다(-\${worstVideo.worstDrop.toFixed(1)}%).\`
        );

        nextActions.push(
          \`“\${worstVideo.ad}”의 \${worstVideo.worstStage} 구간을 짧게 줄이거나 핵심 내용을 앞당기는 편집 테스트를 권장합니다.\`
        );
      }
    }

    if (worstFunnel && worstFunnel.rate !== null) {
      checkPoints.push(
        \`랜딩 퍼널에서 가장 큰 이탈은 \${worstFunnel.from} → \${worstFunnel.to} 구간입니다. 다음 단계 이동률은 \${worstFunnel.rate.toFixed(1)}%입니다.\`
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
  ]);`,
"analysis 자동 진단"
);

/* 3. 날짜 필터 아래 GA4 입력칸 추가 */
mustReplace(
`      <div className="mb-6 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
        <DateInput label="지난 기간 시작" value={prevStart} set={setPrevStart} />
        <DateInput label="지난 기간 종료" value={prevEnd} set={setPrevEnd} />
        <DateInput label="이번 기간 시작" value={currStart} set={setCurrStart} />
        <DateInput label="이번 기간 종료" value={currEnd} set={setCurrEnd} />
      </div>`,
`      <div className="mb-6 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
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
            이번 기간 GA4 숫자 4개를 입력하면 랜딩 이탈 구간을 자동 분석합니다.
          </p>
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
            label="폼 완료"
            value={ga4FormComplete}
            set={setGa4FormComplete}
          />
        </div>
      </section>`,
"GA4 입력 UI"
);

/* 4. analysis 시작 직후 한눈에 보기 추가 */
mustReplace(
`      {analysis ? (
        <>
          <Section title="지난 기간 vs 이번 기간">`,
`      {analysis ? (
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

          <Section title="지난 기간 vs 이번 기간">`,
"한눈에 보기"
);

/* 5. 기존 다음 단계 랜딩 안내를 실제 퍼널로 교체 */
const oldLanding = `          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="font-semibold text-amber-900">
              다음 단계: 랜딩 이탈 분석
            </div>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Meta 파일에서는 랜딩 페이지 조회까지만 알 수 있습니다.
              랜딩 진입 → 스크롤 25% → 50% → 75% → 90% →
              CTA 클릭 → 폼 시작 → 완료는 GA4 이벤트를 연결해서 별도로 표시합니다.
            </p>
          </div>`;

if (s.includes(oldLanding)) {
  s = s.replace(
    oldLanding,
`          <Section title="랜딩 이탈 분석">
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
                          : \`이전 단계의 \${stage.rate.toFixed(1)}%\`}
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
          </Section>`
  );
}

fs.writeFileSync(path, s, "utf8");

console.log("✅ GA4 랜딩 퍼널 + 자동 인사이트 추가 완료");
