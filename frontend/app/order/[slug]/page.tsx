import { notFound } from "next/navigation";
import OrderForm from "@/components/OrderForm";
import { Check } from "@/components/Icons";
import { AcademicArt, TechArt } from "@/components/ServiceArt";
import { getProductType } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { slug: string } }) {
  const type = await getProductType(params.slug);
  if (!type) notFound();
  return (
    <div className="order-layout">
      <div>
        <h1>{type.name}</h1>
        <p className="lead muted">{type.description}</p>
        <OrderForm type={type} />
      </div>
      <aside className={`aside ${type.category}`}>
        <div className="aside-art">{type.category === "academic" ? <AcademicArt /> : <TechArt />}</div>
        <h2>بعد از ثبت سفارش</h2>
        <ul>
          <li><Check size={16} />یک کد پیگیری می‌گیرید؛ ثبت‌نام لازم نیست.</li>
          <li><Check size={16} />سفارش بررسی می‌شود و هزینه‌ی آن برایتان اعلام می‌شود.</li>
          <li><Check size={16} />فایل‌های مرتبط را همان‌جا یا بعداً در صفحه‌ی پیگیری پیوست کنید.</li>
        </ul>
      </aside>
    </div>
  );
}
