const fs = require("fs");
const path = require("path");

const root = process.cwd();
const pagePath = path.join(root, "app", "report", "meta-weekly-share", "page.tsx");

if (!fs.existsSync(pagePath)) {
  console.error("❌ page.tsx를 찾지 못했습니다:", pagePath);
  process.exit(1);
}

const backupPath =
  pagePath + ".before-safe-landing-db-connect-v2-" +
  new Date().toISOString().replace(/[:.]/g, "-") + ".bak";

fs.copyFileSync(pagePath, backupPath);

let buf = fs.readFileSync(pagePath);

const importLine =
  'import { LandingDbSummary } from "@/components/report/landing-db-summary";';
const callLine = "<LandingDbSummary />";

function hasAscii(buffer, text) {
  return buffer.indexOf(Buffer.from(text, "ascii")) !== -1;
}

function detectNewline(buffer) {
  const s = buffer.subarray(0, Math.min(buffer.length, 5000)).toString("latin1");
  return s.includes("\r\n") ? "\r\n" : "\n";
}

const nl = detectNewline(buf);

if (!hasAscii(buf, importLine)) {
  const view = buf.toString("latin1");

  // 1) 마지막 import 뒤
  const importRegex = /^import[ \t][^\r\n]*;[ \t]*(?:\r?\n|$)/gm;
  let last = null;
  let m;

  while ((m = importRegex.exec(view)) !== null) {
    last = { index: m.index, length: m[0].length };
  }

  let insertPos = 0;

  if (last) {
    insertPos = last.index + last.length;
  } else {
    // 2) "use client" / 'use client' / "use server" 같은 directive 다음
    const directiveRegex = /^(?:"use (?:client|server)"|'use (?:client|server)');?[ \t]*(?:\r?\n|$)/m;
    const d = directiveRegex.exec(view);
    if (d && d.index === 0) {
      insertPos = d.index + d[0].length;
    } else {
      // 3) import도 directive도 없으면 파일 맨 앞
      insertPos = 0;
    }
  }

  const insert = Buffer.from(importLine + nl, "ascii");
  buf = Buffer.concat([
    buf.subarray(0, insertPos),
    insert,
    buf.subarray(insertPos),
  ]);
}

if (!hasAscii(buf, callLine)) {
  const sectionNeedle = Buffer.from("<section", "ascii");
  const sectionIndex = buf.indexOf(sectionNeedle);

  if (sectionIndex === -1) {
    console.error("❌ <section> 위치를 찾지 못했습니다.");
    console.error("🛟 원본 백업:", backupPath);
    process.exit(1);
  }

  let lineStart = sectionIndex;
  while (lineStart > 0 && buf[lineStart - 1] !== 0x0A) lineStart--;

  const indent = buf.subarray(lineStart, sectionIndex);

  const insert = Buffer.concat([
    indent,
    Buffer.from(callLine + nl + nl, "ascii"),
  ]);

  buf = Buffer.concat([
    buf.subarray(0, lineStart),
    insert,
    buf.subarray(lineStart),
  ]);
}

fs.writeFileSync(pagePath, buf);

console.log("✅ meta-weekly-share DB 카드 연결 완료 (v2)");
console.log("✅ import가 없어도 안전하게 처리했습니다.");
console.log("✅ 기존 한글 바이트/인코딩은 변경하지 않았습니다.");
console.log("🛟 백업:", backupPath);
console.log("");
console.log("다음:");
console.log("npm.cmd run build");
