import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "پلتفرم خدمات تخصصی",
  description: "ثبت سفارش خدمات آکادمیک و فنی",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <main>
          <nav style={{ display: "flex", gap: 16, marginBottom: 28 }}>
            <Link href="/">خانه</Link>
            <Link href="/track">پیگیری سفارش</Link>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
