import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Server-side proxy: the admin key lives in an httpOnly cookie and is never exposed to browser JS.
const API = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const key = cookies().get("admin_key")?.value;
  if (!key) return NextResponse.json({ detail: "unauthorized" }, { status: 401 });

  const url = `${API}/api/admin/${params.path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
  try {
    const r = await fetch(url, {
      method: req.method,
      headers: { "Content-Type": "application/json", "X-Admin-Key": key },
      body,
      cache: "no-store",
    });
    if (r.status === 204) return new NextResponse(null, { status: 204 });
    return new NextResponse(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "backend unreachable" }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
