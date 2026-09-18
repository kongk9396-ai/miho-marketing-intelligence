const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

/* parseAttributionRecords import 추가 */
s = s.replace(
`import {
  attributionMatchKey,
  attributionSubmittedAtKey,
  fetchAttributionMatchMap,
} from "@/lib/leads-sync/attribution-repository";`,
`import {
  attributionMatchKey,
  attributionSubmittedAtKey,
  fetchAttributionMatchMap,
  parseAttributionRecords,
} from "@/lib/leads-sync/attribution-repository";`
);

/* attribution 원본도 같이 읽기 */
const marker =
`    const attributionMap =
      await fetchAttributionMatchMap(
        process.env.LEADS_ATTRIBUTION_SHEET_NAME || "marketing_attribution",
        fetchSheetRecords
      );`;

if (!s.includes(marker)) {
  throw new Error("attributionMap 위치를 찾지 못했습니다.");
}

s = s.replace(
  marker,
`${marker}

    const attributionSheetName =
      process.env.LEADS_ATTRIBUTION_SHEET_NAME ||
      "marketing_attribution_(건드리기x)";

    let attributionRecords = [];

    try {
      const rawAttributionRecords =
        await fetchSheetRecords(attributionSheetName);

      attributionRecords =
        parseAttributionRecords(rawAttributionRecords);
    } catch {
      attributionRecords = [];
    }

    const usedAttributionIndexes = new Set<number>();

    function resolveLandingFromAttribution(record: any) {
      const text = [
        record?.landingName,
        record?.utmCampaign,
        record?.utmContent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (
        text.includes("눈밑") ||
        text.includes("눈") ||
        text.includes("under_eye") ||
        text.includes("undereye")
      ) {
        return "under_eye";
      }

      if (
        text.includes("코첫") ||
        text.includes("첫코") ||
        text.includes("firstnose") ||
        text.includes("first_nose")
      ) {
        return "first_nose";
      }

      return null;
    }

    function findNearestAttribution(
      appliedAtIso: string | null,
      landingKey: "first_nose" | "under_eye" | null
    ) {
      if (!appliedAtIso) return null;

      const appliedMs = new Date(appliedAtIso).getTime();

      if (!Number.isFinite(appliedMs)) {
        return null;
      }

      let bestIndex = -1;
      let bestDiff = Infinity;

      attributionRecords.forEach((record: any, index: number) => {
        if (usedAttributionIndexes.has(index)) {
          return;
        }

        if (!record?.submittedAt) {
          return;
        }

        const attributionLanding =
          resolveLandingFromAttribution(record);

        if (
          landingKey &&
          attributionLanding &&
          attributionLanding !== landingKey
        ) {
          return;
        }

        const submittedMs =
          new Date(record.submittedAt).getTime();

        if (!Number.isFinite(submittedMs)) {
          return;
        }

        const diff =
          Math.abs(submittedMs - appliedMs);

        // DBcart 저장과 attribution 기록 사이 최대 10분만 허용
        if (diff <= 10 * 60 * 1000 && diff < bestDiff) {
          bestDiff = diff;
          bestIndex = index;
        }
      });

      if (bestIndex === -1) {
        return null;
      }

      usedAttributionIndexes.add(bestIndex);

      return attributionRecords[bestIndex];
    }`
);

/* 기존 attribution 매칭 블록 교체 */
const oldBlock =
`        const attribution =
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

const newBlock =
`        let attribution =
          attributionMap?.get(
            attributionMatchKey(sheetName, sourceRowNumber)
          ) ??
          (appliedAtIso
            ? attributionMap?.get(
                attributionSubmittedAtKey(appliedAtIso)
              )
            : null) ??
          null;

        const rowLanding =
          classifyLanding(sheetName, row);

        if (!attribution) {
          attribution =
            findNearestAttribution(
              appliedAtIso,
              rowLanding
            );
        }

        if (attribution) {
          attributionMatchedRows += 1;
        }`;

if (!s.includes(oldBlock)) {
  throw new Error("기존 attribution 매칭 블록을 찾지 못했습니다.");
}

s = s.replace(oldBlock, newBlock);

fs.writeFileSync(path, s, "utf8");

console.log("✅ attribution 시간 근접 매칭 추가 완료");
