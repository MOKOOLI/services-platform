import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { key } = (await req.json().catch(() => ({}))) as { key?: string };
  if (!key) return NextResponse.json({ detail: "کلید لازم است" }, { status: 400 });
  try {
    const r = await fetch(`${API}/api/admin/orders?status=__ping__`, { headers: { "X-Admin-Key": key }, cache: "no-store" });
    if (!r.ok) return NextResponse.json({ detail: "کلید نادرست است" }, { status: 401 });
  } catch {
    return NextResponse.json({ detail: "ارتباط با سرور برقرار نشد" }, { status: 502 });
  }
  // Secure only when the request really arrived over https (Vercel sets x-forwarded-proto);
  // otherwise http://localhost (docker-compose) would silently drop the cookie in Safari.
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  cookies().set("admin_key", key, {
    httpOnly: true,
    sameSite: "strict",
    secure: proto === "https",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  cookies().delete("admin_key");
  return NextResponse.json({ ok: true });
}
