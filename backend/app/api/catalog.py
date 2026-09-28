from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Article, Brand, Bundle, Category, City, Concern, Promotion, Routine, SiteSetting, SkinType
from ..content import content_public
from ..product_query import ProductFilters, all_active, normal, query_products
from ..services import bundle_public, product_public


router = APIRouter(prefix="/api")
v1 = APIRouter(prefix="/api/v1")


def list_products(db: Session = Depends(get_db), q: str = "", brand: str = "", category: str = "",
                  product_type: str = "", skin_type: str = "", concern: str = "", usage: str = "",
                  availability: str = "", new: bool = False, featured: bool = False,
                  promotion: bool = False, in_stock: bool = False, sort: str = "relevance",
                  min_price: int = Query(0, ge=0), max_price: int = Query(100000, ge=0),
                  page: int = Query(1, ge=1), page_size: int = Query(24, ge=1, le=200)):
    return query_products(db, ProductFilters(q=q, brand=brand, category=category or product_type,
        skin_type=skin_type, concern=concern, usage=usage,
        availability=availability or ("in_stock" if in_stock else ""),
        new=new, featured=featured, promotion=promotion, sort=sort,
        min_price=min_price, max_price=max_price, page=page, page_size=page_size))


router.add_api_route("/products", list_products, methods=["GET"])
v1.add_api_route("/products", list_products, methods=["GET"])


@router.get("/products/{slug}")
@v1.get("/products/{slug}")
def product(slug: str, db: Session = Depends(get_db)):
    row = next((p for p in all_active(db) if p.slug == slug), None)
    if not row: raise HTTPException(404, "Ce produit est introuvable.")
    return product_public(row)


@router.get("/brands")
@v1.get("/brands")
def brands(db: Session = Depends(get_db)):
    rows = db.scalars(select(Brand).order_by(Brand.name)).all()
    counts = {b.id: 0 for b in rows}
    for item in all_active(db): counts[item.brand_id] += 1
    return [{"name": b.name, "slug": b.slug, "count": counts[b.id]}
            for b in rows if counts[b.id] > 0]


@v1.get("/brands/{slug}")
def brand_detail(slug: str, db: Session = Depends(get_db)):
    row = next((brand for brand in brands(db) if brand["slug"] == slug), None)
    if row is None:
        raise HTTPException(404, "Marque introuvable.")
    return row


@router.get("/categories")
@v1.get("/product-types")
def categories(db: Session = Depends(get_db)):
    rows = db.scalars(select(Category).order_by(Category.name)).all()
    counts = {c.id: 0 for c in rows}
    for item in all_active(db): counts[item.category_id] += 1
    return [{"name": c.name, "slug": c.slug, "count": counts[c.id]}
            for c in rows if counts[c.id] > 0]


@router.get("/skin-types")
@v1.get("/skin-types")
def skin_types(db: Session = Depends(get_db)):
    rows = db.scalars(select(SkinType).where(SkinType.active.is_(True)).order_by(SkinType.id)).all()
    counts = {s.id: 0 for s in rows}
    for item in all_active(db):
        for value in item.skin_types:
            if value.id in counts: counts[value.id] += 1
    return [{"name": s.name, "slug": s.slug, "description": s.description, "count": counts[s.id]} for s in rows]


@router.get("/concerns")
@v1.get("/concerns")
def concerns(db: Session = Depends(get_db)):
    rows = db.scalars(select(Concern).where(Concern.active.is_(True)).order_by(Concern.id)).all()
    counts = {c.id: 0 for c in rows}
    for item in all_active(db):
        for value in item.concerns:
            if value.id in counts: counts[value.id] += 1
    return [{"name": c.name, "slug": c.slug, "description": c.description, "count": counts[c.id]} for c in rows]


def routine_public(row: Routine) -> dict:
    return {"id": row.id, "slug": row.slug, "name": row.name, "description": row.description,
        "steps": [{"id": step.id, "position": step.position, "name": step.name,
            "description": step.description, "category_slug": step.category_slug,
            "products": [product_public(link.product) for link in step.products if link.product.active]}
            for step in row.steps]}


@router.get("/routines")
@v1.get("/routines")
def routines(db: Session = Depends(get_db)):
    return [routine_public(row) for row in db.scalars(select(Routine).where(Routine.active.is_(True)).order_by(Routine.id)).all()]


@router.get("/routines/{slug}")
@v1.get("/routines/{slug}")
def routine(slug: str, db: Session = Depends(get_db)):
    row = db.scalar(select(Routine).where(Routine.slug == slug, Routine.active.is_(True)))
    if not row: raise HTTPException(404, "Routine introuvable.")
    return routine_public(row)


@router.get("/bundles")
@v1.get("/bundles")
def bundles(db: Session = Depends(get_db)):
    return [bundle_public(row) for row in db.scalars(select(Bundle).where(Bundle.active.is_(True)).order_by(Bundle.id)).all()]


@router.get("/bundles/{slug}")
@v1.get("/bundles/{slug}")
def bundle(slug: str, db: Session = Depends(get_db)):
    row = db.scalar(select(Bundle).where(Bundle.slug == slug, Bundle.active.is_(True)))
    if not row: raise HTTPException(404, "Pack introuvable.")
    return bundle_public(row)


@router.get("/search")
@v1.get("/search")
def search(q: str = "", db: Session = Depends(get_db)):
    rows = query_products(db, ProductFilters(q=q, page_size=6))["products"] if q.strip() else []
    term = normal(q.strip())
    return {"products": rows,
        "brands": [b for b in brands(db) if term and term in normal(b["name"])][:4],
        "categories": [c for c in categories(db) if term and term in normal(c["name"])][:4]}


@v1.get("/promotions/active")
def active_promotions(db: Session = Depends(get_db)):
    return [{"id": row.id, "name": row.name, "kind": row.kind,
             "amount": row.amount, "minimum_dh": row.minimum_dh}
            for row in db.scalars(select(Promotion).where(Promotion.active.is_(True))).all()]


@router.get("/navigation")
@v1.get("/navigation")
def navigation(db: Session = Depends(get_db)):
    return {"brands": brands(db), "product_types": categories(db),
        "skin_types": skin_types(db), "concerns": concerns(db),
        "routines": [{"name": r.name, "slug": r.slug} for r in db.scalars(select(Routine).where(Routine.active.is_(True))).all()],
        "bundles": [{"name": b.name, "slug": b.slug} for b in db.scalars(select(Bundle).where(Bundle.active.is_(True))).all()]}


@router.get("/cities")
def cities(db: Session = Depends(get_db)):
    rows = db.scalars(select(City).where(City.active.is_(True)).order_by(City.name)).all()
    return [{"id": c.id, "name": c.name, "region": c.region,
        "shipping_dh": c.shipping_dh, "delivery_window": c.delivery_window} for c in rows]


@router.get("/settings")
def settings(db: Session = Depends(get_db)):
    allowed = {"free_shipping_threshold_dh", "whatsapp_number", "support_phone", "instagram_url", "tiktok_url"}
    return {s.key: s.value for s in db.scalars(select(SiteSetting)).all() if s.key in allowed}


@router.get("/content")
def content(db: Session = Depends(get_db)):
    return content_public(db)


@router.get("/articles")
def articles(db: Session = Depends(get_db)):
    return [{"slug": row.slug, "title": row.title, "excerpt": row.excerpt,
             "created_at": row.created_at} for row in db.scalars(select(Article)
             .where(Article.published.is_(True)).order_by(Article.id.desc())).all()]


@router.get("/articles/{slug}")
def article(slug: str, db: Session = Depends(get_db)):
    row = db.scalar(select(Article).where(Article.slug == slug, Article.published.is_(True)))
    if not row: raise HTTPException(404, "Conseil introuvable.")
    return {"slug": row.slug, "title": row.title, "excerpt": row.excerpt,
            "body": row.body, "created_at": row.created_at}
