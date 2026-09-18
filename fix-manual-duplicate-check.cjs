const fs = require("fs");

const path = "./lib/meta/process-report-file.ts";
let s = fs.readFileSync(path, "utf8");

const oldBlock = `  const existingByHash = await findSuccessfulImportByFileHash(fileHash);
  if (existingByHash) {
    return recordImportHistory({
      source_type: sourceType,
      message_id: messageId ?? null,
      attachment_id: attachmentId ?? null,
      file_name: fileName,
      file_hash: fileHash,
      row_count: 0,
      inserted_count: 0,
      updated_count: 0,
      skipped_count: 0,
      status: "duplicate",
      error_message: "?대? 泥섎━???뚯씪?낅땲??",
    });
  }`;

if (!s.includes(oldBlock)) {
  throw new Error("중복 검사 블록을 찾지 못했습니다.");
}

const newBlock = `  if (sourceType === "gmail") {
    const existingByHash = await findSuccessfulImportByFileHash(fileHash);

    if (existingByHash) {
      return recordImportHistory({
        source_type: sourceType,
        message_id: messageId ?? null,
        attachment_id: attachmentId ?? null,
        file_name: fileName,
        file_hash: fileHash,
        row_count: 0,
        inserted_count: 0,
        updated_count: 0,
        skipped_count: 0,
        status: "duplicate",
        error_message: "이미 처리한 파일입니다.",
      });
    }
  }`;

s = s.replace(oldBlock, newBlock);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 수동 업로드 중복 차단 해제 완료");
