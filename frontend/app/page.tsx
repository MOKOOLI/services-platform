import Link from "next/link";
import { getProductTypes } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const types = await getProductTypes();
  return (
    <>
      <h1>خدمات تخصصی</h1>
      <p className="muted">نوع خدمت را انتخاب کنید و سفارش خود را ثبت کنید.</p>
      <div className="grid">
        {types.map((t) => (
          <Link key={t.slug} href={`/order/${t.slug}`} className="card">
            <strong>{t.name}</strong>
            <p className="muted">{t.description}</p>
          </Link>
        ))}
      </div>
      {types.length === 0 && <p className="muted">فعلاً خدمتی در دسترس نیست یا سرور پاسخ نمی‌دهد.</p>}
    </>
  );
}
