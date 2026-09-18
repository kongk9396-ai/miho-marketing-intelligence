const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

const marker =
`function dateOnly(value: string): string | null {`;

if (!s.includes(marker)) {
  throw new Error("dateOnly 함수 위치를 찾지 못했습니다.");
}

if (!s.includes("function parseMeetingLeadDateTime")) {
  s = s.replace(
marker,
`function parseMeetingLeadDateTime(value: string): string | null {
  const text = String(value ?? "").trim();

  if (!text) return null;

  // 예: 2026.08.12/20:55
  //     2026.08.12 20:55
  //     2026-08-12 20:55
  const match = text.match(
    /^(\\d{4})[.\\/-](\\d{1,2})[.\\/-](\\d{1,2})(?:[\\/\\sT]+(\\d{1,2}):(\\d{2})(?::(\\d{2}))?)?/
  );

  if (!match) {
    return parseSheetDateTime(text);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const second = Number(match[6] ?? 0);

  // 입력값은 한국시간(KST, UTC+9)
  const utcMs = Date.UTC(
    year,
    month - 1,
    day,
    hour - 9,
    minute,
    second
  );

  return new Date(utcMs).toISOString();
}

${marker}`
  );
}

s = s.replaceAll(
  `const appliedAtIso = parseSheetDateTime(rawDate);`,
  `const appliedAtIso = parseMeetingLeadDateTime(rawDate);`
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 회의 DB 신청시간 KST 시:분 보존 완료");
