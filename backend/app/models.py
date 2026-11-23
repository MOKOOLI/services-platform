from datetime import datetime, timezone

from sqlalchemy import JSON, BigInteger, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

ORDER_STATUSES = ("new", "in_review", "in_progress", "delivered", "cancelled")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ProductType(Base):
    __tablename__ = "product_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(40))  # academic | technical
    description: Mapped[str] = mapped_column(Text, default="")
    schema_json: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    templates: Mapped[list["Template"]] = relationship(back_populates="product_type")


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_type_id: Mapped[int] = mapped_column(ForeignKey("product_types.id"))
    name: Mapped[str] = mapped_column(String(160))
    file_url: Mapped[str] = mapped_column(String(500))
    format: Mapped[str] = mapped_column(String(10))  # docx | pptx

    product_type: Mapped[ProductType] = relationship(back_populates="templates")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    tracking_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    product_type_id: Mapped[int] = mapped_column(ForeignKey("product_types.id"))
    customer_name: Mapped[str] = mapped_column(String(160))
    customer_email: Mapped[str] = mapped_column(String(254))
    status: Mapped[str] = mapped_column(String(20), default="new", index=True)
    deliverable_template_id: Mapped[int | None] = mapped_column(ForeignKey("templates.id"), nullable=True)
    ai_draft: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_status: Mapped[str | None] = mapped_column(String(20), nullable=True)  # running | done | failed
    price_amount: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    price_currency: Mapped[str] = mapped_column(String(3), default="IRT")  # IRT (toman) | IRR (rial)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product_type: Mapped[ProductType] = relationship()
    fields: Mapped[list["OrderField"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    files: Mapped[list["OrderFile"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderField(Base):
    __tablename__ = "order_fields"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(80))
    value: Mapped[dict | list | str | int | float | bool | None] = mapped_column(JSON)

    order: Mapped[Order] = relationship(back_populates="fields")


def payment_status(o: "Order") -> str:
    """none (no quote yet) | unpaid | paid"""
    if o.price_amount is None:
        return "none"
    return "paid" if o.paid_at else "unpaid"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(20))  # zarinpal | mock | manual
    authority: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    amount: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3))
    status: Mapped[str] = mapped_column(String(10), default="pending")  # pending | paid | failed
    ref_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped[Order] = relationship(back_populates="payments")


class OrderFile(Base):
    __tablename__ = "order_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(12))  # attachment | deliverable
    filename: Mapped[str] = mapped_column(String(200))
    content_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(BigInteger)
    storage_key: Mapped[str] = mapped_column(String(400), unique=True)
    status: Mapped[str] = mapped_column(String(10), default="pending")  # pending | uploaded
    uploaded_by: Mapped[str] = mapped_column(String(10))  # customer | admin
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    order: Mapped[Order] = relationship(back_populates="files")
