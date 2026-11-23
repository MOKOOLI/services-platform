from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import admin, files, payments, public

app = FastAPI(title="Services Platform API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_methods=["GET", "POST", "PUT", "PATCH"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)

app.include_router(public.router)
app.include_router(files.router)
app.include_router(payments.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
