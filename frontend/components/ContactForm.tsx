"use client";
import { useState } from "react";
import { Check } from "@/components/Icons";
import { API } from "@/lib/api";
import { apiError } from "@/lib/format";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${API}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json().catch(() => null);
      if (r.ok) setDone(true); else setErr(apiError(d, "ارسال پیام ناموفق بود"));
    } catch { setErr("ارتباط با سرور برقرار نشد. چند ثانیه بعد دوباره تلاش کنید."); } finally { setBusy(false); }
  }

  if (done)
    return (
      <div className="success">
        <span className="success-icon"><Check size={26} /></span>
        <h2>پیام شما ارسال شد</h2>
        <p className="muted">پاسخ را از طریق ایمیلی که وارد کردید دریافت می‌کنید.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="sheet" noValidate={false}>
      <label htmlFor="c-name">نام</label>
      <input id="c-name" required minLength={2} maxLength={120} value={f.name} onChange={set("name")} autoComplete="name" />
      <label htmlFor="c-email">ایمیل</label>
      <input id="c-email" type="email" dir="ltr" required value={f.email} onChange={set("email")} autoComplete="email" />
      <label htmlFor="c-subject">موضوع (اختیاری)</label>
      <input id="c-subject" maxLength={160} value={f.subject} onChange={set("subject")} />
      <label htmlFor="c-message">پیام</label>
      <textarea id="c-message" rows={6} required minLength={10} maxLength={3000} value={f.message} onChange={set("message")} placeholder="سؤال یا توضیح خود را بنویسید؛ اگر درباره‌ی سفارش است، کد پیگیری را هم بنویسید." />
      {/* honeypot: hidden from people, bots fill it */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label htmlFor="c-site">وب‌سایت</label>
        <input id="c-site" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} />
      </div>
      {err && <div className="err" role="alert">{err}</div>}
      <button disabled={busy}>{busy ? "در حال ارسال…" : "ارسال پیام"}</button>
    </form>
  );
}
