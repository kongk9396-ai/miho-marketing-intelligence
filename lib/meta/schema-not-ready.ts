export class SchemaNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaNotReadyError";
  }
}

function isMissingTableMessage(message: string): boolean {
  return message.includes("schema cache") || message.includes("does not exist");
}

/**
 * Maps a Supabase/PostgREST error into a SchemaNotReadyError when the cause
 * is a missing table/column (some migration not yet run), otherwise a plain
 * Error. Deliberately doesn't name a specific migration file — this helper
 * is shared across every domain (Meta, creative changes, GA4, UTM mapping),
 * each depending on a different migration, so "run the migrations in order"
 * is the only instruction that's always correct.
 */
export function throwSupabaseError(action: string, error: { message: string }): never {
  if (isMissingTableMessage(error.message)) {
    throw new SchemaNotReadyError(
      `${action} 실패: 필요한 테이블이 아직 생성되지 않았습니다. supabase/migrations 폴더의 SQL 파일을 번호 순서대로 Supabase SQL Editor에서 실행해주세요.`
    );
  }
  throw new Error(`${action} 실패: ${error.message}`);
}
