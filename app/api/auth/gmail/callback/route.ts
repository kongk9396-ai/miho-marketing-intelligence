import { NextResponse } from "next/server";
import { exchangeGmailAuthCode } from "@/lib/mail/gmail-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/data/meta-sync?gmailError=${encodeURIComponent(oauthError)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `/data/meta-sync?gmailError=${encodeURIComponent("인증 코드가 없습니다.")}`,
        request.url
      )
    );
  }

  try {
    await exchangeGmailAuthCode(code);
    return NextResponse.redirect(new URL("/data/meta-sync?gmailConnected=1", request.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail 연결에 실패했습니다.";
    return NextResponse.redirect(
      new URL(`/data/meta-sync?gmailError=${encodeURIComponent(message)}`, request.url)
    );
  }
}
