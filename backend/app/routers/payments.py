from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import Order, Payment, payment_status
from ..schemas import PayOut
from ..services import notify, payments

router = APIRouter(prefix="/api", tags=["payments"])


def _site(path: str) -> str:
    return f"{settings.public_site_url.rstrip('/')}{path}"


@router.post("/orders/track/{code}/pay", response_model=PayOut)
async def start_payment(code: str, db: Session = Depends(get_db)):
    if not payments.enabled():
        raise HTTPException(503, "پرداخت آنلاین فعال نیست")
    o = db.scalar(select(Order).where(Order.tracking_code == code))
    if not o:
        raise HTTPException(404, "سفارش پیدا نشد")
    st = payment_status(o)
    if st == "none":
        raise HTTPException(409, "هزینه‌ی این سفارش هنوز تعیین نشده است")
    if st == "paid":
        raise HTTPException(409, "این سفارش قبلاً پرداخت شده است")
    try:
        started = await payments.start(
            amount=o.price_amount,
            currency=o.price_currency,
            description=f"سفارش {o.product_type.name} ({o.tracking_code})",
            email=o.customer_email,
            callback_url=f"{settings.public_api_url.rstrip('/')}/api/payments/callback",
        )
    except payments.PaymentError:
        raise HTTPException(502, "ارتباط با درگاه پرداخت برقرار نشد")
    db.add(Payment(
        order_id=o.id, provider=settings.payment_provider, authority=started.authority,
        amount=o.price_amount, currency=o.price_currency, status="pending",
    ))
    db.commit()
    return PayOut(redirect_url=started.redirect_url)


@router.get("/payments/callback")
async def payment_callback(
    authority: str = Query("", alias="Authority"),
    status: str = Query("", alias="Status"),
    db: Session = Depends(get_db),
):
    """The gateway sends the customer's browser here. Amount/order always come from OUR database."""
    p = db.scalar(select(Payment).where(Payment.authority == authority).with_for_update()) if authority else None
    if not p:
        return RedirectResponse(_site("/track?paid=0"), status_code=303)
    o = p.order
    base = f"/track?code={o.tracking_code}"

    if p.status == "paid":  # idempotent: user refreshed the callback
        return RedirectResponse(_site(f"{base}&paid=1"), status_code=303)
    if status != "OK":
        p.status = "failed"
        db.commit()
        return RedirectResponse(_site(f"{base}&paid=0"), status_code=303)
    try:
        ref = await payments.verify(authority=p.authority, amount=p.amount, currency=p.currency)
    except payments.PaymentError:
        p.status = "failed"
        db.commit()
        return RedirectResponse(_site(f"{base}&paid=0"), status_code=303)

    now = datetime.now(timezone.utc)
    p.status, p.ref_id, p.paid_at = "paid", ref, now
    o.paid_at = now
    db.commit()
    tasks = BackgroundTasks()
    tasks.add_task(notify.order_paid, notify.order_payload(o, o.product_type.name, o.product_type.slug))
    return RedirectResponse(_site(f"{base}&paid=1"), status_code=303, background=tasks)
