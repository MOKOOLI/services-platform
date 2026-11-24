"use client";
import { useCallback, useEffect, useState } from "react";
import { apiError } from "@/lib/format";

type FieldRow = { name: string; label: string; type: string; required: boolean; optionsText: string };
type PT = {
  slug: string; name: string; category: "academic" | "technical"; description: string; is_active: boolean;
  schema_json: { fields: { name: string; label: string; type: string; required?: boolean; options?: string[] }[] };
};
type Draft = { slug: string; name: string; category: "academic" | "technical"; description: string; is_active: boolean; fields: FieldRow[]; isNew: boolean };

const TYPES: Record<string, string> = { text: "متن کوتاه", textarea: "متن بلند", number: "عدد", date: "تاریخ", boolean: "بله/خیر", select: "انتخابی" };
const blankField = (): FieldRow => ({ name: "", label: "", type: "text", required: false, optionsText: "" });
const blank = (): Draft => ({ slug: "", name: "", category: "academic", description: "", is_active: true, fields: [blankField()], isNew: true });

function toDraft(p: PT): Draft {
  return {
    slug: p.slug, name: p.name, category: p.category, description: p.description, is_active: p.is_active, isNew: false,
    fields: p.schema_json.fields.map((f) => ({ name: f.name, label: f.label, type: f.type, required: !!f.required, optionsText: (f.options ?? []).join("\n") })),
  };
}

function toPayload(d: Draft) {
  return {
    slug: d.slug, name: d.name, category: d.category, description: d.description, is_active: d.is_active,
    schema_json: {
      fields: d.fields.map((f) => ({
        name: f.name, label: f.label, type: f.type, required: f.required,
        ...(f.type === "select" ? { options: f.optionsText.split("\n").map((s) => s.trim()).filter(Boolean) } : {}),
      })),
    },
  };
}

export default function Products() {
  const [list, setList] = useState<PT[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/product-types", { cache: "no-store" });
    if (r.status === 401 || r.status === 403) { window.location.reload(); return; }
    if (r.ok) setList(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const patchField = (i: number, p: Partial<FieldRow>) => setDraft((d) => d && { ...d, fields: d.fields.map((f, j) => (j === i ? { ...f, ...p } : f)) });
  const move = (i: number, dir: -1 | 1) => setDraft((d) => {
    if (!d) return d;
    const j = i + dir;
    if (j < 0 || j >= d.fields.length) return d;
    const fields = [...d.fields];
    [fields[i], fields[j]] = [fields[j], fields[i]];
    return { ...d, fields };
  });

  async function save() {
    if (!draft) return;
    setMsg(""); setOk("");
    const r = await fetch("/api/admin/product-types", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toPayload(draft)) });
    const data = await r.json().catch(() => null);
    if (!r.ok) { setMsg(apiError(data, "ذخیره ناموفق بود")); return; }
    setOk("ذخیره شد.");
    setDraft(null);
    load();
  }

  async function toggle(p: PT) {
    await fetch("/api/admin/product-types", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...toPayload(toDraft(p)), is_active: !p.is_active }),
    });
    load();
  }

  if (draft)
    return (
      <>
        <h1>{draft.isNew ? "محصول جدید" : `ویرایش: ${draft.name}`}</h1>
        <label>شناسه (slug، انگلیسی)</label>
        <input dir="ltr" value={draft.slug} disabled={!draft.isNew} onChange={(e) => patch({ slug: e.target.value.toLowerCase() })} placeholder="thesis-editing" />
        <label>نام</label>
        <input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
        <label>دسته</label>
        <select value={draft.category} onChange={(e) => patch({ category: e.target.value as Draft["category"] })}>
          <option value="academic">آکادمیک</option>
          <option value="technical">فنی</option>
        </select>
        <label>توضیح</label>
        <textarea rows={2} value={draft.description} onChange={(e) => patch({ description: e.target.value })} />

        <h3 style={{ marginTop: 24 }}>فیلدهای فرم سفارش</h3>
        <table className="fields">
          <tbody>
            {draft.fields.map((f, i) => (
              <tr key={i}>
                <td><input dir="ltr" placeholder="name" value={f.name} onChange={(e) => patchField(i, { name: e.target.value })} /></td>
                <td><input placeholder="برچسب" value={f.label} onChange={(e) => patchField(i, { label: e.target.value })} /></td>
                <td>
                  <select value={f.type} onChange={(e) => patchField(i, { type: e.target.value })}>
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td><label style={{ margin: 0, fontWeight: 400 }}><input type="checkbox" style={{ width: "auto" }} checked={f.required} onChange={(e) => patchField(i, { required: e.target.checked })} /> الزامی</label></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); move(i, -1); }}>↑</a>{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); move(i, 1); }}>↓</a>{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); patch({ fields: draft.fields.filter((_, j) => j !== i) }); }}>حذف</a>
                </td>
                {f.type === "select" && (
                  <td style={{ minWidth: 160 }}><textarea rows={3} placeholder={"هر گزینه در یک خط"} value={f.optionsText} onChange={(e) => patchField(i, { optionsText: e.target.value })} /></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <button className="secondary small" style={{ marginTop: 10 }} onClick={() => patch({ fields: [...draft.fields, blankField()] })}>+ افزودن فیلد</button>

        <details style={{ marginTop: 16 }}>
          <summary className="muted">پیش‌نمایش schema_json</summary>
          <pre dir="ltr" style={{ overflow: "auto" }}>{JSON.stringify(toPayload(draft).schema_json, null, 2)}</pre>
        </details>

        {msg && <div className="err">{msg}</div>}
        <div className="row">
          <button onClick={save} style={{ marginTop: 20 }}>ذخیره</button>
          <button className="secondary" style={{ marginTop: 20 }} onClick={() => { setDraft(null); setMsg(""); }}>انصراف</button>
        </div>
      </>
    );

  return (
    <>
      <h1>محصولات</h1>
      <p className="muted">هر محصول یک فرم سفارش است. تغییر فیلدها روی سفارش‌های قبلی اثری ندارد.</p>
      <button onClick={() => { setDraft(blank()); setOk(""); }} style={{ marginTop: 0 }}>+ محصول جدید</button>
      {ok && <div className="ok">{ok}</div>}
      {list.map((p) => (
        <div key={p.slug} className="card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <strong>{p.name}</strong>
              <span className={`badge ${p.is_active ? "ok" : "warn"}`}>{p.is_active ? "فعال" : "غیرفعال"}</span>
              <div className="muted"><code>{p.slug}</code> · {p.category === "academic" ? "آکادمیک" : "فنی"} · {p.schema_json.fields.length} فیلد</div>
            </div>
            <div>
              <a href="#" onClick={(e) => { e.preventDefault(); setDraft(toDraft(p)); setMsg(""); }}>ویرایش</a>{" · "}
              <a href="#" onClick={(e) => { e.preventDefault(); toggle(p); }}>{p.is_active ? "غیرفعال‌سازی" : "فعال‌سازی"}</a>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
