import type { Metadata } from "next";
import Link from "next/link";
import HeroPlot from "@/components/HeroPlot";
import PageHeader from "@/components/PageHeader";
import { AnovaTable, ModelTable } from "@/components/SampleTables";

export const metadata: Metadata = { title: "نمونه‌ی خروجی‌ها", description: "نمونه‌ی قالب جدول‌ها و نمودارهای خروجی." };

export default function Samples() {
  return (
    <>
      <PageHeader title="نمونه‌ی خروجی‌ها" lead="این نمونه‌ها فقط برای نمایش قالب خروجی‌اند و داده‌های آن‌ها واقعی نیست." crumbs={[{ label: "نمونه‌ها" }]} />
      <section className="section sample">
        <div className="sample-copy"><h2>جدول آماری استاندارد</h2><p>جدول‌ها در قالب آماده‌ی گزارش (سه‌خطی) تحویل داده می‌شوند.</p></div>
        <AnovaTable />
      </section>
      <section className="section sample reverse">
        <div className="sample-copy"><h2>نمودار و بازه‌ی اطمینان</h2><p>نمودار پراکندگی با خط برازش و بازه‌ی اطمینان ۹۵٪؛ مقدار R² از همین داده‌های نمونه محاسبه شده است.</p></div>
        <div style={{ maxWidth: 560 }}><HeroPlot /></div>
      </section>
      <section className="section sample">
        <div className="sample-copy"><h2>گزارش مقایسه‌ی مدل‌ها</h2><p>برای پروژه‌های یادگیری ماشین، شاخص‌های ارزیابی چند مدل کنار هم گزارش می‌شود.</p></div>
        <ModelTable />
      </section>
      <section className="cta-band">
        <div><h2>خروجی دلخواه شما چیست؟</h2><p>قالب خروجی را هنگام ثبت سفارش بنویسید.</p></div>
        <Link className="btn warm" href="/services">انتخاب خدمت</Link>
      </section>
    </>
  );
}
