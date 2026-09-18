const fs = require("fs");
const path = require("path");

const root = process.cwd();
const pagePath = path.join(root, "app", "report", "meta-weekly-share", "page.tsx");

if (!fs.existsSync(pagePath)) {
  console.error("❌ page.tsx를 찾지 못했습니다:", pagePath);
  process.exit(1);
}

const backupPath =
  pagePath + ".before-safe-landing-db-connect-" +
  new Date().toISOString().replace(/[:.]/g, "-") + ".bak";

fs.copyFileSync(pagePath, backupPath);

let buf = fs.readFileSync(pagePath);

const importLine =
  'import { LandingDbSummary } from "@/components/report/landing-db-summary";';

function hasAscii(buffer, text) {
  return buffer.indexOf(Buffer.from(text, "ascii")) !== -1;
}

if (!hasAscii(buf, importLine)) {
  const asciiView = buf.toString("latin1");
  const importRegex = /import [^\r\n]+;[\r]?\n/g;
  let last = null;
  let m;

  while ((m = importRegex.exec(asciiView)) !== null) {
    last = { index: m.index, length: m[0].length };
  }

  if (!last) {
    console.error("❌ import 위치를 찾지 못했습니다.");
    process.exit(1);
  }

  const pos = last.index + last.length;
  const insert = Buffer.from(importLine + "\r\n", "ascii");
  buf = Buffer.concat([buf.subarray(0, pos), insert, buf.subarray(pos)]);
}

if (!hasAscii(buf, "<LandingDbSummary />")) {
  const sectionNeedle = Buffer.from("<section", "ascii");
  const sectionIndex = buf.indexOf(sectionNeedle);

  if (sectionIndex === -1) {
    console.error("❌ <section> 위치를 찾지 못했습니다.");
    process.exit(1);
  }

  let lineStart = sectionIndex;
  while (lineStart > 0 && buf[lineStart - 1] !== 0x0A) lineStart--;

  const indent = buf.subarray(lineStart, sectionIndex);
  const newline = "\r\n";

  const insert = Buffer.concat([
    indent,
    Buffer.from("<LandingDbSummary />" + newline + newline, "ascii"),
  ]);

  buf = Buffer.concat([
    buf.subarray(0, lineStart),
    insert,
    buf.subarray(lineStart),
  ]);
}

fs.writeFileSync(pagePath, buf);

console.log("✅ meta-weekly-share에 DB 카드 연결 완료");
console.log("✅ 기존 한글 바이트/인코딩은 그대로 보존했습니다.");
console.log("🛟 백업:", backupPath);
console.log("다음 명령: npm.cmd run build");
