import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { Mail, Phone, Send } from "@/components/Icons";
import PageHeader from "@/components/PageHeader";
import { channels } from "@/lib/site";

export const metadata: Metadata = { title: "تماس با ما", description: "پیام بدهید یا از راه‌های ارتباطی با ما در تماس باشید." };

export default function Contact() {
  const ch = channels();
  const icon = (k: string) => (k === "email" ? <Mail size={18} /> : k === "phone" ? <Phone size={18} /> : <Send size={18} />);
  return (
    <>
      <PageHeader title="تماس با ما" lead="سؤال یا پیشنهادی دارید؟ پیام بدهید؛ پاسخ را با ایمیل می‌گیرید." crumbs={[{ label: "تماس" }]} />
      <div className="order-layout">
        <ContactForm />
        <aside className="aside">
          <h2>قبل از ارسال پیام</h2>
          <ul className="plain-list">
            <li><Link href="/faq">سوالات متداول</Link> را ببینید؛ شاید جواب آماده باشد.</li>
            <li>اگر درباره‌ی سفارش می‌پرسید، کد پیگیری را بنویسید.</li>
            <li>کد پیگیری را گم کرده‌اید؟ ایمیلی که با آن سفارش داده‌اید را بنویسید.</li>
          </ul>
          {ch.length > 0 && (
            <>
              <h2 style={{ marginTop: 22 }}>راه‌های ارتباطی</h2>
              <ul className="plain-list">
                {ch.map((c) => (
                  <li key={c.key} className="contact-line">{icon(c.key)}<a href={c.href} target="_blank" rel="noopener noreferrer"><bdi>{c.text}</bdi></a></li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
