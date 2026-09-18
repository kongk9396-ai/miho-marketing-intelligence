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
  throw new Error("기존 file hash 중복 검사 블록을 찾지 못했습니다.");
}

const newBlock = `  // Gmail 자동 수집은 같은 파일을 반복 처리하지 않는다.
  // 수동 업로드는 파서/매핑 수정 후 같은 파일을 다시 테스트할 수 있어야 하므로
  // 동일한 file hash라도 항상 다시 처리한다.
  if (sourceType !== "manual") {
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

console.log("✅ 수동 Meta 업로드 재처리 허용 완료");
