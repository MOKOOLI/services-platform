import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "سفارش تحلیل آماری و پروژه‌های داده، با پیگیری شفاف از ثبت تا تحویل",
};

function Mark() {
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--brand)" />
      <g fill="var(--brand-ink)">
        <circle cx="16" cy="44" r="4.2" /><circle cx="28" cy="38" r="4.2" /><circle cx="38" cy="30" r="4.2" /><circle cx="50" cy="19" r="4.2" />
      </g>
      <path d="M10 49 54 14" stroke="var(--accent-bright)" strokeWidth="4.2" strokeLinecap="round" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <header className="site-header">
          <div className="wrap header-bar">
            <Link href="/" className="brand"><Mark /><span>{SITE_NAME}</span></Link>
            <nav aria-label="منوی اصلی">
              <Link href="/#services">خدمت‌ها</Link>
              <Link href="/track" className="nav-pill">پیگیری سفارش</Link>
            </nav>
          </div>
        </header>
        <main className="wrap page">{children}</main>
        <footer className="site-footer">
          <div className="wrap foot">
            <div>
              <div className="brand foot-brand"><Mark /><span>{SITE_NAME}</span></div>
              <p>سفارش تحلیل آماری و پروژه‌های داده، با پیگیری شفاف از ثبت تا تحویل.</p>
            </div>
            <nav aria-label="پیوندها">
              <Link href="/#services">خدمت‌ها</Link>
              <Link href="/track">پیگیری سفارش</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
