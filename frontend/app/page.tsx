"use client";
import { useCallback, useEffect, useState } from "react";
import Files from "@/components/Files";
import { API } from "@/lib/api";
import { Check } from "@/components/Icons";
import { apiError, fa, money } from "@/lib/format";

type Tracked = {
  tracking_code: string; status: string; product_name: string;
  price_amount: number | null; price_currency: string;
  payment_status: "none" | "unpaid" | "paid"; payment_enabled: boolean;
};

const LABELS: Record<string, string> = {
  new: "ثبت شده", in_review: "در حال بررسی", in_progress: "در حال انجام", delivered: "تحویل شده", cancelled: "لغو شده",
};
const FLOW = ["new", "in_review", "in_progress", "delivered"];

export default function Track() {
  const [code, setCode] = useState("");
  const [res, setRes] = useState<Tracked | null>(null);
  const [err, setErr] = useState("");
  const [paid, setPaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = useCallback(async (c: string) => {
    setErr(""); setRes(null);
    try {
      const r = await fetch(`${API}/api/orders/track/${encodeURIComponent(c.trim())}`, { cache: "no-store" });
      if (r.ok) setRes(await r.json()); else setErr("سفارشی با این کد پیدا نشد. کد را دوباره بررسی کنید.");
    } catch { setErr("ارتباط با سرور برقرار نشد. چند ثانیه بعد دوباره امتحان کنید."); }
  }, []);

  // Link from email / return from the payment gateway: /track?code=XXXX&paid=1|0
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setPaid(q.get("paid"));
    const c = q.get("code");
    if (c) { setCode(c); lookup(c); }
  }, [lookup]);

  async function pay() {
    if (!res) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${API}/api/orders/track/${encodeURIComponent(res.tracking_code)}/pay`, { method: "POST" });
      const d = await r.json().catch(() => null);
      if (!r.ok) { setErr(apiError(d, "شروع پرداخت ناموفق بود")); return; }
      window.location.href = d.redirect_url;
    } catch { setErr("ارتباط با سرور برقرار نشد"); } finally { setBusy(false); }
  }

  const filesBase = res ? `${API}/api/orders/track/${encodeURIComponent(res.tracking_code)}/files` : "";
  const idx = res ? FLOW.indexOf(res.status) : -1;

  return (
    <div style={{ maxWidth: 720, paddingTop: 28 }}>
      <h1>پیگیری سفارش</h1>
      <p className="lead muted">کد پیگیری که هنگام ثبت سفارش گرفتید را وارد کنید.</p>

      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); lookup(code); }}>
        <div>
          <label htmlFor="code">کد پیگیری</label>
          <input id="code" dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <button>نمایش وضعیت</button>
      </form>

      {paid === "1" && <div className="ok">پرداخت با موفقیت انجام شد.</div>}
      {paid === "0" && <div className="err">پرداخت انجام نشد یا لغو شد. می‌توانید دوباره تلاش کنید.</div>}
      {err && <div className="err">{err}</div>}

      {res && (
        <section className="sheet">
          <h2>{res.product_name}</h2>
          {res.status === "cancelled" ? (
            <p style={{ marginTop: 10 }}><span className="badge warn" style={{ marginInlineStart: 0 }}>لغو شده</span></p>
          ) : (
            <ol className="stepper" aria-label="مراحل سفارش">
              {FLOW.map((k, i) => {
                const state = i < idx ? "done" : i === idx ? "current" : "";
                return (
                  <li key={k} className={state} aria-current={i === idx ? "step" : undefined}>
                    <span className="node">{i < idx ? <Check size={14} /> : fa(i + 1)}</span>
                    <span className="label">{LABELS[k]}</span>
                  </li>
                );
              })}
            </ol>
          )}

          {res.payment_status !== "none" && (
            <p>
              هزینه: <strong>{money(res.price_amount, res.price_currency)}</strong>
              {res.payment_status === "paid"
                ? <span className="badge ok">پرداخت شده</span>
                : <span className="badge warn">پرداخت‌نشده</span>}
            </p>
          )}
          {res.payment_status === "unpaid" && res.payment_enabled && (
            <button onClick={pay} disabled={busy}>{busy ? "در حال انتقال به درگاه…" : "پرداخت آنلاین"}</button>
          )}
          {res.payment_status === "unpaid" && !res.payment_enabled && (
            <p className="muted">برای پرداخت با ما در تماس باشید؛ پس از تایید پرداخت، فایل‌های تحویلی باز می‌شوند.</p>
          )}

          <Files
            title="فایل‌ها"
            base={filesBase}
            downloadUrl={(id) => `${filesBase}/${id}/download`}
            kind="attachment"
            canUpload={res.status !== "delivered" && res.status !== "cancelled"}
          />
        </section>
      )}
    </div>
  );
}
