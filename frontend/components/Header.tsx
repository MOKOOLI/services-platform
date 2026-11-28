"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Close, Menu } from "@/components/Icons";
import Mark from "@/components/Mark";
import ThemeToggle from "@/components/ThemeToggle";
import { NAV } from "@/lib/nav";

export default function Header({ name }: { name: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const active = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <header className="site-header">
      <div className="wrap header-bar">
        <Link href="/" className="brand"><Mark /><span>{name}</span></Link>

        <nav className="nav-desktop" aria-label="منوی اصلی">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active(n.href) ? "active" : ""} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/track" className="nav-pill">پیگیری سفارش</Link>
          <ThemeToggle />
          <button type="button" className="icon-btn menu-btn" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "بستن منو" : "باز کردن منو"} onClick={() => setOpen(!open)}>
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="nav-mobile" aria-label="منوی موبایل">
          <Link href="/track" className="mobile-cta">پیگیری سفارش</Link>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active(n.href) ? "active" : ""}>{n.label}</Link>
          ))}
          <Link href="/about">درباره‌ی ما</Link>
          <Link href="/samples">نمونه‌ی خروجی‌ها</Link>
        </nav>
      )}
    </header>
  );
}
