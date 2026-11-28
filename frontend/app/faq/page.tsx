import type { Metadata } from "next";
import Link from "next/link";
import Faq from "@/components/Faq";
import PageHeader from "@/components/PageHeader";
import { FAQ } from "@/lib/content";

export const metadata: Metadata = { title: "سوالات متداول", description: "پاسخ سوالات رایج درباره‌ی ثبت سفارش، پرداخت، فایل‌ها و امنیت." };

export default function FaqPage() {
  return (
    <>
      <PageHeader title="سوالات متداول" lead="پاسخ سوالات رایج را اینجا پیدا کنید." crumbs={[{ label: "سوالات متداول" }]} />
      <Faq items={FAQ} />
      <section className="cta-band">
        <div><h2>جوابتان را پیدا نکردید؟</h2><p>سؤالتان را برایمان بنویسید.</p></div>
        <Link className="btn warm" href="/contact">تماس با ما</Link>
      </section>
    </>
  );
}
