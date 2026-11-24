"use client";
import { useState } from "react";
import Link from "next/link";
import Files from "@/components/Files";
import { Check } from "@/components/Icons";
import { API, ProductType } from "@/lib/api";

export default function OrderForm({ type }: { type: ProductType }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: string, v: unknown) => setValues((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      const r = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_type_slug: type.slug, customer_name: name, customer_email: email, fields: values }),
      });
      const data = await r.json();
      if (r.status === 201) setCode(data.tracking_code);
      else if (Array.isArray(data.detail)) setErrors(data.detail.map((d: unknown) => (typeof d === "string" ? d : "ورودی نامعتبر")));
      else setErrors([typeof data.detail === "string" ? data.detail : "خطا در ثبت سفارش"]);
    } catch {
      setErrors(["ارتباط با سرور برقرار نشد"]);
    } finally {
      setBusy(false);
    }
  }

  if (code)
    return (
      <div className="success">
        <span className="success-icon"><Check size={26} /></span>
        <h2>سفارش شما ثبت شد</h2>
        <p className="muted">این کد را نگه دارید؛ برای پیگیری سفارش و دریافت فایل‌ها لازم است.</p>
        <div className="codebox">
          <code>{code}</code>
          <button
            type="button" className="secondary small"
            onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          >{copied ? "کپی شد" : "کپی کد"}</button>
        </div>
        <Link className="btn" href={`/track?code=${code}`}>پیگیری سفارش</Link>
        <Files
          title="پیوست فایل (اختیاری)"
          base={`${API}/api/orders/track/${encodeURIComponent(code)}/files`}
          downloadUrl={(id) => `${API}/api/orders/track/${encodeURIComponent(code)}/files/${id}/download`}
          kind="attachment"
        />
      </div>
    );

  return (
    <form onSubmit={submit} className="sheet">
      <label>نام</label>
      <input required value={name} onChange={(e) => setName(e.target.value)} />
      <label>ایمیل</label>
      <input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />

      {type.schema_json.fields.map((f) => (
        <div key={f.name}>
          <label>
            {f.label}
            {f.required && " *"}
          </label>
          {f.type === "textarea" && <textarea rows={4} required={f.required} onChange={(e) => set(f.name, e.target.value)} />}
          {f.type === "select" && (
            <select required={f.required} defaultValue="" onChange={(e) => set(f.name, e.target.value)}>
              <option value="" disabled>انتخاب کنید</option>
              {f.options?.map((o) => <option key={o}>{o}</option>)}
            </select>
          )}
          {f.type === "boolean" && <input type="checkbox" style={{ width: "auto" }} onChange={(e) => set(f.name, e.target.checked)} />}
          {f.type === "number" && <input type="number" required={f.required} onChange={(e) => set(f.name, e.target.value === "" ? undefined : Number(e.target.value))} />}
          {f.type === "date" && <input type="date" dir="ltr" required={f.required} onChange={(e) => set(f.name, e.target.value)} />}
          {f.type === "text" && <input required={f.required} onChange={(e) => set(f.name, e.target.value)} />}
        </div>
      ))}

      {errors.map((m, i) => <div key={i} className="err">{m}</div>)}
      <button disabled={busy}>{busy ? "در حال ارسال…" : "ثبت سفارش"}</button>
    </form>
  );
}
