import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..config import settings
from ..models import ContactMessage, Order, OrderField, ProductType, payment_status
from ..schemas import ContactIn, OrderCreated, OrderIn, OrderTrack, ProductTypeOut
from ..services import notify, payments, ratelimit
from ..validation import validate_fields

router = APIRouter(prefix="/api", tags=["public"])


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() or (request.client.host if request.client else "unknown")


@router.get("/product-types", response_model=list[ProductTypeOut])
def list_product_types(db: Session = Depends(get_db)):
    return db.scalars(select(ProductType).where(ProductType.is_active).order_by(ProductType.id)).all()


@router.get("/product-types/{slug}", response_model=ProductTypeOut)
def get_product_type(slug: str, db: Session = Depends(get_db)):
    pt = db.scalar(select(ProductType).where(ProductType.slug == slug, ProductType.is_active))
    if not pt:
        raise HTTPException(404, "محصول پیدا نشد")
    return pt


@router.post("/orders", response_model=OrderCreated, status_code=201)
def create_order(body: OrderIn, request: Request, background: BackgroundTasks, db: Session = Depends(get_db)):
    if not ratelimit.allow(f"order:{client_ip(request)}", settings.rate_limit_orders_per_hour):
        raise HTTPException(429, "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.")
    pt = db.scalar(select(ProductType).where(ProductType.slug == body.product_type_slug, ProductType.is_active))
    if not pt:
        raise HTTPException(404, "محصول پیدا نشد")
    clean, errors = validate_fields(pt.schema_json, body.fields)
    if errors:
        raise HTTPException(422, detail=errors)
    order = Order(
        tracking_code=secrets.token_urlsafe(9),
        product_type_id=pt.id,
        customer_name=body.customer_name,
        customer_email=str(body.customer_email),
    )
    order.fields = [OrderField(key=k, value=v) for k, v in clean.items()]
    db.add(order)
    db.commit()
    background.add_task(notify.order_created, notify.order_payload(order, pt.name, pt.slug))
    return OrderCreated(tracking_code=order.tracking_code)


@router.get("/orders/track/{code}", response_model=OrderTrack)
def track_order(code: str, db: Session = Depends(get_db)):
    o = db.scalar(select(Order).where(Order.tracking_code == code))
    if not o:
        raise HTTPException(404, "سفارش پیدا نشد")
    return OrderTrack(
        tracking_code=o.tracking_code,
        status=o.status,
        product_name=o.product_type.name,
        created_at=o.created_at,
        price_amount=o.price_amount,
        price_currency=o.price_currency or "IRT",
        payment_status=payment_status(o),
        payment_enabled=payments.enabled(),
    )


@router.post("/contact", status_code=201)
def contact(body: ContactIn, request: Request, background: BackgroundTasks, db: Session = Depends(get_db)):
    if body.website:  # honeypot tripped: pretend success, store nothing
        return {"ok": True}
    if not ratelimit.allow(f"contact:{client_ip(request)}", settings.rate_limit_contact_per_hour):
        raise HTTPException(429, "تعداد پیام‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.")
    m = ContactMessage(name=body.name.strip(), email=str(body.email), subject=body.subject.strip(), message=body.message.strip())
    db.add(m)
    db.commit()
    background.add_task(notify.contact_created, {"name": m.name, "email": m.email, "subject": m.subject, "message": m.message})
    return {"ok": True}
