import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-page">
      <p className="big-num" aria-hidden="true">۴۰۴</p>
      <h1>صفحه‌ای که دنبالش بودید پیدا نشد</h1>
      <p className="lead muted">ممکن است آدرس اشتباه باشد یا صفحه جابه‌جا شده باشد.</p>
      <div className="cta-row" style={{ justifyContent: "center" }}>
        <Link className="btn" href="/">صفحه‌ی اصلی</Link>
        <Link className="btn ghost" href="/services">خدمت‌ها</Link>
        <Link className="btn ghost" href="/track">پیگیری سفارش</Link>
      </div>
    </div>
  );
}
