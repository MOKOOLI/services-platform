"use client";
import { useMemo, useState } from "react";
import { Chevron, Search } from "@/components/Icons";
import type { FaqItem } from "@/lib/content";

export default function Faq({ items, searchable = true }: { items: FaqItem[]; searchable?: boolean }) {
  const cats = useMemo(() => ["همه", ...Array.from(new Set(items.map((i) => i.cat)))], [items]);
  const [cat, setCat] = useState("همه");
  const [q, setQ] = useState("");

  const shown = items.filter((i) => (cat === "همه" || i.cat === cat) && (!q.trim() || (i.q + " " + i.a).includes(q.trim())));

  return (
    <div>
      {searchable && (
        <div className="toolbar">
          <div className="searchbox">
            <Search />
            <input type="search" placeholder="جست‌وجو در سوالات (مثلاً پرداخت)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جست‌وجو در سوالات متداول" />
          </div>
          <div className="seg" role="group" aria-label="دسته‌بندی سوالات">
            {cats.map((c) => (
              <button key={c} type="button" aria-pressed={cat === c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>
      )}
      <div className="faq-list" style={{ marginTop: searchable ? 18 : 0 }}>
        {shown.length === 0 && <div className="notice">سوالی با این عبارت پیدا نشد. از صفحه‌ی «تماس» بپرسید.</div>}
        {shown.map((i) => (
          <details key={i.q} className="faq-item">
            <summary><span>{i.q}</span><Chevron /></summary>
            <p>{i.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
