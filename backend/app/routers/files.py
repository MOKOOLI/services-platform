import re
import uuid
from pathlib import PurePath

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import Order, OrderFile, payment_status
from ..schemas import DownloadOut, FileCreateIn, FileOut, FileUploadOut
from ..services import notify, storage

ALLOWED_EXT = {
    "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "md", "zip", "rar", "7z", "ppt", "pptx",
    "png", "jpg", "jpeg", "json", "ipynb", "py", "r", "sav", "rdata", "sas7bdat", "dta", "tex", "bib",
}

router = APIRouter(prefix="/api/orders/track/{code}/files", tags=["files"])


def _safe(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)[-80:] or "file"


def begin_upload(db: Session, order: Order, body: FileCreateIn, kind: str, uploaded_by: str) -> FileUploadOut:
    if not storage.enabled():
        raise HTTPException(503, "آپلود فایل فعال نیست")
    ext = PurePath(body.filename).suffix.lower().lstrip(".")
    if ext not in ALLOWED_EXT:
        raise HTTPException(422, f"فرمت «.{ext}» مجاز نیست")
    if body.size > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(422, f"حداکثر حجم فایل {settings.max_upload_mb} مگابایت است")
    count = db.scalar(select(func.count()).select_from(OrderFile).where(OrderFile.order_id == order.id, OrderFile.kind == kind))
    if count >= settings.max_files_per_order:
        raise HTTPException(422, "تعداد فایل‌ها به حد مجاز رسیده است")
    key = f"orders/{order.id}/{kind}/{uuid.uuid4().hex}-{_safe(body.filename)}"
    f = OrderFile(
        order_id=order.id, kind=kind, filename=body.filename[:200], content_type=body.content_type,
        size=body.size, storage_key=key, status="pending", uploaded_by=uploaded_by,
    )
    db.add(f)
    db.commit()
    return FileUploadOut(
        file_id=f.id,
        upload_url=storage.presign_put(key, body.content_type),
        headers={"Content-Type": body.content_type},
    )


def finish_upload(db: Session, f: OrderFile) -> OrderFile:
    if f.status == "uploaded":
        return f
    size = storage.head(f.storage_key)
    if size is None:
        raise HTTPException(409, "فایل هنوز آپلود نشده است")
    if size != f.size or size > settings.max_upload_mb * 1024 * 1024:
        storage.delete(f.storage_key)
        db.delete(f)
        db.commit()
        raise HTTPException(422, "حجم فایل آپلودشده با اعلام‌شده مطابقت ندارد")
    f.status = "uploaded"
    db.commit()
    return f


def is_locked(order: Order, f: OrderFile) -> bool:
    """Deliverables stay locked until a quoted order is paid."""
    return f.kind == "deliverable" and payment_status(order) == "unpaid"


def file_out(order: Order, f: OrderFile) -> FileOut:
    out = FileOut.model_validate(f)
    out.locked = is_locked(order, f)
    return out


def _order(db: Session, code: str) -> Order:
    o = db.scalar(select(Order).where(Order.tracking_code == code))
    if not o:
        raise HTTPException(404, "سفارش پیدا نشد")
    return o


def _file(db: Session, order: Order, file_id: int) -> OrderFile:
    f = db.get(OrderFile, file_id)
    if not f or f.order_id != order.id:
        raise HTTPException(404, "فایل پیدا نشد")
    return f


@router.get("", response_model=list[FileOut])
def list_files(code: str, db: Session = Depends(get_db)):
    o = _order(db, code)
    return [file_out(o, f) for f in o.files if f.status == "uploaded"]


@router.post("", response_model=FileUploadOut, status_code=201)
def create_upload(code: str, body: FileCreateIn, db: Session = Depends(get_db)):
    o = _order(db, code)
    if o.status in ("delivered", "cancelled"):
        raise HTTPException(409, "امکان افزودن فایل به این سفارش وجود ندارد")
    # Customers can only add attachments, whatever `kind` they send.
    return begin_upload(db, o, body, "attachment", "customer")


@router.post("/{file_id}/complete", response_model=FileOut)
def complete_upload(code: str, file_id: int, background: BackgroundTasks, db: Session = Depends(get_db)):
    o = _order(db, code)
    f = _file(db, o, file_id)
    if f.uploaded_by != "customer":
        raise HTTPException(403, "دسترسی غیرمجاز")
    was_pending = f.status == "pending"
    finish_upload(db, f)
    if was_pending:
        data = notify.order_payload(o, o.product_type.name, o.product_type.slug)
        data["file"] = {"filename": f.filename, "size": f.size}
        background.add_task(notify.post_webhook, "order.file_uploaded", data)
    return file_out(o, f)


@router.get("/{file_id}/download", response_model=DownloadOut)
def download(code: str, file_id: int, db: Session = Depends(get_db)):
    o = _order(db, code)
    f = _file(db, o, file_id)
    if f.status != "uploaded":
        raise HTTPException(404, "فایل پیدا نشد")
    if is_locked(o, f):
        raise HTTPException(402, "برای دریافت فایل ابتدا هزینه‌ی سفارش را پرداخت کنید")
    return DownloadOut(url=storage.presign_get(f.storage_key, f.filename))
