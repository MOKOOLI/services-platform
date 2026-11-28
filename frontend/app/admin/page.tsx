"use client";
import { useCallback, useEffect, useState } from "react";
import Files from "@/components/Files";
import { apiError, money } from "@/lib/format";

type AdminOrder = {
  id: number;
  tracking_code: string;
  product_type: string;
  customer_name: string;
  customer_email: string;
  status: string;
  fields: Record<string, unknown>;
  ai_draft: string | null;
  ai_status: string | null;
  price_amount: number | null;
  price_currency: string;
  payment_status: "none" | "unpaid" | "paid";
  created_at: string;
};

const STATUSES: Record<string, string> = {
  new: "ثبت شده", in_review: "در حال بررسی", in_progress: "در حال انجام", delivered: "تحویل شده", cancelled: "لغو شده",
};
const PAY_BADGE = { none: ["بدون قیمت", ""], unpaid: ["پرداخت‌نشده", "warn"], paid: ["پرداخت شده", "ok"] } as const;

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [price, setPrice] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/orders${filter ? `?status=${filter}` : ""}`, { cache: "no-store" });
    if (r.status === 401 || r.status === 403) { window.location.reload(); return; }
    if (!r.ok) { setMsg("خطا در دریافت سفارش‌ها"); return; }
    setMsg("");
    setOrders(await r.json());
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Poll while any AI draft is running.
  const anyRunning = orders.some((o) => o.ai_status === "running");
  useEffect(() => {
    if (!anyRunning) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [anyRunning, load]);

  async function act(url: string, method: string, body: unknown, fail: string) {
    const r = await call(url, method, body);
    if (r.ok) { setMsg(""); load(); } else setMsg(apiError(r.data, fail));
  }

  return (
    <>
      <h1>مدیریت سفارش‌ها</h1>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 220 }}>
        <option value="">همه وضعیت‌ها</option>
        {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {msg && <div className="err">{msg}</div>}
      {orders.length === 0 && <p className="muted">سفارشی وجود ندارد.</p>}

      {orders.map((o) => {
        const [badgeText, badgeCls] = PAY_BADGE[o.payment_status];
        return (
          <div key={o.id} className="card" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <strong>{o.product_type}</strong>
                <span className={`badge ${badgeCls}`}>{badgeText}{o.price_amount != null && ` · ${money(o.price_amount, o.price_currency)}`}</span>
                <div className="muted">{o.customer_name} — <span dir="ltr">{o.customer_email}</span></div>
                <div className="muted"><code>{o.tracking_code}</code> · {new Date(o.created_at).toLocaleString("fa-IR")}</div>
              </div>
              <select value={o.status} onChange={(e) => act(`/api/admin/orders/${o.id}/status`, "PATCH", { status: e.target.value }, "تغییر وضعیت ناموفق بود")} style={{ width: "auto", alignSelf: "flex-start" }}>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <a href="#" onClick={(e) => { e.preventDefault(); setOpen(open === o.id ? null : o.id); }}>
              {open === o.id ? "بستن جزئیات" : "جزئیات"}
            </a>

            {open === o.id && (
              <>
                <ul>{Object.entries(o.fields).map(([k, v]) => <li key={k}><strong>{k}:</strong> {String(v)}</li>)}</ul>

                {o.payment_status !== "paid" && (
                  <div className="row">
                    <input type="number" min={1} placeholder="مبلغ (تومان)" value={price[o.id] ?? ""} onChange={(e) => setPrice({ ...price, [o.id]: e.target.value })} />
                    <button className="small" onClick={() => act(`/api/admin/orders/${o.id}/price`, "PATCH", { amount: Number(price[o.id]), currency: "IRT" }, "ثبت مبلغ ناموفق بود")} disabled={!price[o.id]}>
                      {o.price_amount == null ? "تعیین مبلغ و اطلاع به مشتری" : "تغییر مبلغ"}
                    </button>
                    {o.payment_status === "unpaid" && (
                      <button className="small secondary" onClick={() => confirm("پرداخت این سفارش (مثلاً واریز بانکی) تایید شود؟") && act(`/api/admin/orders/${o.id}/mark-paid`, "POST", undefined, "ثبت پرداخت ناموفق بود")}>
                        تایید پرداخت دستی
                      </button>
                    )}
                  </div>
                )}

                <Files
                  title="فایل‌ها"
                  base={`/api/admin/orders/${o.id}/files`}
                  downloadUrl={(id) => `/api/admin/files/${id}/download`}
                  deleteUrl={(id) => `/api/admin/files/${id}`}
                  kind="deliverable"
                />
                <p className="muted" style={{ margin: "4px 0" }}>فایل آپلودشده از اینجا «خروجی تحویلی» است و تا پرداخت (در سفارش‌های دارای قیمت) برای مشتری قفل می‌ماند.</p>

                <button disabled={o.ai_status === "running"} onClick={() => act(`/api/admin/orders/${o.id}/ai-draft`, "POST", undefined, "شروع پیش‌نویس ناموفق بود")}>
                  {o.ai_status === "running" ? "در حال تولید پیش‌نویس…" : o.ai_draft ? "تولید مجدد پیش‌نویس AI" : "پیش‌نویس AI"}
                </button>
                {o.ai_status === "failed" && <div className="err">Ollama در دسترس نیست.</div>}
                {o.ai_draft && <pre style={{ whiteSpace: "pre-wrap", marginTop: 14 }}>{o.ai_draft}</pre>}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
