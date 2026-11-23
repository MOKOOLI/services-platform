"""Idempotent seed for the two MVP product types."""
from sqlalchemy import select

from .db import SessionLocal
from .models import ProductType

SEEDS = [
    {
        "slug": "statistical-analysis",
        "name": "تحلیل آماری",
        "category": "academic",
        "description": "تحلیل داده‌های پژوهشی با SPSS، R، Python، Stata یا AMOS",
        "schema_json": {
            "fields": [
                {"name": "software", "label": "نرم‌افزار", "type": "select", "required": True,
                 "options": ["SPSS", "R", "Python", "Stata", "AMOS"]},
                {"name": "analysis_type", "label": "نوع تحلیل", "type": "text", "required": True},
                {"name": "data_size", "label": "حجم داده (تعداد ردیف)", "type": "number"},
                {"name": "deadline", "label": "ددلاین", "type": "date", "required": True},
                {"name": "notes", "label": "توضیحات", "type": "textarea"},
            ]
        },
    },
    {
        "slug": "data-science-ml",
        "name": "دیتاساینس / یادگیری ماشین",
        "category": "technical",
        "description": "مدل‌سازی، تحلیل داده و پیاده‌سازی پایپ‌لاین ML",
        "schema_json": {
            "fields": [
                {"name": "project_kind", "label": "نوع پروژه", "type": "select", "required": True,
                 "options": ["پیش‌بینی", "طبقه‌بندی", "خوشه‌بندی", "NLP", "بینایی ماشین", "سایر"]},
                {"name": "dataset", "label": "توضیح دیتاست", "type": "textarea", "required": True},
                {"name": "kpi", "label": "معیار موفقیت (KPI)", "type": "text"},
                {"name": "deadline", "label": "ددلاین", "type": "date"},
            ]
        },
    },
]


def run() -> None:
    with SessionLocal() as db:
        for s in SEEDS:
            if not db.scalar(select(ProductType).where(ProductType.slug == s["slug"])):
                db.add(ProductType(**s))
        db.commit()


if __name__ == "__main__":
    run()
