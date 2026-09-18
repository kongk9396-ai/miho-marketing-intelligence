const fs = require("fs");

//
// 1. 광고 진단 빌더에 기간 인자 추가
//
const diagnosisPath = "./lib/ad-diagnosis/build.ts";
let d = fs.readFileSync(diagnosisPath, "utf8");

function mustReplace(source, oldText, newText, label) {
  if (!source.includes(oldText)) {
    throw new Error(`${label} 위치를 찾지 못했습니다.`);
  }
  return source.replace(oldText, newText);
}

/* range 타입 추가 */
d = mustReplace(
  d,
`export interface CampaignAdDiagnosisGroup {
  campaignName: string;
  summary: CampaignDiagnosisSummary;
  ads: AdDiagnosisResult[];
}`,
`export interface CampaignAdDiagnosisGroup {
  campaignName: string;
  summary: CampaignDiagnosisSummary;
  ads: AdDiagnosisResult[];
}

export interface AdDiagnosisRange {
  startDate?: string;
  endDate?: string;
}`,
  "AdDiagnosisRange"
);

/* buildAdInput 기간 인자 추가 */
d = mustReplace(
  d,
`  },
  formCompleteTrackingConnected: boolean
): Promise<AdDiagnosisAdInput> {
  const today = toKstDateOnly(new Date().toISOString());
  const start = addDaysToDateOnly(today, -30);

  const metaRows = await getMetaDailyRawRowsForAds(ad.adIds, start, today);`,
`  },
  formCompleteTrackingConnected: boolean,
  startDate: string,
  endDate: string
): Promise<AdDiagnosisAdInput> {
  const metaRows = await getMetaDailyRawRowsForAds(
    ad.adIds,
    startDate,
    endDate
  );`,
  "buildAdInput 기간"
);

/* GA4 기간 */
d = d.replace(
`      startDate: start,
      endDate: today,`,
`      startDate,
      endDate,`
);

/* DB 기간 */
d = mustReplace(
  d,
`    const startIso = kstDateOnlyToInstantIso(start);
    const endIsoExclusive = kstDateOnlyToInstantIso(addDaysToDateOnly(today, 1));`,
`    const startIso = kstDateOnlyToInstantIso(startDate);
    const endIsoExclusive = kstDateOnlyToInstantIso(
      addDaysToDateOnly(endDate, 1)
    );`,
  "DB 기간"
);

/* buildAdDiagnosisGroups 기간 인자 */
d = mustReplace(
  d,
`export async function buildAdDiagnosisGroups(adLimit = 30): Promise<CampaignAdDiagnosisGroup[]> {
  const hierarchy = await getMetaAdHierarchy();`,
`export async function buildAdDiagnosisGroups(
  adLimit = 30,
  range: AdDiagnosisRange = {}
): Promise<CampaignAdDiagnosisGroup[]> {
  const defaultEndDate = toKstDateOnly(new Date().toISOString());

  const endDate =
    range.endDate && /^\\d{4}-\\d{2}-\\d{2}$/.test(range.endDate)
      ? range.endDate
      : defaultEndDate;

  const startDate =
    range.startDate && /^\\d{4}-\\d{2}-\\d{2}$/.test(range.startDate)
      ? range.startDate
      : addDaysToDateOnly(endDate, -30);

  const hierarchy = await getMetaAdHierarchy();`,
  "buildAdDiagnosisGroups"
);

/* 기존 내부 30일 제거 */
d = mustReplace(
  d,
`  const today = toKstDateOnly(new Date().toISOString());
  const start = addDaysToDateOnly(today, -30);
  const formCompleteTrackingConnected = await checkFormCompleteTrackingConnected(start, today);`,
`  const formCompleteTrackingConnected =
    await checkFormCompleteTrackingConnected(
      startDate,
      endDate
    );`,
  "진단 내부 기간"
);

/* buildAdInput 호출에 날짜 전달 */
d = mustReplace(
  d,
`        },
        formCompleteTrackingConnected
      )`,
`        },
        formCompleteTrackingConnected,
        startDate,
        endDate
      )`,
  "buildAdInput 호출"
);

fs.writeFileSync(diagnosisPath, d, "utf8");

//
// 2. 종합 summary에서 같은 기간을 광고진단에도 전달
//
const summaryPath =
  "./lib/ad-performance-summary/build.ts";

let s = fs.readFileSync(summaryPath, "utf8");

s = mustReplace(
  s,
`    buildAdDiagnosisGroups(),`,
`    buildAdDiagnosisGroups(30, {
      startDate: windowStart,
      endDate: today,
    }),`,
  "buildAdDiagnosisGroups 호출"
);

fs.writeFileSync(summaryPath, s, "utf8");

console.log("✅ 광고 진단 선택기간 연동 완료");
