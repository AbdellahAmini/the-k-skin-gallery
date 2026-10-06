import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .catalog import import_catalog
from .api import accounts, admin, catalog, commerce


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("AUTO_IMPORT_CATALOG", "0") == "1":
        import_catalog()
    yield


app = FastAPI(title="K-Skin Gallery API", version="0.1.0", lifespan=lifespan)
allowed_origins = [origin.strip() for origin in os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)
app.include_router(catalog.router)
app.include_router(catalog.v1)
app.include_router(commerce.router)
app.include_router(accounts.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/db-status")
def db_status():
    from sqlalchemy import func, select
    from .database import DATABASE_URL, SessionLocal
    from .models import Product
    with SessionLocal() as db:
        total = db.scalar(select(func.count(Product.id)))
        priced = db.scalar(select(func.count(Product.id)).where(Product.price_dh > 0))
        promo = db.scalar(select(func.count(Product.id)).where(Product.compare_at_dh > Product.price_dh))
        return {
            "status": "ok",
            "database": DATABASE_URL.split("@")[-1],
            "total_products": total,
            "priced_products": priced,
            "promo_products": promo,
        }
