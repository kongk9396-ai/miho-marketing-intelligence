const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

// scannedRows 근처에 matched counter 추가
s = s.replace(
`    let scannedRows = 0;`,
`    let scannedRows = 0;
    let attributionMatchedRows = 0;`
);

// attribution 매칭 직후 카운트
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

// 응답에 디버그 정보 추가
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

fs.writeFileSync(path, s, "utf8");

console.log("✅ attribution 진단 정보 추가 완료");
