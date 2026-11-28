import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "درباره‌ی ما", description: "آشنایی با افرا دانش سبز و اصول کاری ما." };

const PRINCIPLES = [
  { t: "شفافیت", p: "هر سفارش کد پیگیری دارد؛ وضعیت، هزینه و فایل‌ها همیشه در دسترس شماست." },
  { t: "حریم خصوصی", p: "فایل‌ها در فضای خصوصی نگه‌داری می‌شوند و فقط با لینک موقت دانلود می‌شوند." },
  { t: "بازبینی", p: "هر خروجی پیش از تحویل توسط یک فرد بازبینی می‌شود." },
];

export default function About() {
  return (
    <>
      <PageHeader title="درباره‌ی ما" crumbs={[{ label: "درباره‌ی ما" }]} />
      <div className="prose wide">
        <p>
          {SITE_NAME} بستری برای سفارش تحلیل آماری و پروژه‌های داده است. هدف ما این است که مسیر سفارش ساده و قابل‌پیگیری باشد:
          فرم را پر می‌کنید، هزینه را بعد از بررسی می‌گیرید و تا تحویل، هر مرحله را با یک کد پیگیری می‌بینید.
        </p>
        <p>خدمات فعلی در دو دسته‌اند: خدمات آکادمیک (مثل تحلیل آماری با SPSS، R، Python، Stata و AMOS) و خدمات فنی (مثل دیتاساینس و یادگیری ماشین).</p>
      </div>
      <section className="section">
        <h2>اصول ما</h2>
        <div className="audience">{PRINCIPLES.map((x) => <div key={x.t}><h3>{x.t}</h3><p>{x.p}</p></div>)}</div>
      </section>
      <section className="section help-row">
        <Link href="/services" className="help-card"><h3>خدمت‌ها</h3><p>خدمت مورد نظرتان را انتخاب کنید.</p></Link>
        <Link href="/how-it-works" className="help-card"><h3>مراحل کار</h3><p>ببینید سفارش چه مسیری را طی می‌کند.</p></Link>
        <Link href="/contact" className="help-card"><h3>تماس</h3><p>سؤال یا پیشنهادی دارید؟</p></Link>
      </section>
    </>
  );
}
