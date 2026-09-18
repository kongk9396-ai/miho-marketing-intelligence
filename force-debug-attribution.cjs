const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("let attributionMatchedRows = 0;")) {
  s = s.replace(
    "    let scannedRows = 0;",
    `    let scannedRows = 0;
    let attributionMatchedRows = 0;`
  );
}

if (!s.includes("attributionMatchedRows += 1;")) {
  s = s.replace(
`        const attribution =
          attributionMap?.get(
            attributionMatchKey(sheetName, sourceRowNumber)
          ) ?? null;`,
`        const attribution =
          attributionMap?.get(
            attributionMatchKey(sheetName, sourceRowNumber)
          ) ?? null;

        if (attribution) {
          attributionMatchedRows += 1;
        }`
  );
}

if (!s.includes("attributionDebug:")) {
  s = s.replace(
`      scannedRows,

      landings: [`,
`      scannedRows,

      attributionDebug: {
        available: attributionMap !== null,
        entries: attributionMap?.size ?? 0,
        matchedRows: attributionMatchedRows,
      },

      landings: [`
  );
}

fs.writeFileSync(path, s, "utf8");

console.log("✅ attributionDebug 삽입 완료");
