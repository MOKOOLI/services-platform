export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "افرا دانش سبز";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const clean = (v?: string) => (v ?? "").trim();
const digits = (v: string) => v.replace(/[^\d]/g, "");

/** Contact channels come from env vars; anything not configured is simply not shown. */
export const CONTACT = {
  email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  phone: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  telegram: clean(process.env.NEXT_PUBLIC_TELEGRAM),
  whatsapp: clean(process.env.NEXT_PUBLIC_WHATSAPP),
  instagram: clean(process.env.NEXT_PUBLIC_INSTAGRAM),
};

export function channels(): { key: string; label: string; href: string; text: string }[] {
  const out: { key: string; label: string; href: string; text: string }[] = [];
  if (CONTACT.email) out.push({ key: "email", label: "ایمیل", href: `mailto:${CONTACT.email}`, text: CONTACT.email });
  if (CONTACT.phone) out.push({ key: "phone", label: "تلفن", href: `tel:+${digits(CONTACT.phone)}`, text: CONTACT.phone });
  if (CONTACT.telegram)
    out.push({ key: "telegram", label: "تلگرام", href: CONTACT.telegram.startsWith("http") ? CONTACT.telegram : `https://t.me/${CONTACT.telegram.replace(/^@/, "")}`, text: CONTACT.telegram.replace(/^https?:\/\/t\.me\//, "@") });
  if (CONTACT.whatsapp) out.push({ key: "whatsapp", label: "واتساپ", href: `https://wa.me/${digits(CONTACT.whatsapp)}`, text: CONTACT.whatsapp });
  if (CONTACT.instagram)
    out.push({ key: "instagram", label: "اینستاگرام", href: CONTACT.instagram.startsWith("http") ? CONTACT.instagram : `https://instagram.com/${CONTACT.instagram.replace(/^@/, "")}`, text: CONTACT.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@") });
  return out;
}
