import Link from "next/link";
import Faq from "@/components/Faq";
import HeroPlot from "@/components/HeroPlot";
import { Book, Compass, ICONS } from "@/components/Icons";
import { AcademicArt, TechArt } from "@/components/ServiceArt";
import { AnovaTable } from "@/components/SampleTables";
import TrackBox from "@/components/TrackBox";
import { getProductTypes, ProductType } from "@/lib/api";
import { AUDIENCES, FAQ, FEATURES, GUIDES, STEPS } from "@/lib/content";

export const dynamic = "force-dynamic";

const CATEGORY = { academic: "آکادمیک", technical: "فنی" } as const;

function choices(t: ProductType) {
  const f = t.schema_json.fields.find((x) => x.type === "select" && x.options?.length);
  return f ? { label: f.label, options: f.options ?? [] } : null;
}

export default async function Home() {
  const types = await getProductTypes();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>تحلیل آماری و پروژه‌های داده، با پیگیری شفاف از ثبت تا تحویل</h1>
          <p className="lead">
            سفارش را ثبت کنید، هزینه را بعد از بررسی می‌گیرید و با یک کد پیگیری مراحل کار را می‌بینید.
            برای سفارش نیازی به ثبت‌نام نیست.
          </p>
          <div className="cta-row">
            <Link className="btn warm" href="/services">انتخاب خدمت</Link>
            <Link className="btn outline-light" href="/tools/test-selector">کدام آزمون آماری؟</Link>
          </div>
          <TrackBox light />
        </div>
        <HeroPlot />
      </section>

      <section id="services" className="section">
        <div className="section-head row-between">
          <div>
            <h2>خدمت مورد نظرتان را انتخاب کنید</h2>
            <p className="muted">هر خدمت یک فرم ساده دارد؛ هزینه بعد از بررسی سفارش اعلام می‌شود.</p>
          </div>
          <Link href="/services" className="more">مشاهده‌ی همه و جست‌وجو</Link>
        </div>
        {types.length === 0 ? (
          <div className="notice">
            خدمت‌ها بارگذاری نشد. اگر سایت تازه باز شده، چند ثانیه صبر کنید و صفحه را دوباره باز کنید.
          </div>
        ) : (
          <ul className="svc-list">
            {types.map((t) => {
              const c = choices(t);
              return (
                <li key={t.slug} className={`svc ${t.category}`}>
                  <div className="svc-body">
                    <span className="cat"><i className={`dot ${t.category}`} />{CATEGORY[t.category]}</span>
                    <h3><Link href={`/services/${t.slug}`}>{t.name}</Link></h3>
                    <p>{t.description}</p>
                    {c && (
                      <div className="chips" aria-label={c.label}>
                        <span className="muted">{c.label}:</span>
                        {c.options.map((o) => <span key={o} className="chip">{o}</span>)}
                      </div>
                    )}
                    <div className="svc-actions">
                      <Link className="btn" href={`/order/${t.slug}`}>ثبت سفارش</Link>
                      <Link className="btn ghost" href={`/services/${t.slug}`}>جزئیات</Link>
                    </div>
                  </div>
                  <div className="svc-art">{t.category === "academic" ? <AcademicArt /> : <TechArt />}</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section-head"><h2>برای چه کسانی؟</h2></div>
        <div className="audience">
          {AUDIENCES.map((a) => (
            <div key={a.title}><h3>{a.title}</h3><p>{a.text}</p></div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>چرا {`افرا دانش سبز`}؟</h2></div>
        <div className="features">
          {FEATURES.map((f) => {
            const Icon = ICONS[f.icon as keyof typeof ICONS];
            return (
              <div key={f.title} className="feature">
                <span className="ico"><Icon /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head row-between">
          <h2>مسیر یک سفارش</h2>
          <Link href="/how-it-works" className="more">جزئیات بیشتر</Link>
        </div>
        <ol className="steps">
          {STEPS.map((s) => <li key={s.title}><h3>{s.title}</h3><p>{s.text}</p></li>)}
        </ol>
      </section>

      <section className="section tool-teaser">
        <div>
          <span className="ico"><Compass /></span>
          <h2>نمی‌دانید کدام آزمون آماری مناسب است؟</h2>
          <p>با چند سؤال کوتاه درباره‌ی هدف تحلیل و نوع داده‌هایتان، آزمون مناسب و پیش‌فرض‌هایش را ببینید.</p>
          <Link className="btn" href="/tools/test-selector">شروع ابزار انتخاب آزمون</Link>
        </div>
        <ul className="tool-preview" aria-hidden="true">
          <li>مقایسه‌ی گروه‌ها</li><li>رابطه‌ی دو متغیر</li><li>پیش‌بینی</li>
        </ul>
      </section>

      <section className="section sample">
        <div className="sample-copy">
          <h2>خروجی‌ها آماده‌ی استفاده در گزارش‌اند</h2>
          <p>
            نتایج در قالب جدول‌ها و نمودارهای استاندارد تحویل داده می‌شوند تا بتوانید مستقیم در پایان‌نامه،
            مقاله یا گزارش‌تان از آن‌ها استفاده کنید.
          </p>
          <p className="muted small">داده‌های جدول نمونه فقط برای نمایش قالب است.</p>
          <Link href="/samples" className="more">مشاهده‌ی نمونه‌های بیشتر</Link>
        </div>
        <AnovaTable />
      </section>

      <section className="section">
        <div className="section-head row-between">
          <h2>راهنماهای کاربردی</h2>
          <Link href="/guides" className="more">همه‌ی راهنماها</Link>
        </div>
        <div className="guide-cards">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="guide-card">
              <span className="chip"><Book size={14} /> {g.tag}</span>
              <h3>{g.title}</h3>
              <p>{g.summary}</p>
              <small>مطالعه‌ی {g.minutes.toLocaleString("fa-IR")} دقیقه‌ای</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head row-between">
          <h2>سوالات متداول</h2>
          <Link href="/faq" className="more">همه‌ی سوالات</Link>
        </div>
        <Faq items={[FAQ[0], FAQ[4], FAQ[5], FAQ[6], FAQ[8]]} searchable={false} />
      </section>

      <section className="cta-band">
        <div>
          <h2>آماده‌اید؟ سفارش‌تان را همین حالا ثبت کنید</h2>
          <p>چند دقیقه برای پر کردن فرم کافی است؛ بقیه‌ی مسیر را با کد پیگیری دنبال می‌کنید.</p>
        </div>
        <div className="cta-row" style={{ marginTop: 0 }}>
          <Link className="btn warm" href="/services">انتخاب خدمت</Link>
          <Link className="btn outline-light" href="/contact">سؤال دارم</Link>
        </div>
      </section>
    </>
  );
}
