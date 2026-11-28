import type { Metadata } from "next";
import Link from "next/link";
import { Book } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { GUIDES } from "@/lib/content";

export const metadata: Metadata = { title: "راهنماها", description: "راهنمای آماده‌سازی داده، چک‌لیست سفارش و خواندن شاخص‌های مدل." };

export default function Guides() {
  return (
    <>
      <PageHeader title="راهنماها" lead="مطالب کوتاه و کاربردی برای آماده‌سازی داده و خواندن نتایج." crumbs={[{ label: "راهنماها" }]} />
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
      <section className="section tool-teaser">
        <div>
          <h2>ابزار انتخاب آزمون آماری</h2>
          <p>با چند سؤال کوتاه، آزمون مناسب داده‌ی خود را پیدا کنید.</p>
          <Link className="btn" href="/tools/test-selector">شروع</Link>
        </div>
      </section>
    </>
  );
}
