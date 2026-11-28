import pytest

from test_api import ADMIN, client  # noqa: F401

from app.config import settings
from app.services import notify, ratelimit

VALID = {"name": "Reza", "email": "r@x.com", "subject": "سوال", "message": "سلام، یک سوال درباره‌ی تحلیل واریانس دارم."}


@pytest.fixture(autouse=True)
def clean(monkeypatch):
    ratelimit.reset()
    log = []

    async def email(to, subject, html):
        log.append(("email", to, html))
        return True

    async def hook(event, payload):
        log.append(("hook", event, payload))
        return True

    monkeypatch.setattr(notify, "send_email", email)
    monkeypatch.setattr(notify, "post_webhook", hook)
    return log


def test_contact_stored_notified_and_escaped(clean, monkeypatch):
    monkeypatch.setattr(settings, "admin_email", "boss@x.com")
    r = client.post("/api/contact", json={**VALID, "name": "<b>Reza</b>"}, headers={"X-Forwarded-For": "1.1.1.1"})
    assert r.status_code == 201
    emails = [e for e in clean if e[0] == "email"]
    assert emails and emails[0][1] == "boss@x.com" and "<b>Reza</b>" not in emails[0][2]
    assert any(e[0] == "hook" and e[1] == "contact.created" for e in clean)

    msgs = client.get("/api/admin/messages", headers=ADMIN).json()
    assert msgs[0]["handled"] is False and msgs[0]["subject"] == "سوال"
    done = client.patch(f"/api/admin/messages/{msgs[0]['id']}", json={"handled": True}, headers=ADMIN)
    assert done.json()["handled"] is True
    assert client.get("/api/admin/messages").status_code == 403


def test_contact_validation_honeypot_and_rate_limit(clean):
    h = {"X-Forwarded-For": "2.2.2.2"}
    assert client.post("/api/contact", json={**VALID, "message": "کوتاه"}, headers=h).status_code == 422
    before = len(client.get("/api/admin/messages", headers=ADMIN).json())
    bot = client.post("/api/contact", json={**VALID, "website": "http://spam"}, headers=h)
    assert bot.status_code == 201  # looks successful to the bot...
    assert len(client.get("/api/admin/messages", headers=ADMIN).json()) == before  # ...but nothing stored
    for _ in range(settings.rate_limit_contact_per_hour):
        assert client.post("/api/contact", json=VALID, headers=h).status_code == 201
    assert client.post("/api/contact", json=VALID, headers=h).status_code == 429
    assert client.post("/api/contact", json=VALID, headers={"X-Forwarded-For": "3.3.3.3"}).status_code == 201


def test_order_rate_limit(monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_orders_per_hour", 2)
    body = {"product_type_slug": "data-science-ml", "customer_name": "Ali", "customer_email": "a@x.com",
            "fields": {"project_kind": "NLP", "dataset": "x"}}
    h = {"X-Forwarded-For": "9.9.9.9"}
    assert client.post("/api/orders", json=body, headers=h).status_code == 201
    assert client.post("/api/orders", json=body, headers=h).status_code == 201
    assert client.post("/api/orders", json=body, headers=h).status_code == 429
