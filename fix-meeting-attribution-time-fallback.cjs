const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

/* 1. attributionSubmittedAtKey import 추가 */
s = s.replace(
`import {
  attributionMatchKey,
  fetchAttributionMatchMap,
} from "@/lib/leads-sync/attribution-repository";`,
`import {
  attributionMatchKey,
  attributionSubmittedAtKey,
  fetchAttributionMatchMap,
} from "@/lib/leads-sync/attribution-repository";`
);

/* 2. parseSheetDateTime import가 없으면 추가 */
if (!s.includes('parseSheetDateTime')) {
  const importMarker =
`import { NextRequest, NextResponse } from "next/server";`;

  s = s.replace(
    importMarker,
`${importMarker}
import { parseSheetDateTime } from "@/lib/leads-sync/parse-date";`
  );
}

/* 3. attribution 매칭 로직을 row + timestamp fallback으로 교체 */
const oldBlock =
`        const attribution =
          attributionMap?.get(
            attributionMatchKey(sheetName, sourceRowNumber)
          ) ?? null;

        if (attribution) {
          attributionMatchedRows += 1;
        }

        const rawDate = pick(row, DATE_HEADERS);`;

const newBlock =
`        const rawDate = pick(row, DATE_HEADERS);
        const appliedAtIso = parseSheetDateTime(rawDate);

        const attribution =
          attributionMap?.get(
            attributionMatchKey(sheetName, sourceRowNumber)
          ) ??
          (appliedAtIso
            ? attributionMap?.get(
                attributionSubmittedAtKey(appliedAtIso)
              )
            : null) ??
          null;

        if (attribution) {
          attributionMatchedRows += 1;
        }`;

if (!s.includes(oldBlock)) {
  throw new Error("attribution 매칭 블록을 찾지 못했습니다.");
}

s = s.replace(oldBlock, newBlock);

fs.writeFileSync(path, s, "utf8");

console.log("✅ attribution 시간 fallback 매칭 적용 완료");
