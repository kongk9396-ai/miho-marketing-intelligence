const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("const attributionSamples")) {
  s = s.replace(
`    let scannedRows = 0;
    let attributionMatchedRows = 0;`,
`    let scannedRows = 0;
    let attributionMatchedRows = 0;

    const attributionSamples = attributionRecords
      .filter((r) => r.submittedAt)
      .slice(0, 5)
      .map((r) => ({
        submittedAt: r.submittedAt,
        utmCampaign: r.utmCampaign,
        utmContent: r.utmContent,
      }));

    const leadTimeSamples: Array<{
      sheet: string;
      rawDate: string;
      parsedDate: string | null;
    }> = [];`
  );
}

if (!s.includes("leadTimeSamples.push")) {
  s = s.replace(
`        const appliedAtIso = parseSheetDateTime(rawDate);`,
`        const appliedAtIso = parseSheetDateTime(rawDate);

        if (leadTimeSamples.length < 5) {
          leadTimeSamples.push({
            sheet: sheetName,
            rawDate,
            parsedDate: appliedAtIso,
          });
        }`
  );
}

if (!s.includes("timeDebug:")) {
  s = s.replace(
`      attributionDebug: {
        available: attributionMap !== null,
        entries: attributionMap?.size ?? 0,
        matchedRows: attributionMatchedRows,
      },`,
`      attributionDebug: {
        available: attributionMap !== null,
        entries: attributionMap?.size ?? 0,
        matchedRows: attributionMatchedRows,
      },

      timeDebug: {
        attributionSamples,
        leadTimeSamples,
      },`
  );
}

fs.writeFileSync(path, s, "utf8");

console.log("✅ 시간 비교 디버그 추가 완료");
