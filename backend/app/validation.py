"""Validate submitted order fields against a ProductType.schema_json.

schema_json format:
{"fields": [{"name": "software", "label": "...", "type": "select|text|textarea|number|date|boolean",
             "required": true, "options": ["SPSS", "R"]}]}
"""
from datetime import date
from typing import Any

ALLOWED_TYPES = {"text", "textarea", "number", "date", "boolean", "select"}


def validate_fields(schema: dict, values: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    errors: list[str] = []
    clean: dict[str, Any] = {}
    defs = {f["name"]: f for f in schema.get("fields", [])}

    for name in values:
        if name not in defs:
            errors.append(f"فیلد ناشناخته: {name}")

    for name, f in defs.items():
        label = f.get("label", name)
        v = values.get(name)
        empty = v is None or v == "" or v == []
        if empty:
            if f.get("required"):
                errors.append(f"«{label}» الزامی است")
            continue
        t = f.get("type", "text")
        if t in ("text", "textarea"):
            if not isinstance(v, str):
                errors.append(f"«{label}» باید متن باشد")
                continue
            if len(v) > 5000:
                errors.append(f"«{label}» بیش از حد طولانی است")
                continue
        elif t == "number":
            if isinstance(v, bool) or not isinstance(v, (int, float)):
                errors.append(f"«{label}» باید عدد باشد")
                continue
        elif t == "boolean":
            if not isinstance(v, bool):
                errors.append(f"«{label}» باید بله/خیر باشد")
                continue
        elif t == "date":
            try:
                date.fromisoformat(str(v))
            except ValueError:
                errors.append(f"«{label}» تاریخ معتبر نیست (YYYY-MM-DD)")
                continue
        elif t == "select":
            if v not in f.get("options", []):
                errors.append(f"«{label}» مقدار مجاز نیست")
                continue
        clean[name] = v
    return clean, errors


import re  # noqa: E402

_NAME_RE = re.compile(r"^[a-z][a-z0-9_]{0,39}$")


def validate_schema(schema: dict) -> tuple[dict, list[str]]:
    """Validate + normalise a ProductType.schema_json. Returns (clean_schema, errors)."""
    errors: list[str] = []
    fields = schema.get("fields") if isinstance(schema, dict) else None
    if not isinstance(fields, list) or not fields:
        return {"fields": []}, ["حداقل یک فیلد لازم است"]
    if len(fields) > 30:
        errors.append("حداکثر ۳۰ فیلد مجاز است")
    clean, seen = [], set()
    for i, f in enumerate(fields[:30], 1):
        if not isinstance(f, dict):
            errors.append(f"فیلد {i}: ساختار نامعتبر")
            continue
        name, label, ftype = f.get("name"), f.get("label"), f.get("type", "text")
        if not isinstance(name, str) or not _NAME_RE.match(name):
            errors.append(f"فیلد {i}: نام باید انگلیسی کوچک/عدد/underscore و با حرف شروع شود")
            continue
        if name in seen:
            errors.append(f"نام تکراری: {name}")
            continue
        seen.add(name)
        if not isinstance(label, str) or not (1 <= len(label.strip()) <= 120):
            errors.append(f"«{name}»: برچسب لازم است")
            continue
        if ftype not in ALLOWED_TYPES:
            errors.append(f"«{name}»: نوع نامعتبر")
            continue
        item = {"name": name, "label": label.strip(), "type": ftype, "required": bool(f.get("required", False))}
        if ftype == "select":
            opts = f.get("options")
            if not isinstance(opts, list) or not opts or len(opts) > 30:
                errors.append(f"«{name}»: بین ۱ تا ۳۰ گزینه لازم است")
                continue
            opts = [o.strip() for o in opts if isinstance(o, str) and o.strip()]
            if not opts or len(set(opts)) != len(opts) or any(len(o) > 80 for o in opts):
                errors.append(f"«{name}»: گزینه‌ها باید غیرخالی، یکتا و کوتاه باشند")
                continue
            item["options"] = opts
        clean.append(item)
    return {"fields": clean}, errors
