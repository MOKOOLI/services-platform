"use client";
import { useCallback, useEffect, useState } from "react";
import Files from "@/components/Files";
import { API } from "@/lib/api";
import { apiError, money } from "@/lib/format";

type Tracked = {
  tracking_code: string; status: string; product_name: string;
  price_amount: number | null; price_currency: string;
  payment_status: "none" | "unpaid" | "paid"; payment_enabled: boolean;
};

const LABELS: Record<string, string> = {
  new: "ثبت شده", in_review: "در حال بررسی", in_progress: "در حال انجام", delivered: "تحویل شده", cancelled: "لغو شده",
};

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
      if (r.ok) setRes(await r.json()); else setErr("سفارشی با این کد پیدا نشد");
    } catch { setErr("ارتباط با سرور برقرار نشد"); }
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

  return (
    <>
      <h1>پیگیری سفارش</h1>
      <form onSubmit={(e) => { e.preventDefault(); lookup(code); }}>
        <label>کد پیگیری</label>
        <input dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button>جستجو</button>
      </form>

      {paid === "1" && <div className="ok">پرداخت با موفقیت انجام شد.</div>}
      {paid === "0" && <div className="err">پرداخت انجام نشد یا لغو شد. می‌توانید دوباره تلاش کنید.</div>}
      {err && <div className="err">{err}</div>}

      {res && (
        <div className="ok">
          {res.product_name} — وضعیت: <strong>{LABELS[res.status] ?? res.status}</strong>

          {res.payment_status !== "none" && (
            <p>
              هزینه: <strong>{money(res.price_amount, res.price_currency)}</strong>
              {res.payment_status === "paid"
                ? <span className="badge ok">پرداخت شده</span>
                : <span className="badge warn">پرداخت‌نشده</span>}
            </p>
          )}
          {res.payment_status === "unpaid" && res.payment_enabled && (
            <button onClick={pay} disabled={busy} style={{ marginTop: 0 }}>{busy ? "در حال انتقال به درگاه…" : "پرداخت آنلاین"}</button>
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
        </div>
      )}
    </>
  );
}
