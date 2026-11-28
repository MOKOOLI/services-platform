import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { PREPARE, STEPS } from "@/lib/content";

export const metadata: Metadata = { title: "مراحل کار", description: "از ثبت سفارش تا دریافت فایل نهایی؛ مراحل کار و آنچه باید آماده کنید." };

const FACTORS = ["حجم و پیچیدگی داده", "نوع و تعداد تحلیل‌ها یا مدل‌ها", "تعداد و قالب خروجی‌ها", "ددلاین"];

export default function HowItWorks() {
  return (
    <>
      <PageHeader title="مراحل کار" lead="از ثبت سفارش تا دریافت فایل نهایی، همه‌ی مراحل از صفحه‌ی پیگیری قابل دیدن است." crumbs={[{ label: "مراحل کار" }]} />

      <ol className="steps big">
        {STEPS.map((s) => <li key={s.title}><h3>{s.title}</h3><p>{s.text}</p></li>)}
      </ol>

      <section className="section">
        <h2>قبل از ثبت سفارش چه چیزی آماده کنیم؟</h2>
        <div className="two-col">
          {(Object.keys(PREPARE) as (keyof typeof PREPARE)[]).map((k) => (
            <div key={k} className="side-card">
              <h3>{PREPARE[k].title}</h3>
              <ul className="tick-list">{PREPARE[k].items.map((i) => <li key={i}><Check size={16} />{i}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 14 }}>راهنمای کامل‌تر: <Link href="/guides/order-checklist">چک‌لیست قبل از ثبت سفارش</Link> و <Link href="/guides/prepare-your-data">آماده‌سازی داده</Link>.</p>
      </section>

      <section className="section">
        <h2>هزینه چطور تعیین می‌شود؟</h2>
        <p className="lead muted">بعد از ثبت، سفارش بررسی و هزینه برایتان اعلام می‌شود. معمولاً این موارد روی هزینه اثر دارند:</p>
        <ul className="tick-list" style={{ marginTop: 14 }}>{FACTORS.map((f) => <li key={f}><Check size={16} />{f}</li>)}</ul>
      </section>

      <section className="section">
        <h2>پیگیری و پرداخت</h2>
        <div className="two-col">
          <div className="side-card"><h3>پیگیری با کد</h3><p className="muted">کد پیگیری را در <Link href="/track">صفحه‌ی پیگیری</Link> وارد کنید تا وضعیت، هزینه و فایل‌ها را ببینید.</p></div>
          <div className="side-card"><h3>پرداخت و دریافت فایل</h3><p className="muted">بعد از پرداخت (آنلاین یا واریز بانکی با تایید دستی)، فایل‌های نهایی در همان صفحه باز می‌شوند.</p></div>
        </div>
      </section>

      <section className="cta-band">
        <div><h2>آماده‌اید شروع کنید؟</h2><p>خدمت مورد نظر را انتخاب کنید و فرم را پر کنید.</p></div>
        <Link className="btn warm" href="/services">انتخاب خدمت</Link>
      </section>
    </>
  );
}
