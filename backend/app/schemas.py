from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProductTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    name: str
    category: str
    description: str
    schema_json: dict


class ProductTypeIn(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9-]{2,80}$")
    name: str
    category: str = Field(pattern=r"^(academic|technical)$")
    description: str = ""
    schema_json: dict
    is_active: bool = True


class OrderIn(BaseModel):
    product_type_slug: str
    customer_name: str = Field(min_length=2, max_length=160)
    customer_email: EmailStr
    fields: dict[str, Any] = {}


class OrderCreated(BaseModel):
    tracking_code: str


class OrderTrack(BaseModel):
    tracking_code: str
    status: str
    product_name: str
    created_at: datetime
    price_amount: int | None = None
    price_currency: str = "IRT"
    payment_status: str = "none"       # none | unpaid | paid
    payment_enabled: bool = False


class PayOut(BaseModel):
    redirect_url: str


class PriceIn(BaseModel):
    amount: int = Field(gt=0, le=10_000_000_000)
    currency: Literal["IRT", "IRR"] = "IRT"


class FileCreateIn(BaseModel):
    filename: str = Field(min_length=1, max_length=200)
    content_type: str = Field(default="application/octet-stream", max_length=100)
    size: int = Field(gt=0)
    kind: Literal["attachment", "deliverable"] = "attachment"


class FileUploadOut(BaseModel):
    file_id: int
    upload_url: str
    headers: dict[str, str]


class FileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    kind: str
    filename: str
    size: int
    uploaded_by: str
    created_at: datetime
    locked: bool = False


class DownloadOut(BaseModel):
    url: str


class ProductTypeAdminOut(ProductTypeOut):
    is_active: bool


class OrderAdminOut(BaseModel):
    id: int
    tracking_code: str
    product_type: str
    customer_name: str
    customer_email: str
    status: str
    fields: dict[str, Any]
    ai_draft: str | None
    ai_status: str | None
    price_amount: int | None
    price_currency: str
    payment_status: str
    files: list[FileOut]
    created_at: datetime


class StatusIn(BaseModel):
    status: str


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    subject: str = Field(default="", max_length=160)
    message: str = Field(min_length=10, max_length=3000)
    website: str = ""  # honeypot: real users never fill this


class ContactAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    subject: str
    message: str
    handled: bool
    created_at: datetime


class HandledIn(BaseModel):
    handled: bool
