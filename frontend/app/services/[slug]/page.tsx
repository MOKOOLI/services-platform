import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Faq from "@/components/Faq";
import { Check } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { AcademicArt, TechArt } from "@/components/ServiceArt";
import TrackBox from "@/components/TrackBox";
import { getProductType } from "@/lib/api";
import { FAQ, GUIDES, PREPARE, STEPS } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const t = await getProductType(params.slug);
  return t ? { title: t.name, description: t.description } : { title: "خدمت" };
}

export default async function ServiceDetail({ params }: { params: { slug: string } }) {
  const t = await getProductType(params.slug);
  if (!t) notFound();
  const fields = t.schema_json.fields;
  const prep = PREPARE[t.category];
  const guides = GUIDES.filter((g) => (t.category === "academic" ? g.slug !== "classification-metrics" : g.slug !== "prepare-your-data"));

  return (
    <>
      <PageHeader title={t.name} lead={t.description} crumbs={[{ href: "/services", label: "خدمت‌ها" }, { label: t.name }]} />
      <div className="detail">
        <div className="detail-main">
          <section>
            <h2>اطلاعاتی که در فرم سفارش می‌پرسیم</h2>
            <ul className="field-list">
              {fields.map((f) => (
                <li key={f.name}>
                  <strong>{f.label}</strong>
                  {f.required ? <span className="badge warn">الزامی</span> : <span className="badge">اختیاری</span>}
                  {f.type === "select" && f.options && (
                    <div className="chips">{f.options.map((o) => <span key={o} className="chip">{o}</span>)}</div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>{prep.title}: قبل از سفارش آماده کنید</h2>
            <ul className="tick-list">{prep.items.map((i) => <li key={i}><Check size={16} />{i}</li>)}</ul>
          </section>

          <section>
            <h2>بعد از ثبت سفارش چه می‌شود؟</h2>
            <ol className="steps compact">{STEPS.map((s) => <li key={s.title}><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
          </section>

          <section>
            <h2>بخوانید</h2>
            <div className="guide-cards">
              {guides.slice(0, 2).map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`} className="guide-card"><h3>{g.title}</h3><p>{g.summary}</p></Link>
              ))}
            </div>
          </section>

          <section>
            <h2>سوالات رایج</h2>
            <Faq items={[FAQ[4], FAQ[8], FAQ[9]]} searchable={false} />
          </section>
        </div>

        <aside className="detail-side">
          <div className="side-card">
            <div className="aside-art">{t.category === "academic" ? <AcademicArt /> : <TechArt />}</div>
            <p className="muted small">هزینه بعد از بررسی سفارش اعلام می‌شود و ثبت سفارش به‌تنهایی نیاز به پرداخت ندارد.</p>
            <Link className="btn" href={`/order/${t.slug}`} style={{ width: "100%" }}>ثبت سفارش</Link>
            {t.category === "academic" && <Link className="btn ghost" href="/tools/test-selector" style={{ width: "100%" }}>کدام آزمون مناسب است؟</Link>}
            <Link className="linklike" href="/contact">سؤال دارم</Link>
          </div>
          <div className="side-card"><TrackBox /></div>
        </aside>
      </div>
    </>
  );
}
