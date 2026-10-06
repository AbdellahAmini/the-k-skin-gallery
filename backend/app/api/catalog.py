from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (Article, Brand, Bundle, Category, City, Concern, Ingredient, Product,
    Promotion, Routine, SiteSetting, SkinType, product_concerns, product_ingredients,
    product_skin_types)
from ..content import content_public
from ..product_query import ProductFilters, all_active, normal, query_products
from ..services import bundle_public, product_public


router = APIRouter(prefix="/api")
v1 = APIRouter(prefix="/api/v1")


def list_products(db: Session = Depends(get_db), q: str = "", ids: str = "", brand: str = "", category: str = "",
                  product_type: str = "", skin_type: str = "", concern: str = "", usage: str = "",
                  ingredient: str = "", key_ingredient: str = "",
                  availability: str = "", new: bool = False, featured: bool = False,
                  promotion: bool = False, in_stock: bool = False, sort: str = "relevance",
                  min_price: int = Query(0, ge=0), max_price: int = Query(100000, ge=0),
                  page: int = Query(1, ge=1), page_size: int = Query(24, ge=1, le=200)):
    try:
        selected_ids = [int(value) for value in ids.split(",") if value.strip()] if ids else None
    except ValueError as exc:
        raise HTTPException(422, "La liste des identifiants est invalide.") from exc
    if selected_ids is not None and (len(selected_ids) > 100 or any(value < 1 for value in selected_ids)):
        raise HTTPException(422, "Sélectionnez au maximum 100 identifiants produits valides.")
    return query_products(db, ProductFilters(q=q, ids=selected_ids, brand=brand, category=category or product_type,
        skin_type=skin_type, concern=concern, ingredient=ingredient or key_ingredient, usage=usage,
        availability=availability or ("in_stock" if in_stock else ""),
        new=new, featured=featured, promotion=promotion, sort=sort,
        min_price=min_price, max_price=max_price, page=page, page_size=page_size))


router.add_api_route("/products", list_products, methods=["GET"])
v1.add_api_route("/products", list_products, methods=["GET"])


@router.get("/products/{slug}")
@v1.get("/products/{slug}")
def product(slug: str, db: Session = Depends(get_db)):
    row = db.scalar(select(Product).where(Product.slug == slug, Product.active.is_(True),
        Product.publication_status == "published", Product.price_dh > 0))
    if not row: raise HTTPException(404, "Ce produit est introuvable.")
    return product_public(row)


@router.get("/brands")
@v1.get("/brands")
def brands(db: Session = Depends(get_db)):
    counts = dict(db.execute(select(Product.brand_id, func.count(Product.id))
        .where(Product.active.is_(True), Product.publication_status == "published", Product.price_dh > 0).group_by(Product.brand_id)).all())
    rows = db.scalars(select(Brand).where(Brand.active.is_(True)).order_by(Brand.name)).all()
    return [{"name": b.name, "slug": b.slug, "count": int(counts.get(b.id, 0)),
        "logo": b.logo, "description_fr": b.description_fr, "official_website": b.official_website,
        "featured_homepage": b.featured_homepage, "homepage_order": b.homepage_order,
        "seo_title": b.seo_title, "seo_description": b.seo_description}
        for b in rows if counts.get(b.id, 0) > 0]


@v1.get("/brands/{slug}")
def brand_detail(slug: str, db: Session = Depends(get_db)):
    row = next((brand for brand in brands(db) if brand["slug"] == slug), None)
    if row is None:
        raise HTTPException(404, "Marque introuvable.")
    return row


@router.get("/categories")
@v1.get("/product-types")
def categories(db: Session = Depends(get_db)):
    counts = dict(db.execute(select(Product.category_id, func.count(Product.id))
        .where(Product.active.is_(True), Product.publication_status == "published", Product.price_dh > 0).group_by(Product.category_id)).all())
    rows = db.scalars(select(Category).order_by(Category.name)).all()
    return [{"name": c.name, "slug": c.slug, "count": int(counts.get(c.id, 0))}
            for c in rows if counts.get(c.id, 0) > 0]


@router.get("/skin-types")
@v1.get("/skin-types")
def skin_types(db: Session = Depends(get_db)):
    rows = db.scalars(select(SkinType).where(SkinType.active.is_(True)).order_by(SkinType.id)).all()
    # Count through the association without hydrating product rows.
    counts = dict(db.execute(select(product_skin_types.c.skin_type_id, func.count(product_skin_types.c.product_id))
        .join(Product, Product.id == product_skin_types.c.product_id)
        .where(Product.active.is_(True), Product.publication_status == "published", Product.classification_verified.is_(True))
        .group_by(product_skin_types.c.skin_type_id)).all())
    return [{"name": s.name, "slug": s.slug, "description": s.description, "count": counts.get(s.id, 0)} for s in rows]


@router.get("/concerns")
@v1.get("/concerns")
def concerns(db: Session = Depends(get_db)):
    rows = db.scalars(select(Concern).where(Concern.active.is_(True)).order_by(Concern.id)).all()
    counts = dict(db.execute(select(product_concerns.c.concern_id, func.count(product_concerns.c.product_id))
        .join(Product, Product.id == product_concerns.c.product_id)
        .where(Product.active.is_(True), Product.publication_status == "published", Product.classification_verified.is_(True))
        .group_by(product_concerns.c.concern_id)).all())
    return [{"name": c.name, "slug": c.slug, "description": c.description, "count": counts.get(c.id, 0)} for c in rows]


@router.get("/ingredients")
@v1.get("/ingredients")
def ingredients(db: Session = Depends(get_db)):
    counts = dict(db.execute(select(product_ingredients.c.ingredient_id, func.count(product_ingredients.c.product_id))
        .join(Product, Product.id == product_ingredients.c.product_id)
        .where(Product.active.is_(True), Product.publication_status == "published", Product.classification_verified.is_(True))
        .group_by(product_ingredients.c.ingredient_id)).all())
    rows = db.scalars(select(Ingredient).order_by(Ingredient.name)).all()
    return [{"name": row.name, "slug": row.slug, "count": int(counts.get(row.id, 0))}
            for row in rows if counts.get(row.id, 0) > 0]


def routine_public(row: Routine) -> dict:
    return {"id": row.id, "slug": row.slug, "name": row.name, "description": row.description,
        "steps": [{"id": step.id, "position": step.position, "name": step.name,
            "description": step.description, "category_slug": step.category_slug,
            "products": [product_public(link.product) for link in step.products
                if link.product.active and link.product.publication_status == "published" and link.product.price_dh > 0]}
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
        "ingredients": ingredients(db),
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
