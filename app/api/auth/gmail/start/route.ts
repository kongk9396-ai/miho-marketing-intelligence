import { NextResponse } from "next/server";
import { getGmailAuthUrl } from "@/lib/mail/gmail-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = getGmailAuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail 연결을 시작할 수 없습니다.";
    return NextResponse.redirect(
      new URL(`/data/meta-sync?gmailError=${encodeURIComponent(message)}`, request.url)
    );
  }
}
