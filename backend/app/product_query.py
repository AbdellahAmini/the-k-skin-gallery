"""Database-paginated product search and contextual catalog facets."""
import unicodedata
from dataclasses import dataclass
from datetime import date

from fastapi import HTTPException
from sqlalchemy import case, distinct, func, or_, select
from sqlalchemy.orm import Session, selectinload

from .models import (Brand, Category, Concern, Ingredient, Order, OrderItem, Product,
                     ProductMetadata, SkinType)
from .services import product_public


def normal(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", value.casefold())
                   if unicodedata.category(c) != "Mn")


def filter_values(value: str) -> list[str]:
    """Read a single legacy slug or a comma-separated multi-select value."""
    return list(dict.fromkeys(part.strip() for part in value.split(",") if part.strip()))


@dataclass
class ProductFilters:
    q: str = ""
    ids: list[int] | None = None
    brand: str = ""
    category: str = ""
    skin_type: str = ""
    concern: str = ""
    ingredient: str = ""
    usage: str = ""
    availability: str = ""
    min_price: int = 0
    max_price: int = 100000
    new: bool = False
    featured: bool = False
    promotion: bool = False
    exclude_promotion: bool = False
    sort: str = "relevance"
    page: int = 1
    page_size: int = 24


def all_active(db: Session) -> list[Product]:
    """Compatibility helper for small editorial consumers; list endpoints never use it."""
    return db.scalars(select(Product).options(
        selectinload(Product.brand), selectinload(Product.category),
        selectinload(Product.metadata_record), selectinload(Product.skin_types),
        selectinload(Product.concerns), selectinload(Product.ingredients),
        selectinload(Product.images))
        .where(Product.active.is_(True), Product.publication_status == "published",
               Product.price_dh > 0)).all()


def _conditions(filters: ProductFilters, omit: str = ""):
    conditions = [Product.active.is_(True), Product.publication_status == "published", Product.price_dh > 0]
    if filters.ids is not None: conditions.append(Product.id.in_(filters.ids))
    term = filters.q.strip().casefold()
    if term:
        pattern = f"%{term}%"
        def searchable(field):
            text = func.lower(field)
            for original, replacement in [("é", "e"), ("è", "e"), ("ê", "e"), ("à", "a"), ("â", "a"), ("î", "i"), ("ï", "i"), ("ô", "o"), ("ù", "u"), ("û", "u"), ("ç", "c")]:
                text = func.replace(text, original, replacement)
            return text.like(f"%{normal(term)}%")
        conditions.append(or_(
            searchable(Product.name), searchable(Product.official_name),
            searchable(Product.display_name_fr), searchable(Product.sku),
            Product.brand.has(searchable(Brand.name)),
            Product.category.has(searchable(Category.name)),
            Product.metadata_record.has(searchable(ProductMetadata.search_aliases)),
            (Product.classification_verified.is_(True) & Product.skin_types.any(searchable(SkinType.name))),
            (Product.classification_verified.is_(True) & Product.concerns.any(searchable(Concern.name))),
            (Product.classification_verified.is_(True) & Product.ingredients.any(searchable(Ingredient.name))),
        ))
    brands = filter_values(filters.brand)
    categories = filter_values(filters.category)
    skin_types = filter_values(filters.skin_type)
    concerns = filter_values(filters.concern)
    ingredients = filter_values(filters.ingredient)
    usages = filter_values(filters.usage)
    availabilities = filter_values(filters.availability)
    if brands and omit != "brand":
        conditions.append(Product.brand.has(Brand.slug.in_(brands)))
    if categories and omit != "category":
        conditions.append(Product.category.has(Category.slug.in_(categories)))
    if skin_types and omit != "skin_type":
        conditions.extend([Product.classification_verified.is_(True), Product.skin_types.any(SkinType.slug.in_(skin_types))])
    if concerns and omit != "concern":
        conditions.extend([Product.classification_verified.is_(True), Product.concerns.any(Concern.slug.in_(concerns))])
    if ingredients and omit != "ingredient":
        conditions.extend([Product.classification_verified.is_(True), Product.ingredients.any(Ingredient.slug.in_(ingredients))])
    if usages and omit != "usage":
        conditions.extend([Product.classification_verified.is_(True),
            Product.metadata_record.has(ProductMetadata.usage_time.in_(usages))])
    if filters.availability and omit != "availability":
        stock_conditions = []
        if "in_stock" in availabilities: stock_conditions.append(Product.stock > 0)
        if "out_of_stock" in availabilities: stock_conditions.append(Product.stock <= 0)
        if stock_conditions: conditions.append(or_(*stock_conditions))
    conditions.extend([Product.price_dh >= filters.min_price, Product.price_dh <= filters.max_price])
    if filters.new:
        conditions.append(Product.metadata_record.has(ProductMetadata.new_until >= date.today()))
    if filters.featured: conditions.append(Product.featured.is_(True))
    if filters.promotion:
        conditions.extend([Product.compare_at_dh.is_not(None), Product.compare_at_dh > Product.price_dh])
    if filters.exclude_promotion:
        conditions.append(or_(Product.compare_at_dh.is_(None), Product.compare_at_dh <= Product.price_dh))
    return conditions


def _facet_counts(db: Session, filters: ProductFilters) -> dict:
    facets = {}

    def grouped(key, field, query, value_map=None):
        counts = db.execute(query).all()
        selected = filter_values(getattr(filters, key))
        values = {slug: (name, int(count)) for slug, name, count in counts if count > 0 or slug in selected}
        if selected:
            # Keep the selected facet available even if its result count reaches zero.
            model = {"brand": Brand, "category": Category, "skin_type": SkinType,
                     "concern": Concern, "ingredient": Ingredient}.get(key)
            if model:
                for selected_slug in selected:
                    if selected_slug not in values:
                        row = db.scalar(select(model).where(model.slug == selected_slug))
                        if row: values[selected_slug] = (row.name, 0)
        facets[key] = [{"slug": slug, "name": name, "count": count}
                       for slug, (name, count) in sorted(values.items(), key=lambda item: item[1][0].casefold())]

    def count_products(omit=""):
        return [* _conditions(filters, omit)]

    grouped("brand", "brand", select(Brand.slug, Brand.name, func.count(distinct(Product.id)))
        .select_from(Product).join(Product.brand).where(*count_products("brand"))
        .group_by(Brand.slug, Brand.name))
    grouped("category", "category", select(Category.slug, Category.name, func.count(distinct(Product.id)))
        .select_from(Product).join(Product.category).where(*count_products("category"))
        .group_by(Category.slug, Category.name))
    grouped("skin_type", "skin_type", select(SkinType.slug, SkinType.name, func.count(distinct(Product.id)))
        .select_from(Product).join(Product.skin_types).where(Product.classification_verified.is_(True), *count_products("skin_type"))
        .group_by(SkinType.slug, SkinType.name))
    grouped("concern", "concern", select(Concern.slug, Concern.name, func.count(distinct(Product.id)))
        .select_from(Product).join(Product.concerns).where(Product.classification_verified.is_(True), *count_products("concern"))
        .group_by(Concern.slug, Concern.name))
    grouped("ingredient", "ingredient", select(Ingredient.slug, Ingredient.name, func.count(distinct(Product.id)))
        .select_from(Product).join(Product.ingredients).where(Product.classification_verified.is_(True), *count_products("ingredient"))
        .group_by(Ingredient.slug, Ingredient.name))

    usage_name = case((ProductMetadata.usage_time == "am", "Matin"),
                      (ProductMetadata.usage_time == "pm", "Soir"), else_="Matin & soir")
    usage_rows = db.execute(select(ProductMetadata.usage_time, usage_name, func.count(distinct(Product.id)))
        .select_from(Product).join(Product.metadata_record).where(Product.classification_verified.is_(True), *count_products("usage"),
            ProductMetadata.usage_time.in_(["am", "pm", "both"]))
        .group_by(ProductMetadata.usage_time)).all()
    usage_selected = filter_values(filters.usage)
    facets["usage"] = [{"slug": slug, "name": name, "count": int(count)} for slug, name, count in usage_rows
                        if count > 0 or slug in usage_selected]

    available_case = case((Product.stock > 0, "in_stock"), else_="out_of_stock")
    availability_names = {"in_stock": "En stock", "out_of_stock": "Rupture de stock"}
    stock_rows = db.execute(select(available_case, func.count(Product.id)).where(*count_products("availability"))
        .group_by(available_case)).all()
    availability_selected = filter_values(filters.availability)
    facets["availability"] = [{"slug": slug, "name": availability_names[slug], "count": int(count)}
                               for slug, count in stock_rows if count > 0 or slug in availability_selected]
    return facets


def query_products(db: Session, filters: ProductFilters) -> dict:
    if filters.sort not in {"relevance", "newest", "price_asc", "price_desc", "best_sellers"}:
        raise HTTPException(422, "Tri invalide.")
    if any(value not in {"am", "pm", "both"} for value in filter_values(filters.usage)):
        raise HTTPException(422, "Utilisation invalide.")
    if any(value not in {"in_stock", "out_of_stock"} for value in filter_values(filters.availability)):
        raise HTTPException(422, "Disponibilité invalide.")
    base = select(Product).options(
        selectinload(Product.brand), selectinload(Product.category),
        selectinload(Product.product_subtype), selectinload(Product.metadata_record),
        selectinload(Product.skin_types), selectinload(Product.concerns),
        selectinload(Product.ingredients), selectinload(Product.images))
    conditions = _conditions(filters)
    base = base.where(*conditions)
    count_stmt = select(func.count(Product.id)).where(*conditions)
    total = int(db.scalar(count_stmt) or 0)

    sold = select(OrderItem.product_id.label("product_id"), func.sum(OrderItem.quantity).label("units")) \
        .join(Order, Order.id == OrderItem.order_id).where(Order.status == "livree") \
        .group_by(OrderItem.product_id).subquery()
    if filters.sort == "best_sellers":
        if not db.scalar(select(func.count()).select_from(sold)):
            raise HTTPException(422, "Le tri meilleures ventes sera disponible après les premières commandes livrées.")
        base = base.outerjoin(sold, sold.c.product_id == Product.id).order_by(func.coalesce(sold.c.units, 0).desc(), Product.stock.desc(), Product.id)
        sorts = ["relevance", "newest", "price_asc", "price_desc", "best_sellers"]
    elif filters.sort == "price_asc":
        base = base.order_by(Product.price_dh, Product.stock.desc(), Product.id)
        sorts = ["relevance", "newest", "price_asc", "price_desc"]
    elif filters.sort == "price_desc":
        base = base.order_by(Product.price_dh.desc(), Product.stock.desc(), Product.id)
        sorts = ["relevance", "newest", "price_asc", "price_desc"]
    elif filters.sort == "newest":
        base = base.order_by(Product.created_at.desc(), Product.id.desc())
        sorts = ["relevance", "newest", "price_asc", "price_desc"]
    else:
        base = base.order_by(case((Product.stock > 0, 0), else_=1), Product.featured.desc(), Product.id)
        sorts = ["relevance", "newest", "price_asc", "price_desc"]

    rows = db.scalars(base.offset((filters.page - 1) * filters.page_size).limit(filters.page_size)).all()
    return {"total": total, "page": filters.page, "page_size": filters.page_size,
        "pages": max(1, (total + filters.page_size - 1) // filters.page_size),
        "products": [product_public(p) for p in rows],
        "available_facets": _facet_counts(db, filters), "available_sorts": sorts}
