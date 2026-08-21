export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "miho-marketing-intelligence",
    timestamp: new Date().toISOString(),
  });
}
