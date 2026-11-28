"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUp, Chat, Close, Mail, Phone, Send } from "@/components/Icons";

type Ch = { key: string; label: string; href: string };

export default function FloatingActions({ channels }: { channels: Ch[] }) {
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const icon = (k: string) => (k === "email" ? <Mail size={18} /> : k === "phone" ? <Phone size={18} /> : <Send size={18} />);

  return (
    <div className="fab-wrap">
      {showTop && (
        <button type="button" className="fab fab-top" aria-label="بازگشت به بالای صفحه" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp />
        </button>
      )}
      {open && (
        <div className="fab-menu" role="menu">
          <Link href="/contact" role="menuitem" onClick={() => setOpen(false)}><Chat size={18} />فرم تماس</Link>
          {channels.map((c) => (
            <a key={c.key} role="menuitem" href={c.href} target="_blank" rel="noopener noreferrer">{icon(c.key)}{c.label}</a>
          ))}
          <Link href="/faq" role="menuitem" onClick={() => setOpen(false)}>سوالات متداول</Link>
        </div>
      )}
      <button type="button" className="fab fab-main" aria-expanded={open} aria-label={open ? "بستن منوی ارتباط" : "ارتباط با ما"} onClick={() => setOpen(!open)}>
        {open ? <Close /> : <Chat />}
      </button>
    </div>
  );
}
