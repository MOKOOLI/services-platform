"""Product-type admin, file uploads, payments."""
import asyncio

import pytest

from test_api import ADMIN, TestSession, client  # noqa: F401  (shares the in-memory app/DB)

from app.config import settings
from app.services import notify, payments, storage


def new_order(slug="statistical-analysis", fields=None):
    fields = fields or {"software": "R", "analysis_type": "t-test", "deadline": "2027-01-10"}
    r = client.post("/api/orders", json={"product_type_slug": slug, "customer_name": "Maryam",
                                         "customer_email": "m@x.com", "fields": fields})
    assert r.status_code == 201, r.text
    code = r.json()["tracking_code"]
    oid = next(o["id"] for o in client.get("/api/admin/orders", headers=ADMIN).json() if o["tracking_code"] == code)
    return code, oid


@pytest.fixture(autouse=True)
def capture_notifications(monkeypatch):
    log = []

    async def email(to, subject, html):
        log.append(("email", subject))
        return True

    async def hook(event, payload):
        log.append(("hook", event))
        return True

    monkeypatch.setattr(notify, "send_email", email)
    monkeypatch.setattr(notify, "post_webhook", hook)
    return log


# ---------------- product types ----------------
def test_product_type_schema_validation_and_crud():
    def put(schema, slug="my-service", **kw):
        return client.put("/api/admin/product-types", headers=ADMIN,
                          json={"slug": slug, "name": "خدمت", "category": "technical", "schema_json": schema, **kw})

    assert put({"fields": []}).status_code == 422
    bad = put({"fields": [{"name": "Bad Name", "label": "x", "type": "text"},
                          {"name": "pick", "label": "y", "type": "select"},
                          {"name": "ok", "label": "z", "type": "text"},
                          {"name": "ok", "label": "z", "type": "text"}]})
    assert bad.status_code == 422 and len(bad.json()["detail"]) == 3

    good = put({"fields": [{"name": "kind", "label": "نوع", "type": "select", "required": True,
                            "options": [" A ", "B"], "junk": 1}]})
    assert good.status_code == 200
    assert good.json()["schema_json"]["fields"][0] == {
        "name": "kind", "label": "نوع", "type": "select", "required": True, "options": ["A", "B"]}

    # deactivate -> hidden from public list but visible to admin
    put({"fields": [{"name": "a", "label": "a", "type": "text"}]}, is_active=False)
    assert "my-service" not in [p["slug"] for p in client.get("/api/product-types").json()]
    admin_list = client.get("/api/admin/product-types", headers=ADMIN).json()
    assert next(p for p in admin_list if p["slug"] == "my-service")["is_active"] is False
    assert client.get("/api/admin/product-types").status_code == 403


# ---------------- files ----------------
@pytest.fixture
def fake_storage(monkeypatch):
    objects: dict[str, int] = {}
    monkeypatch.setattr(storage, "enabled", lambda: True)
    monkeypatch.setattr(storage, "presign_put", lambda key, ct, expires=600: f"https://s3.test/{key}?put")
    monkeypatch.setattr(storage, "presign_get", lambda key, name, expires=300: f"https://s3.test/{key}?get&n={name}")
    monkeypatch.setattr(storage, "head", lambda key: objects.get(key))
    monkeypatch.setattr(storage, "delete", lambda key: objects.pop(key, None))
    return objects


def key_of(url):
    return url.split("s3.test/")[1].split("?")[0]


def test_customer_upload_flow_and_limits(fake_storage, capture_notifications):
    code, _ = new_order()
    base = f"/api/orders/track/{code}/files"

    assert client.post(base, json={"filename": "evil.exe", "size": 10}).status_code == 422
    assert client.post(base, json={"filename": "big.zip", "size": 999 * 1024 * 1024}).status_code == 422

    r = client.post(base, json={"filename": "داده.csv", "content_type": "text/csv", "size": 1234, "kind": "deliverable"})
    assert r.status_code == 201
    up = r.json()
    key = key_of(up["upload_url"])
    assert "/attachment/" in key  # customer-supplied kind is ignored

    # not uploaded yet
    assert client.post(f"{base}/{up['file_id']}/complete").status_code == 409
    fake_storage[key] = 1234
    done = client.post(f"{base}/{up['file_id']}/complete")
    assert done.status_code == 200 and done.json()["filename"] == "داده.csv"
    assert ("hook", "order.file_uploaded") in capture_notifications

    listed = client.get(base).json()
    assert [f["id"] for f in listed] == [up["file_id"]]
    dl = client.get(f"{base}/{up['file_id']}/download").json()["url"]
    assert key in dl

    # size mismatch -> rejected and object removed
    r2 = client.post(base, json={"filename": "a.pdf", "size": 100}).json()
    fake_storage[key_of(r2["upload_url"])] = 999
    assert client.post(f"{base}/{r2['file_id']}/complete").status_code == 422
    assert key_of(r2["upload_url"]) not in fake_storage

    # other order's code cannot touch this file
    other, _ = new_order()
    assert client.get(f"/api/orders/track/{other}/files/{up['file_id']}/download").status_code == 404


def test_no_uploads_after_delivery(fake_storage):
    code, oid = new_order()
    client.patch(f"/api/admin/orders/{oid}/status", json={"status": "delivered"}, headers=ADMIN)
    assert client.post(f"/api/orders/track/{code}/files", json={"filename": "a.pdf", "size": 5}).status_code == 409


def test_deliverable_locked_until_paid(fake_storage):
    code, oid = new_order()
    # admin uploads a deliverable
    up = client.post(f"/api/admin/orders/{oid}/files", headers=ADMIN,
                     json={"filename": "result.docx", "size": 50, "kind": "deliverable"}).json()
    fake_storage[key_of(up["upload_url"])] = 50
    assert client.post(f"/api/admin/orders/{oid}/files/{up['file_id']}/complete", headers=ADMIN).status_code == 200
    url = f"/api/orders/track/{code}/files/{up['file_id']}/download"

    assert client.get(url).status_code == 200  # no price -> not locked

    client.patch(f"/api/admin/orders/{oid}/price", json={"amount": 500000}, headers=ADMIN)
    assert client.get(f"/api/orders/track/{code}/files").json()[0]["locked"] is True
    assert client.get(url).status_code == 402  # quoted but unpaid

    client.post(f"/api/admin/orders/{oid}/mark-paid", headers=ADMIN)
    assert client.get(url).status_code == 200

    # admin can download anything and delete
    assert "get" in client.get(f"/api/admin/files/{up['file_id']}/download", headers=ADMIN).json()["url"]
    assert client.delete(f"/api/admin/files/{up['file_id']}", headers=ADMIN).status_code == 204
    assert client.get(url).status_code == 404


# ---------------- payments ----------------
def test_payment_flow_mock(monkeypatch, capture_notifications):
    monkeypatch.setattr(settings, "payment_provider", "mock")
    code, oid = new_order()

    assert client.post(f"/api/orders/track/{code}/pay").status_code == 409  # no quote yet
    r = client.patch(f"/api/admin/orders/{oid}/price", json={"amount": 250000, "currency": "IRT"}, headers=ADMIN)
    assert r.json()["payment_status"] == "unpaid"
    assert ("hook", "order.quoted") in capture_notifications

    t = client.get(f"/api/orders/track/{code}").json()
    assert t["payment_status"] == "unpaid" and t["price_amount"] == 250000 and t["payment_enabled"] is True

    redirect = client.post(f"/api/orders/track/{code}/pay").json()["redirect_url"]
    path = redirect.replace(settings.public_api_url, "")
    cb = client.get(path, follow_redirects=False)
    assert cb.status_code == 303 and cb.headers["location"].endswith(f"/track?code={code}&paid=1")
    assert client.get(f"/api/orders/track/{code}").json()["payment_status"] == "paid"
    assert capture_notifications.count(("hook", "order.paid")) == 1

    # refresh of the callback is idempotent
    assert client.get(path, follow_redirects=False).headers["location"].endswith("paid=1")
    assert capture_notifications.count(("hook", "order.paid")) == 1

    assert client.post(f"/api/orders/track/{code}/pay").status_code == 409  # already paid
    assert client.patch(f"/api/admin/orders/{oid}/price", json={"amount": 1}, headers=ADMIN).status_code == 409


def test_callback_failure_paths(monkeypatch):
    monkeypatch.setattr(settings, "payment_provider", "mock")
    code, oid = new_order()
    client.patch(f"/api/admin/orders/{oid}/price", json={"amount": 100000}, headers=ADMIN)
    redirect = client.post(f"/api/orders/track/{code}/pay").json()["redirect_url"]
    authority = redirect.split("Authority=")[1].split("&")[0]

    unknown = client.get("/api/payments/callback?Authority=NOPE&Status=OK", follow_redirects=False)
    assert unknown.headers["location"].endswith("paid=0")
    cancelled = client.get(f"/api/payments/callback?Authority={authority}&Status=NOK", follow_redirects=False)
    assert cancelled.headers["location"].endswith("paid=0")
    assert client.get(f"/api/orders/track/{code}").json()["payment_status"] == "unpaid"


def test_mock_provider_refused_in_production(monkeypatch):
    monkeypatch.setattr(settings, "payment_provider", "mock")
    monkeypatch.setattr(settings, "app_env", "production")
    assert payments.enabled() is False
    code, oid = new_order()
    client.patch(f"/api/admin/orders/{oid}/price", json={"amount": 100000}, headers=ADMIN)
    assert client.post(f"/api/orders/track/{code}/pay").status_code == 503


def test_zarinpal_provider(monkeypatch):
    monkeypatch.setattr(settings, "payment_provider", "zarinpal")
    monkeypatch.setattr(settings, "zarinpal_merchant_id", "11111111-2222-3333-4444-555555555555")
    calls = []
    replies = []

    async def fake_post(url, payload):
        calls.append((url, payload))
        return replies.pop(0)

    monkeypatch.setattr(payments, "_post_json", fake_post)

    replies.append({"data": {"code": 100, "authority": "A0000001"}, "errors": []})
    s = asyncio.run(payments.start(amount=50000, currency="IRT", description="d", email="a@b.c",
                                   callback_url="https://api.x/cb"))
    assert s.redirect_url == "https://www.zarinpal.com/pg/StartPay/A0000001"
    url, payload = calls[0]
    assert url == "https://payment.zarinpal.com/pg/v4/payment/request.json"
    assert payload["amount"] == 500000 and payload["callback_url"] == "https://api.x/cb"  # toman -> rial

    monkeypatch.setattr(settings, "zarinpal_sandbox", True)
    replies.append({"data": {"code": 100, "authority": "A2"}, "errors": []})
    s = asyncio.run(payments.start(amount=1, currency="IRR", description="d", email="a@b.c", callback_url="u"))
    assert s.redirect_url == "https://sandbox.zarinpal.com/pg/StartPay/A2" and calls[-1][1]["amount"] == 1

    replies.append({"data": [], "errors": {"code": -9, "message": "bad"}})
    with pytest.raises(payments.PaymentError):
        asyncio.run(payments.start(amount=1, currency="IRT", description="d", email="e", callback_url="u"))

    replies.append({"data": {"code": 100, "ref_id": 777}, "errors": []})
    assert asyncio.run(payments.verify(authority="A1", amount=50000, currency="IRT")) == "777"
    assert calls[-1][1]["amount"] == 500000
    replies.append({"data": {"code": 101, "ref_id": 777}, "errors": []})
    assert asyncio.run(payments.verify(authority="A1", amount=1, currency="IRT")) == "777"
    replies.append({"data": [], "errors": {"code": -51, "message": "failed"}})
    with pytest.raises(payments.PaymentError):
        asyncio.run(payments.verify(authority="A1", amount=1, currency="IRT"))


def test_manual_payment_requires_quote():
    code, oid = new_order()
    assert client.post(f"/api/admin/orders/{oid}/mark-paid", headers=ADMIN).status_code == 409
