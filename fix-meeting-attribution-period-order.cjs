const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

const oldBlock = `        const rawDate = pick(row, DATE_HEADERS);
        const appliedAtIso = parseMeetingLeadDateTime(rawDate);

        if (leadTimeSamples.length < 5) {
          leadTimeSamples.push({
            sheet: sheetName,
            rawDate,
            parsedDate: appliedAtIso,
          });
        }

        let attribution =
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
        }

        const date = dateOnly(rawDate);

        if (!date || date < start || date > end) {
          continue;
        }`;

const newBlock = `        const rawDate = pick(row, DATE_HEADERS);
        const date = dateOnly(rawDate);

        // ★ 선택한 회의 기간의 DB만 attribution을 사용한다.
        // 기간 밖 DB가 UTM 기록을 먼저 소모하지 않도록 반드시 매칭보다 먼저 검사.
        if (!date || date < start || date > end) {
          continue;
        }

        const appliedAtIso = parseMeetingLeadDateTime(rawDate);

        if (leadTimeSamples.length < 5) {
          leadTimeSamples.push({
            sheet: sheetName,
            rawDate,
            parsedDate: appliedAtIso,
          });
        }

        const rowLanding =
          classifyLanding(sheetName, row);

        let attribution =
          attributionMap?.get(
            attributionMatchKey(sheetName, sourceRowNumber)
          ) ??
          (appliedAtIso
            ? attributionMap?.get(
                attributionSubmittedAtKey(appliedAtIso)
              )
            : null) ??
          null;

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
  throw new Error(
    "기존 날짜/attribution 블록을 찾지 못했습니다."
  );
}

s = s.replace(oldBlock, newBlock);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 기간 필터를 attribution 매칭보다 앞으로 이동 완료");
