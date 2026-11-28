import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ADMIN_API_KEY"] = "test-key"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import models, seed  # noqa: E402,F401
from app.config import settings as _settings  # noqa: E402

_settings.rate_limit_orders_per_hour = 10_000  # suites create many orders from one test IP
from app.db import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestSession = sessionmaker(bind=engine, expire_on_commit=False)
Base.metadata.create_all(engine)
seed.SessionLocal = TestSession
seed.run()


def override():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override
client = TestClient(app)
ADMIN = {"X-Admin-Key": "test-key"}


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_list_and_get_product_types():
    r = client.get("/api/product-types")
    assert r.status_code == 200 and len(r.json()) == 2
    assert client.get("/api/product-types/statistical-analysis").status_code == 200
    assert client.get("/api/product-types/nope").status_code == 404


def test_order_validation_and_tracking():
    bad = client.post("/api/orders", json={
        "product_type_slug": "statistical-analysis", "customer_name": "Ali", "customer_email": "a@b.com",
        "fields": {"software": "Excel"}})
    assert bad.status_code == 422

    ok = client.post("/api/orders", json={
        "product_type_slug": "statistical-analysis", "customer_name": "Ali", "customer_email": "a@b.com",
        "fields": {"software": "SPSS", "analysis_type": "ANOVA", "deadline": "2026-12-30"}})
    assert ok.status_code == 201
    code = ok.json()["tracking_code"]
    t = client.get(f"/api/orders/track/{code}")
    assert t.json()["status"] == "new"


def test_admin_requires_key_and_updates_status():
    assert client.get("/api/admin/orders").status_code == 403
    orders = client.get("/api/admin/orders", headers=ADMIN).json()
    assert orders
    oid = orders[0]["id"]
    assert client.patch(f"/api/admin/orders/{oid}/status", json={"status": "bogus"}, headers=ADMIN).status_code == 422
    r = client.patch(f"/api/admin/orders/{oid}/status", json={"status": "in_progress"}, headers=ADMIN)
    assert r.json()["status"] == "in_progress"


# ---------- notifications / async AI ----------
from app.routers import admin as admin_router  # noqa: E402
from app.services import notify, ollama  # noqa: E402

sent: list = []
hooks: list = []


async def fake_email(to, subject, html):
    sent.append((to, subject, html))
    return True


async def fake_hook(event, payload):
    hooks.append((event, payload))
    return True


def test_notifications_on_create_and_status_change(monkeypatch):
    monkeypatch.setattr(notify, "send_email", fake_email)
    monkeypatch.setattr(notify, "post_webhook", fake_hook)
    sent.clear(); hooks.clear()

    r = client.post("/api/orders", json={
        "product_type_slug": "data-science-ml", "customer_name": "<b>Sara</b>", "customer_email": "s@x.com",
        "fields": {"project_kind": "NLP", "dataset": "tweets"}})
    code = r.json()["tracking_code"]
    assert sent[0][0] == "s@x.com" and code in sent[0][2]
    assert "<b>Sara</b>" not in sent[0][2]  # customer name is HTML-escaped
    assert hooks[0][0] == "order.created" and hooks[0][1]["product_slug"] == "data-science-ml"

    oid = next(o["id"] for o in client.get("/api/admin/orders", headers=ADMIN).json() if o["tracking_code"] == code)
    client.patch(f"/api/admin/orders/{oid}/status", json={"status": "delivered"}, headers=ADMIN)
    assert hooks[-1][0] == "order.status_changed" and hooks[-1][1]["status"] == "delivered"
    n = len(hooks)
    client.patch(f"/api/admin/orders/{oid}/status", json={"status": "delivered"}, headers=ADMIN)
    assert len(hooks) == n  # unchanged status -> no notification


def test_notify_is_noop_without_config():
    import asyncio
    assert asyncio.run(notify.send_email("a@b.com", "s", "h")) is False
    assert asyncio.run(notify.post_webhook("e", {})) is False


def test_ai_draft_background(monkeypatch):
    monkeypatch.setattr(admin_router, "SessionLocal", TestSession)

    async def ok(prompt, **kw):
        return "DRAFT TEXT"

    monkeypatch.setattr(ollama, "generate", ok)
    oid = client.get("/api/admin/orders", headers=ADMIN).json()[0]["id"]
    r = client.post(f"/api/admin/orders/{oid}/ai-draft", headers=ADMIN)
    assert r.status_code == 202 and r.json()["ai_status"] == "running"
    done = next(o for o in client.get("/api/admin/orders", headers=ADMIN).json() if o["id"] == oid)
    assert done["ai_status"] == "done" and done["ai_draft"] == "DRAFT TEXT"

    async def down(prompt, **kw):
        raise ollama.OllamaUnavailable("down")

    monkeypatch.setattr(ollama, "generate", down)
    client.post(f"/api/admin/orders/{oid}/ai-draft", headers=ADMIN)
    failed = next(o for o in client.get("/api/admin/orders", headers=ADMIN).json() if o["id"] == oid)
    assert failed["ai_status"] == "failed" and failed["ai_draft"] == "DRAFT TEXT"  # previous draft kept
