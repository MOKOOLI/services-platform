import Link from "next/link";

export type Crumb = { href?: string; label: string };

export default function PageHeader({ title, lead, crumbs = [] }: { title: string; lead?: string; crumbs?: Crumb[] }) {
  return (
    <header className="page-head">
      <nav aria-label="مسیر صفحه" className="crumbs">
        <Link href="/">خانه</Link>
        {crumbs.map((c) => (
          <span key={c.label}>
            <i aria-hidden="true">/</i>
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
          </span>
        ))}
      </nav>
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
    </header>
  );
}
