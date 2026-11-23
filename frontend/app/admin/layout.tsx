"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const path = usePathname();

  async function probe() {
    const r = await fetch("/api/admin/orders?status=__ping__", { cache: "no-store" });
    setAuthed(r.ok);
  }
  useEffect(() => { probe(); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    if (r.ok) { setKey(""); probe(); } else setMsg((await r.json().catch(() => ({}))).detail ?? "ورود ناموفق");
  }

  async function logout() {
    await fetch("/api/admin-login", { method: "DELETE" });
    setAuthed(false);
  }

  if (authed === null) return <p className="muted">در حال بارگذاری…</p>;

  if (!authed)
    return (
      <>
        <h1>ورود مدیر</h1>
        <form onSubmit={login}>
          <label>کلید ادمین</label>
          <input type="password" dir="ltr" value={key} onChange={(e) => setKey(e.target.value)} required autoComplete="current-password" />
          <button>ورود</button>
        </form>
        {msg && <div className="err">{msg}</div>}
      </>
    );

  return (
    <>
      <div className="tabs">
        <Link href="/admin" style={{ fontWeight: path === "/admin" ? 700 : 400 }}>سفارش‌ها</Link>
        <Link href="/admin/products" style={{ fontWeight: path.startsWith("/admin/products") ? 700 : 400 }}>محصولات</Link>
        <a className="spacer" href="#" onClick={(e) => { e.preventDefault(); logout(); }}>خروج</a>
      </div>
      {children}
    </>
  );
}
