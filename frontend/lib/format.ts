export function money(amount: number | null | undefined, currency = "IRT"): string {
  if (amount == null) return "";
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ${currency === "IRT" ? "تومان" : "ریال"}`;
}

export function apiError(data: unknown, fallback: string): string {
  const d = (data as { detail?: unknown } | null)?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => (typeof x === "string" ? x : (x as { msg?: string })?.msg ?? "ورودی نامعتبر")).join(" • ");
  return fallback;
}

const FA = "۰۱۲۳۴۵۶۷۸۹";
/** Latin digits (and decimal point) -> Persian digits. */
export function fa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA[+d]).replace(/\./g, "٫");
}
