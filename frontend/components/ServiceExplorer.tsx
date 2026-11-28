"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "@/components/Icons";
import type { ProductType } from "@/lib/api";
import { fa } from "@/lib/format";

const CAT = { academic: "آکادمیک", technical: "فنی" } as const;

function options(t: ProductType) {
  const f = t.schema_json.fields.find((x) => x.type === "select" && x.options?.length);
  return f?.options ?? [];
}

export default function ServiceExplorer({ types }: { types: ProductType[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | "academic" | "technical">("all");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return types.filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (!needle) return true;
      const hay = [t.name, t.description, ...t.schema_json.fields.flatMap((f) => [f.label, ...(f.options ?? [])])].join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [types, q, cat]);

  const counts = { all: types.length, academic: types.filter((t) => t.category === "academic").length, technical: types.filter((t) => t.category === "technical").length };

  return (
    <div>
      <div className="toolbar">
        <div className="searchbox">
          <Search />
          <input type="search" placeholder="جست‌وجوی خدمت یا نرم‌افزار (مثلاً SPSS)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جست‌وجوی خدمت‌ها" />
        </div>
        <div className="seg" role="group" aria-label="دسته‌بندی">
          {(["all", "academic", "technical"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={cat === k} className={cat === k ? "on" : ""} onClick={() => setCat(k)}>
              {k === "all" ? "همه" : CAT[k]} <span>{fa(counts[k])}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="muted small" role="status" style={{ margin: "12px 0" }}>{fa(list.length)} خدمت پیدا شد</p>

      {list.length === 0 ? (
        <div className="notice">
          خدمتی با این مشخصات پیدا نشد. <button type="button" className="linklike" onClick={() => { setQ(""); setCat("all"); }}>پاک کردن فیلترها</button>
          {" "}یا از صفحه‌ی <Link href="/contact">تماس</Link> نیازتان را بنویسید.
        </div>
      ) : (
        <ul className="cards">
          {list.map((t) => {
            const opts = options(t);
            return (
              <li key={t.slug} className={`svc-card ${t.category}`}>
                <span className="cat"><i className={`dot ${t.category}`} />{CAT[t.category]}</span>
                <h3><Link href={`/services/${t.slug}`}>{t.name}</Link></h3>
                <p>{t.description}</p>
                {opts.length > 0 && (
                  <div className="chips">
                    {opts.slice(0, 5).map((o) => <span key={o} className="chip">{o}</span>)}
                    {opts.length > 5 && <span className="chip muted">+{fa(opts.length - 5)}</span>}
                  </div>
                )}
                <div className="svc-actions">
                  <Link className="btn small" href={`/order/${t.slug}`}>ثبت سفارش</Link>
                  <Link className="btn ghost small" href={`/services/${t.slug}`}>جزئیات</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
