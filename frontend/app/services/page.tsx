import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ServiceExplorer from "@/components/ServiceExplorer";
import { getProductTypes } from "@/lib/api";

export const metadata: Metadata = { title: "خدمت‌ها", description: "خدمات آکادمیک و فنی: تحلیل آماری، دیتاساینس و یادگیری ماشین." };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const types = await getProductTypes();
  return (
    <>
      <PageHeader title="خدمت‌ها" lead="خدمت مناسب را جست‌وجو یا بر اساس دسته انتخاب کنید و سفارش خود را ثبت کنید." crumbs={[{ label: "خدمت‌ها" }]} />
      {types.length === 0 ? (
        <div className="notice">خدمت‌ها بارگذاری نشد. اگر سایت تازه باز شده، چند ثانیه صبر کنید و صفحه را دوباره باز کنید.</div>
      ) : (
        <ServiceExplorer types={types} />
      )}
      <section className="section help-row">
        <Link href="/tools/test-selector" className="help-card"><h3>مطمئن نیستید چه تحلیلی لازم است؟</h3><p>ابزار انتخاب آزمون آماری را امتحان کنید.</p></Link>
        <Link href="/guides" className="help-card"><h3>قبل از سفارش بخوانید</h3><p>راهنمای آماده‌سازی داده و چک‌لیست سفارش.</p></Link>
        <Link href="/contact" className="help-card"><h3>خدمت دیگری لازم دارید؟</h3><p>نیازتان را برایمان بنویسید.</p></Link>
      </section>
    </>
  );
}
