import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import GuideBody from "@/components/GuideBody";
import PageHeader from "@/components/PageHeader";
import { GUIDES } from "@/lib/content";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = GUIDES.find((x) => x.slug === params.slug);
  return g ? { title: g.title, description: g.summary } : { title: "راهنما" };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = GUIDES.find((x) => x.slug === params.slug);
  if (!g) notFound();
  const others = GUIDES.filter((x) => x.slug !== g.slug);
  return (
    <>
      <PageHeader title={g.title} lead={g.summary} crumbs={[{ href: "/guides", label: "راهنماها" }, { label: g.tag }]} />
      <p className="muted small">مطالعه‌ی {g.minutes.toLocaleString("fa-IR")} دقیقه‌ای</p>
      <div className="detail">
        <article className="detail-main"><GuideBody blocks={g.body} /></article>
        <aside className="detail-side">
          <div className="side-card">
            <h3>نیاز به کمک دارید؟</h3>
            <p className="muted small">سفارش خود را ثبت کنید یا سؤالتان را بپرسید.</p>
            <Link className="btn" href="/services" style={{ width: "100%" }}>ثبت سفارش</Link>
            <Link className="linklike" href="/contact">سؤال دارم</Link>
          </div>
          <div className="side-card">
            <h3>راهنماهای دیگر</h3>
            <ul className="plain-list">{others.map((o) => <li key={o.slug}><Link href={`/guides/${o.slug}`}>{o.title}</Link></li>)}</ul>
          </div>
        </aside>
      </div>
    </>
  );
}
