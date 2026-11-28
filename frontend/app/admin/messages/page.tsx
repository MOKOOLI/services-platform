"use client";
import { useCallback, useEffect, useState } from "react";
import { apiError } from "@/lib/format";

type Msg = { id: number; name: string; email: string; subject: string; message: string; handled: boolean; created_at: string };

export default function Messages() {
  const [list, setList] = useState<Msg[]>([]);
  const [err, setErr] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/messages", { cache: "no-store" });
    if (r.status === 401 || r.status === 403) { window.location.reload(); return; }
    if (r.ok) setList(await r.json()); else setErr("خطا در دریافت پیام‌ها");
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(m: Msg) {
    const r = await fetch(`/api/admin/messages/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handled: !m.handled }) });
    if (r.ok) load(); else setErr(apiError(await r.json().catch(() => null), "ثبت ناموفق بود"));
  }

  const shown = onlyNew ? list.filter((m) => !m.handled) : list;
  return (
    <>
      <h1>پیام‌ها</h1>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 400 }}>
        <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} /> فقط بررسی‌نشده‌ها ({list.filter((m) => !m.handled).length})
      </label>
      {err && <div className="err">{err}</div>}
      {shown.length === 0 && <p className="muted">پیامی وجود ندارد.</p>}
      {shown.map((m) => (
        <div key={m.id} className="card" style={{ marginTop: 14, opacity: m.handled ? 0.65 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <strong>{m.subject || "بدون موضوع"}</strong>
              {!m.handled && <span className="badge warn">جدید</span>}
              <div className="muted">{m.name} — <a href={`mailto:${m.email}`} dir="ltr">{m.email}</a></div>
              <div className="muted small">{new Date(m.created_at).toLocaleString("fa-IR")}</div>
            </div>
            <button className="small secondary" onClick={() => toggle(m)}>{m.handled ? "علامت‌گذاری به‌عنوان جدید" : "بررسی شد"}</button>
          </div>
          <p style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{m.message}</p>
        </div>
      ))}
    </>
  );
}
