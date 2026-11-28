import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import SessionLocal, get_db
from ..models import ORDER_STATUSES, ContactMessage, Order, OrderFile, Payment, ProductType, payment_status
from ..schemas import (
    ContactAdminOut, DownloadOut, FileCreateIn, HandledIn, FileOut, FileUploadOut, OrderAdminOut, PriceIn,
    ProductTypeAdminOut, ProductTypeIn, ProductTypeOut, StatusIn,
)
from ..services import notify, ollama, storage
from ..validation import validate_schema
from . import files as files_router

LONG_MODEL_SLUGS = {"proposal", "thesis"}


def require_admin(x_admin_key: str = Header(default="")):
    if not settings.admin_api_key:
        raise HTTPException(503, "ADMIN_API_KEY تنظیم نشده است")
    if not secrets.compare_digest(x_admin_key, settings.admin_api_key):
        raise HTTPException(403, "دسترسی غیرمجاز")


router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _out(o: Order) -> OrderAdminOut:
    return OrderAdminOut(
        id=o.id,
        tracking_code=o.tracking_code,
        product_type=o.product_type.name,
        customer_name=o.customer_name,
        customer_email=o.customer_email,
        status=o.status,
        fields={f.key: f.value for f in o.fields},
        ai_draft=o.ai_draft,
        ai_status=o.ai_status,
        price_amount=o.price_amount,
        price_currency=o.price_currency or "IRT",
        payment_status=payment_status(o),
        files=[FileOut.model_validate(f) for f in o.files if f.status == "uploaded"],
        created_at=o.created_at,
    )


def _payload(o: Order) -> dict:
    return notify.order_payload(o, o.product_type.name, o.product_type.slug)


def _get_order(db: Session, order_id: int) -> Order:
    o = db.get(Order, order_id)
    if not o:
        raise HTTPException(404, "سفارش پیدا نشد")
    return o


# ---------------- orders ----------------
@router.get("/orders", response_model=list[OrderAdminOut])
def list_orders(status: str | None = None, db: Session = Depends(get_db)):
    q = select(Order).order_by(Order.id.desc()).limit(200)
    if status:
        q = q.where(Order.status == status)
    return [_out(o) for o in db.scalars(q).all()]


@router.patch("/orders/{order_id}/status", response_model=OrderAdminOut)
def set_status(order_id: int, body: StatusIn, background: BackgroundTasks, db: Session = Depends(get_db)):
    if body.status not in ORDER_STATUSES:
        raise HTTPException(422, f"وضعیت مجاز: {', '.join(ORDER_STATUSES)}")
    o = _get_order(db, order_id)
    changed = o.status != body.status
    o.status = body.status
    db.commit()
    if changed:
        background.add_task(notify.order_status_changed, _payload(o))
    return _out(o)


@router.patch("/orders/{order_id}/price", response_model=OrderAdminOut)
def set_price(order_id: int, body: PriceIn, background: BackgroundTasks, db: Session = Depends(get_db)):
    o = _get_order(db, order_id)
    if o.paid_at:
        raise HTTPException(409, "سفارش پرداخت شده است؛ مبلغ قابل تغییر نیست")
    o.price_amount, o.price_currency = body.amount, body.currency
    db.commit()
    background.add_task(notify.order_quoted, _payload(o))
    return _out(o)


@router.post("/orders/{order_id}/mark-paid", response_model=OrderAdminOut)
def mark_paid(order_id: int, background: BackgroundTasks, db: Session = Depends(get_db)):
    """For bank-transfer / card-to-card payments confirmed by a human."""
    o = _get_order(db, order_id)
    if o.price_amount is None:
        raise HTTPException(409, "ابتدا مبلغ را تعیین کنید")
    if o.paid_at:
        return _out(o)
    now = datetime.now(timezone.utc)
    o.paid_at = now
    db.add(Payment(
        order_id=o.id, provider="manual", authority=f"manual-{uuid.uuid4().hex}",
        amount=o.price_amount, currency=o.price_currency, status="paid", paid_at=now,
    ))
    db.commit()
    background.add_task(notify.order_paid, _payload(o))
    return _out(o)


# ---------------- contact messages ----------------
@router.get("/messages", response_model=list[ContactAdminOut])
def list_messages(db: Session = Depends(get_db)):
    return db.scalars(select(ContactMessage).order_by(ContactMessage.id.desc()).limit(200)).all()


@router.patch("/messages/{message_id}", response_model=ContactAdminOut)
def set_message_handled(message_id: int, body: HandledIn, db: Session = Depends(get_db)):
    m = db.get(ContactMessage, message_id)
    if not m:
        raise HTTPException(404, "پیام پیدا نشد")
    m.handled = body.handled
    db.commit()
    return m


# ---------------- product types ----------------
@router.get("/product-types", response_model=list[ProductTypeAdminOut])
def list_product_types(db: Session = Depends(get_db)):
    return db.scalars(select(ProductType).order_by(ProductType.id)).all()


@router.put("/product-types", response_model=ProductTypeOut)
def upsert_product_type(body: ProductTypeIn, db: Session = Depends(get_db)):
    schema, errors = validate_schema(body.schema_json)
    if errors:
        raise HTTPException(422, detail=errors)
    data = body.model_dump()
    data["schema_json"] = schema
    pt = db.scalar(select(ProductType).where(ProductType.slug == body.slug))
    if pt:
        for k, v in data.items():
            setattr(pt, k, v)
    else:
        pt = ProductType(**data)
        db.add(pt)
    db.commit()
    return pt


# ---------------- files ----------------
@router.get("/orders/{order_id}/files", response_model=list[FileOut])
def list_files(order_id: int, db: Session = Depends(get_db)):
    o = _get_order(db, order_id)
    return [FileOut.model_validate(f) for f in o.files if f.status == "uploaded"]


@router.post("/orders/{order_id}/files", response_model=FileUploadOut, status_code=201)
def create_upload(order_id: int, body: FileCreateIn, db: Session = Depends(get_db)):
    o = _get_order(db, order_id)
    return files_router.begin_upload(db, o, body, body.kind, "admin")


@router.post("/orders/{order_id}/files/{file_id}/complete", response_model=FileOut)
def complete_upload(order_id: int, file_id: int, db: Session = Depends(get_db)):
    o = _get_order(db, order_id)
    f = db.get(OrderFile, file_id)
    if not f or f.order_id != o.id:
        raise HTTPException(404, "فایل پیدا نشد")
    files_router.finish_upload(db, f)
    return FileOut.model_validate(f)


@router.get("/files/{file_id}/download", response_model=DownloadOut)
def download_file(file_id: int, db: Session = Depends(get_db)):
    f = db.get(OrderFile, file_id)
    if not f or f.status != "uploaded":
        raise HTTPException(404, "فایل پیدا نشد")
    return DownloadOut(url=storage.presign_get(f.storage_key, f.filename))


@router.delete("/files/{file_id}", status_code=204)
def delete_file(file_id: int, db: Session = Depends(get_db)):
    f = db.get(OrderFile, file_id)
    if not f:
        raise HTTPException(404, "فایل پیدا نشد")
    if storage.enabled():
        storage.delete(f.storage_key)
    db.delete(f)
    db.commit()


# ---------------- AI draft (background) ----------------
async def run_ai_draft(order_id: int) -> None:
    """Background job. Generates a DRAFT only; a human reviews everything before delivery."""
    with SessionLocal() as db:
        o = db.get(Order, order_id)
        if not o:
            return
        details = "\n".join(f"- {f.key}: {f.value}" for f in o.fields)
        prompt = (
            f"محصول: {o.product_type.name}\nجزئیات سفارش:\n{details}\n\n"
            "یک پیش‌نویس ساختاریافته و مرحله‌به‌مرحله برای انجام این سفارش بنویس "
            "(ساختار، مراحل کار، ریسک‌ها و چک‌لیست تحویل). فقط پیش‌نویس است."
        )
        model = (
            settings.ollama_model_long if o.product_type.slug in LONG_MODEL_SLUGS else settings.ollama_model_default
        )
    # DB session is closed while waiting on the (slow) model.
    try:
        text = await ollama.generate(prompt, model=model, system="You are a careful assistant. Answer in Persian.")
        result = ("done", text)
    except ollama.OllamaUnavailable:
        result = ("failed", None)
    with SessionLocal() as db:
        o = db.get(Order, order_id)
        if o:
            o.ai_status = result[0]
            if result[1] is not None:
                o.ai_draft = result[1]
            db.commit()


@router.post("/orders/{order_id}/ai-draft", response_model=OrderAdminOut, status_code=202)
def ai_draft(order_id: int, background: BackgroundTasks, db: Session = Depends(get_db)):
    """Starts draft generation in the background; poll GET /orders for ai_status."""
    o = _get_order(db, order_id)
    o.ai_status = "running"
    db.commit()
    background.add_task(run_ai_draft, order_id)
    return _out(o)
