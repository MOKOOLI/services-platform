"""Outbound notifications: transactional email (Resend) and n8n webhooks.

Everything here is best-effort: failures are logged and never break the request.
Both channels are disabled automatically when their env vars are empty.
"""
import logging
from html import escape
from typing import Any

import httpx

from ..config import settings

log = logging.getLogger("notify")

STATUS_FA = {
    "new": "ثبت شده",
    "in_review": "در حال بررسی",
    "in_progress": "در حال انجام",
    "delivered": "تحویل شده",
    "cancelled": "لغو شده",
}


def order_payload(order, product_name: str, product_slug: str) -> dict[str, Any]:
    return {
        "tracking_code": order.tracking_code,
        "product": product_name,
        "product_slug": product_slug,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "status": order.status,
        "price_amount": order.price_amount,
        "price_currency": order.price_currency,
        "fields": {f.key: f.value for f in order.fields},
    }


def _tracking_url(code: str) -> str:
    return f"{settings.public_site_url.rstrip('/')}/track?code={code}"


async def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.resend_api_key:
        log.info("email disabled (no RESEND_API_KEY); skipped: %s", subject)
        return False
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={"from": settings.email_from, "to": [to], "subject": subject, "html": html},
            )
        if r.status_code >= 400:
            log.warning("resend error %s: %s", r.status_code, r.text[:200])
            return False
        return True
    except httpx.HTTPError as exc:
        log.warning("resend request failed: %s", exc)
        return False


async def post_webhook(event: str, payload: dict[str, Any]) -> bool:
    if not settings.n8n_webhook_url:
        return False
    headers = {"X-Webhook-Secret": settings.n8n_webhook_secret} if settings.n8n_webhook_secret else {}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(settings.n8n_webhook_url, headers=headers, json={"event": event, "order" if event.startswith("order.") else "data": payload})
        if r.status_code >= 400:
            log.warning("n8n webhook error %s", r.status_code)
            return False
        return True
    except httpx.HTTPError as exc:
        log.warning("n8n webhook failed: %s", exc)
        return False


def _email_shell(body: str) -> str:
    return f'<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9;max-width:520px">{body}</div>'


async def order_created(data: dict[str, Any]) -> None:
    code = data["tracking_code"]
    link = _tracking_url(code)
    html = _email_shell(
        f"<p>سلام {escape(data['customer_name'])}،</p>"
        f"<p>سفارش شما برای «{escape(data['product'])}» ثبت شد.</p>"
        f'<p>کد پیگیری: <strong dir="ltr">{escape(code)}</strong></p>'
        f'<p><a href="{escape(link)}">پیگیری وضعیت سفارش</a></p>'
    )
    await send_email(data["customer_email"], "سفارش شما ثبت شد", html)
    await post_webhook("order.created", data)


async def order_status_changed(data: dict[str, Any]) -> None:
    label = STATUS_FA.get(data["status"], data["status"])
    link = _tracking_url(data["tracking_code"])
    html = _email_shell(
        f"<p>سلام {escape(data['customer_name'])}،</p>"
        f"<p>وضعیت سفارش «{escape(data['product'])}» به <strong>{escape(label)}</strong> تغییر کرد.</p>"
        f'<p><a href="{escape(link)}">مشاهده سفارش</a></p>'
    )
    await send_email(data["customer_email"], f"وضعیت سفارش: {label}", html)
    await post_webhook("order.status_changed", data)


def _money(amount: int | None, currency: str) -> str:
    return f"{amount:,} {'تومان' if currency == 'IRT' else 'ریال'}" if amount is not None else ""


async def order_quoted(data: dict[str, Any]) -> None:
    link = _tracking_url(data["tracking_code"])
    html = _email_shell(
        f"<p>سلام {escape(data['customer_name'])}،</p>"
        f"<p>هزینه‌ی سفارش «{escape(data['product'])}» تعیین شد: "
        f"<strong>{escape(_money(data['price_amount'], data['price_currency']))}</strong></p>"
        f'<p><a href="{escape(link)}">مشاهده و پرداخت</a></p>'
    )
    await send_email(data["customer_email"], "هزینه‌ی سفارش شما تعیین شد", html)
    await post_webhook("order.quoted", data)


async def order_paid(data: dict[str, Any]) -> None:
    link = _tracking_url(data["tracking_code"])
    html = _email_shell(
        f"<p>سلام {escape(data['customer_name'])}،</p>"
        f"<p>پرداخت سفارش «{escape(data['product'])}» "
        f"({escape(_money(data['price_amount'], data['price_currency']))}) با موفقیت ثبت شد.</p>"
        f'<p><a href="{escape(link)}">مشاهده سفارش</a></p>'
    )
    await send_email(data["customer_email"], "پرداخت شما ثبت شد", html)
    await post_webhook("order.paid", data)


async def contact_created(data: dict[str, Any]) -> None:
    if settings.admin_email:
        html = _email_shell(
            f"<p>پیام جدید از فرم تماس:</p>"
            f"<p><strong>{escape(data['name'])}</strong> (<span dir=\"ltr\">{escape(data['email'])}</span>)</p>"
            f"<p>موضوع: {escape(data['subject'] or '—')}</p>"
            f"<p style=\"white-space:pre-wrap\">{escape(data['message'])}</p>"
        )
        await send_email(settings.admin_email, "پیام جدید از فرم تماس", html)
    await post_webhook("contact.created", data)
