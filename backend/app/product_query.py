"""One product query path for every storefront collection.

The catalog is currently small enough to calculate contextual counts in memory.
The API boundary and response stay stable if this moves into SQL later.
"""

import unicodedata
from collections import Counter
from dataclasses import dataclass
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload
from .models import Order, OrderItem, Product
from .services import product_public


def normal(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", value.casefold())
                   if unicodedata.category(c) != "Mn")


@dataclass
class ProductFilters:
    q: str = ""
    brand: str = ""
    category: str = ""
    skin_type: str = ""
    concern: str = ""
    usage: str = ""
    availability: str = ""
    min_price: int = 0
    max_price: int = 100000
    new: bool = False
    featured: bool = False
    promotion: bool = False
    sort: str = "relevance"
    page: int = 1
    page_size: int = 24


def all_active(db: Session) -> list[Product]:
    return db.scalars(select(Product).options(
        selectinload(Product.brand), selectinload(Product.category),
        selectinload(Product.metadata_record), selectinload(Product.skin_types),
        selectinload(Product.concerns), selectinload(Product.ingredients))
        .where(Product.active.is_(True))).all()


def matches(product: Product, filters: ProductFilters, omit: str = "") -> bool:
    details = product.metadata_record
    term = normal(filters.q.strip())
    if term and term not in normal(" ".join([
        product.name, product.brand.name, product.category.name, product.sku,
        details.search_aliases if details else "",
        " ".join(item.name for item in product.skin_types),
        " ".join(item.name for item in product.concerns),
        " ".join(item.name for item in product.ingredients),
    ])):
        return False
    if filters.brand and omit != "brand" and product.brand.slug != filters.brand: return False
    if filters.category and omit != "category" and product.category.slug != filters.category: return False
    if filters.skin_type and omit != "skin_type" and not any(s.slug == filters.skin_type for s in product.skin_types): return False
    if filters.concern and omit != "concern" and not any(c.slug == filters.concern for c in product.concerns): return False
    if filters.usage and omit != "usage" and (not details or details.usage_time != filters.usage): return False
    if filters.availability and omit != "availability":
        if filters.availability == "in_stock" and product.stock <= 0: return False
        if filters.availability == "out_of_stock" and product.stock > 0: return False
    if filters.min_price and product.price_dh < filters.min_price: return False
    if filters.max_price and product.price_dh > filters.max_price: return False
    public = product_public(product)
    if filters.new and not public["new_arrival"]: return False
    if filters.featured and not product.featured: return False
    if filters.promotion and not (product.compare_at_dh and product.compare_at_dh > product.price_dh): return False
    return True


def facets(rows: list[Product], filters: ProductFilters) -> dict:
    fields = {
        "brand": lambda p: [(p.brand.slug, p.brand.name)],
        "category": lambda p: [(p.category.slug, p.category.name)],
        "skin_type": lambda p: [(s.slug, s.name) for s in p.skin_types],
        "concern": lambda p: [(c.slug, c.name) for c in p.concerns],
        "usage": lambda p: ([(p.metadata_record.usage_time, {
            "am": "Matin", "pm": "Soir", "both": "Matin & soir"}[p.metadata_record.usage_time])]
            if p.metadata_record and p.metadata_record.usage_time in {"am", "pm", "both"} else []),
        "availability": lambda p: [("in_stock", "En stock") if p.stock > 0 else ("out_of_stock", "Rupture de stock")],
    }
    result = {}
    for field, values in fields.items():
        counts = Counter()
        names = {}
        for product in rows:
            if matches(product, filters, omit=field):
                for slug, name in values(product):
                    counts[slug] += 1
                    names[slug] = name
        selected = getattr(filters, field)
        result[field] = [{"slug": slug, "name": names[slug], "count": count}
                         for slug, count in sorted(counts.items(), key=lambda item: names[item[0]].casefold())
                         if count > 0 or slug == selected]
    return result


def query_products(db: Session, filters: ProductFilters) -> dict:
    if filters.sort not in {"relevance", "newest", "price_asc", "price_desc", "best_sellers"}:
        raise HTTPException(422, "Tri invalide.")
    if filters.usage and filters.usage not in {"am", "pm", "both"}:
        raise HTTPException(422, "Utilisation invalide.")
    if filters.availability and filters.availability not in {"in_stock", "out_of_stock"}:
        raise HTTPException(422, "Disponibilité invalide.")
    all_rows = all_active(db)
    selected = [product for product in all_rows if matches(product, filters)]
    sold = Counter(dict(db.execute(select(OrderItem.product_id, func.sum(OrderItem.quantity))
        .join(Order, Order.id == OrderItem.order_id).where(Order.status == "livree")
        .group_by(OrderItem.product_id)).all()))
    if filters.sort == "best_sellers" and not sold:
        raise HTTPException(422, "Le tri meilleures ventes sera disponible après les premières commandes livrées.")
    if filters.sort == "price_asc": selected.sort(key=lambda p: (p.price_dh, p.id))
    elif filters.sort == "price_desc": selected.sort(key=lambda p: (-p.price_dh, p.id))
    elif filters.sort == "newest": selected.sort(key=lambda p: (-p.id,))
    elif filters.sort == "best_sellers": selected.sort(key=lambda p: (-sold[p.id], p.id))
    else: selected.sort(key=lambda p: (not p.featured, p.id))
    total = len(selected)
    start = (filters.page - 1) * filters.page_size
    page_rows = selected[start:start + filters.page_size]
    return {"total": total, "page": filters.page, "page_size": filters.page_size,
        "pages": max(1, (total + filters.page_size - 1) // filters.page_size),
        "products": [product_public(p) for p in page_rows],
        "available_facets": facets(all_rows, filters),
        "available_sorts": ["relevance", "newest", "price_asc", "price_desc"] + (["best_sellers"] if sold else [])}
