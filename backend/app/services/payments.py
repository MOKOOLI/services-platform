"""Payment providers: zarinpal (production), mock (dev/tests only).

Amounts are stored on the order in IRT (toman) or IRR (rial); Zarinpal is always called in
rials (the API default), so no `currency` parameter ambiguity.
"""
import secrets
from dataclasses import dataclass
from typing import Any

import httpx

from ..config import settings


class PaymentError(Exception):
    pass


@dataclass
class Started:
    authority: str
    redirect_url: str


def enabled() -> bool:
    p = settings.payment_provider
    if p == "zarinpal":
        return bool(settings.zarinpal_merchant_id)
    if p == "mock":
        return settings.app_env != "production"
    return False


def to_rial(amount: int, currency: str) -> int:
    return amount * 10 if currency == "IRT" else amount


def _zp_hosts() -> tuple[str, str]:
    if settings.zarinpal_sandbox:
        return "https://sandbox.zarinpal.com", "https://sandbox.zarinpal.com"
    return "https://payment.zarinpal.com", "https://www.zarinpal.com"


async def _post_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(url, json=payload, headers={"accept": "application/json"})
        return r.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise PaymentError(f"ارتباط با درگاه ناموفق بود: {exc}") from exc


def _zp_error(body: dict[str, Any]):
    errs = body.get("errors")
    if isinstance(errs, dict) and errs:
        return errs
    if isinstance(errs, list) and errs:
        return errs[0]
    return None


async def start(*, amount: int, currency: str, description: str, email: str, callback_url: str) -> Started:
    if not enabled():
        raise PaymentError("پرداخت آنلاین فعال نیست")
    if settings.payment_provider == "mock":
        authority = "MOCK" + secrets.token_hex(8)
        return Started(authority, f"{callback_url}?Authority={authority}&Status=OK")

    api, pay = _zp_hosts()
    body = await _post_json(
        f"{api}/pg/v4/payment/request.json",
        {
            "merchant_id": settings.zarinpal_merchant_id,
            "amount": to_rial(amount, currency),
            "callback_url": callback_url,
            "description": description,
            "metadata": {"email": email},
        },
    )
    data = body.get("data")
    if _zp_error(body) or not isinstance(data, dict) or data.get("code") != 100 or not data.get("authority"):
        raise PaymentError(f"درگاه درخواست را نپذیرفت: {_zp_error(body) or data}")
    return Started(data["authority"], f"{pay}/pg/StartPay/{data['authority']}")


async def verify(*, authority: str, amount: int, currency: str) -> str:
    """Returns the bank reference id. Raises PaymentError if the payment is not confirmed."""
    if settings.payment_provider == "mock":
        if not authority.startswith("MOCK") or settings.app_env == "production":
            raise PaymentError("mock payment rejected")
        return "MOCK-REF"
    api, _ = _zp_hosts()
    body = await _post_json(
        f"{api}/pg/v4/payment/verify.json",
        {"merchant_id": settings.zarinpal_merchant_id, "amount": to_rial(amount, currency), "authority": authority},
    )
    data = body.get("data")
    # 100 = verified now, 101 = already verified earlier
    if _zp_error(body) or not isinstance(data, dict) or data.get("code") not in (100, 101):
        raise PaymentError(f"تایید پرداخت ناموفق: {_zp_error(body) or data}")
    return str(data.get("ref_id", ""))
