const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

/* attribution import */
const importMarker =
`import {
  fetchSheetRecords,
  listSheetTabNames,
} from "@/lib/leads-sync/sheets-client";`;

if (!s.includes(importMarker)) {
  throw new Error("sheets-client import 위치를 찾지 못했습니다.");
}

s = s.replace(
  importMarker,
`import {
  fetchSheetRecords,
  listSheetTabNames,
} from "@/lib/leads-sync/sheets-client";

import {
  attributionMatchKey,
  fetchAttributionMatchMap,
} from "@/lib/leads-sync/attribution-repository";`
);

/* attribution map 로딩 */
const tryMarker =
`  try {
    const sheetNames = await listSheetTabNames();`;

if (!s.includes(tryMarker)) {
  throw new Error("API try 위치를 찾지 못했습니다.");
}

s = s.replace(
  tryMarker,
`  try {
    const sheetNames = await listSheetTabNames();

    // DBcart에서 저장한 UTM / 랜딩 / 광고소재 정보를 불러온다.
    // 상담 시트의 실제 행과 source_sheet + source_row로 연결한다.
    const attributionMap =
      await fetchAttributionMatchMap(
        process.env.LEADS_ATTRIBUTION_SHEET_NAME || "marketing_attribution",
        fetchSheetRecords
      );`
);

/* for-of를 index 기반으로 변경 */
const loopMarker =
`      for (const row of records) {
        scannedRows += 1;`;

if (!s.includes(loopMarker)) {
  throw new Error("records loop 위치를 찾지 못했습니다.");
}

s = s.replace(
  loopMarker,
`      for (let rowIndex = 0; rowIndex < records.length; rowIndex += 1) {
        const row = records[rowIndex];
        const sourceRowNumber = rowIndex + 2;

        scannedRows += 1;

        const attribution =
          attributionMap?.get(
            attributionMatchKey(sheetName, sourceRowNumber)
          ) ?? null;`
);

/* 광고명 결정 부분 교체 */
const adMarker =
`        const ad =
          pick(row, AD_HEADERS) ||
          "(광고소재 미확인)";`;

if (!s.includes(adMarker)) {
  throw new Error("광고소재 결정 위치를 찾지 못했습니다.");
}

s = s.replace(
  adMarker,
`        const ad =
          pick(row, AD_HEADERS) ||
          attribution?.utmContent ||
          "(광고소재 미확인)";`
);

/* 랜딩 분류에도 attribution 활용 */
const landingMarker =
`        const landing = classifyLanding(sheetName, row);

        if (!landing) {`;

if (!s.includes(landingMarker)) {
  throw new Error("landing 분류 위치를 찾지 못했습니다.");
}

s = s.replace(
  landingMarker,
`        let landing = classifyLanding(sheetName, row);

        // 상담 시트 자체에 랜딩명이 없으면 DBcart attribution 값으로 보완
        if (!landing && attribution) {
          const attributionText = [
            attribution.landingName,
            attribution.utmCampaign,
            attribution.utmContent,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (
            attributionText.includes("눈밑") ||
            attributionText.includes("under_eye") ||
            attributionText.includes("undereye")
          ) {
            landing = "under_eye";
          } else if (
            attributionText.includes("코첫") ||
            attributionText.includes("첫코") ||
            attributionText.includes("firstnose") ||
            attributionText.includes("first_nose")
          ) {
            landing = "first_nose";
          }
        }

        if (!landing) {`
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 실제 DB + DBcart attribution 광고소재 연결 완료");
