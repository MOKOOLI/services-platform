import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import FloatingActions from "@/components/FloatingActions";
import Header from "@/components/Header";
import Mark from "@/components/Mark";
import { channels, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | تحلیل آماری و پروژه‌های داده`, template: `%s | ${SITE_NAME}` },
  description: "سفارش تحلیل آماری و پروژه‌های داده، با پیگیری شفاف از ثبت تا تحویل. بدون ثبت‌نام.",
  openGraph: { title: SITE_NAME, description: "تحلیل آماری و پروژه‌های داده با پیگیری شفاف", locale: "fa_IR", type: "website" },
};

// Apply the saved theme before first paint (avoids a light/dark flash).
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ch = channels();
  const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <a href="#main" className="skip-link">پرش به محتوای اصلی</a>
        <Header name={SITE_NAME} />
        <main id="main" className="wrap page">{children}</main>

        <footer className="site-footer">
          <div className="wrap foot-grid">
            <div>
              <div className="brand foot-brand"><Mark /><span>{SITE_NAME}</span></div>
              <p>سفارش تحلیل آماری و پروژه‌های داده، با پیگیری شفاف از ثبت تا تحویل.</p>
            </div>
            <nav aria-label="خدمت‌ها">
              <h3>خدمت‌ها</h3>
              <Link href="/services">همه‌ی خدمت‌ها</Link>
              <Link href="/samples">نمونه‌ی خروجی‌ها</Link>
              <Link href="/how-it-works">مراحل کار</Link>
              <Link href="/track">پیگیری سفارش</Link>
            </nav>
            <nav aria-label="آموزش">
              <h3>آموزش و ابزار</h3>
              <Link href="/guides">راهنماها</Link>
              <Link href="/tools/test-selector">انتخاب آزمون آماری</Link>
              <Link href="/faq">سوالات متداول</Link>
            </nav>
            <nav aria-label="ارتباط">
              <h3>ارتباط</h3>
              <Link href="/about">درباره‌ی ما</Link>
              <Link href="/contact">فرم تماس</Link>
              {ch.map((c) => (
                <a key={c.key} href={c.href} target="_blank" rel="noopener noreferrer">{c.label}</a>
              ))}
            </nav>
          </div>
          <div className="wrap foot-bottom">© {year} {SITE_NAME}</div>
        </footer>

        <FloatingActions channels={ch.map(({ key, label, href }) => ({ key, label, href }))} />
      </body>
    </html>
  );
}
