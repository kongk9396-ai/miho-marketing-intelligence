const fs = require("fs");

const path = "./lib/meta/parser.ts";
let s = fs.readFileSync(path, "utf8");

//
// 1) headerMap 뒤에 기간 합산 보고서 검사 추가
//
const marker = `  const headerMap = resolveHeaderMap(Object.keys(records[0]));
  const missingRequired = REQUIRED_FIELDS.filter((field) => !headerMap[field]);`;

if (!s.includes("Meta 기간 합산 보고서 감지")) {
  if (!s.includes(marker)) {
    throw new Error("headerMap 위치를 찾지 못했습니다.");
  }

  s = s.replace(
    marker,
`  const headerMap = resolveHeaderMap(Object.keys(records[0]));

  // Meta 기간 합산 보고서 감지
  //
  // 예:
  // 보고 시작 = 2026-08-24
  // 보고 종료 = 2026-08-31
  //
  // 이런 파일은 8일 전체 실적을 하나의 행으로 합산한 보고서일 수 있다.
  // 이를 meta_daily에 8/24 하루치로 저장하면 광고비가 잘못 집계된다.
  const reportingStartHeader = headerMap["reporting_start"];
  const reportingEndHeader = headerMap["reporting_end"];

  if (reportingStartHeader && reportingEndHeader) {
    const rangePairs = new Set(
      records
        .map((record) => {
          const start = String(record[reportingStartHeader] ?? "").trim();
          const end = String(record[reportingEndHeader] ?? "").trim();
          return start && end ? \`\${start}|\${end}\` : "";
        })
        .filter(Boolean)
    );

    const hasMultiDayAggregate = [...rangePairs].some((pair) => {
      const [start, end] = pair.split("|");
      return start && end && start !== end;
    });

    if (hasMultiDayAggregate) {
      return {
        rows: [],
        rowErrors: [],
        fatalError:
          "기간 합산 Meta 보고서입니다. 여러 날짜의 광고비를 하루 데이터로 저장하면 집계가 왜곡되므로 저장하지 않았습니다. Meta 보고서를 일별(Day) 기준으로 내보내면 자동으로 정상 저장됩니다.",
      };
    }
  }

  const missingRequired = REQUIRED_FIELDS.filter((field) => !headerMap[field]);`
  );
}

//
// 2) 이름 없는 전체 합계행은 무조건 제외
//
const ifStart = `    if (!campaignName && !adName) {`;
const startIndex = s.indexOf(ifStart);

if (startIndex !== -1) {
  let depth = 0;
  let endIndex = -1;

  for (let i = startIndex; i < s.length; i++) {
    if (s[i] === "{") depth++;
    if (s[i] === "}") {
      depth--;
      if (depth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  if (endIndex !== -1) {
    s =
      s.slice(0, startIndex) +
`    // 광고명/캠페인명이 모두 없는 행은 Meta의 전체 합계행이다.
    // 개별 광고 행의 합과 중복되므로 meta_daily에는 저장하지 않는다.
    if (!campaignName && !adName) {
      return;
    }` +
      s.slice(endIndex);
  }
}

fs.writeFileSync(path, s, "utf8");

console.log("✅ Meta 합계행 제거 + 기간 합산 오저장 방지 완료");
