import base64
import json
from datetime import date, datetime
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..content import SCHEMAS, content_public
from ..models import (Article, Brand, Bundle, BundleItem, Category, City, Collection, Concern, ContentSection, Ingredient,
    InventoryReservation, NotificationOutbox, Order, OrderStatusHistory, Product, ProductMetadata, ProductResearch,
    ProductImage, ProductSubtype, Promotion, Routine, RoutineStep, RoutineStepProduct, SiteSetting, SkinType, StockAlert, User, now)
from ..security import admin_user
from ..services import bundle_public, product_public
from ..pricing import round_up_to_10_dh
from .catalog import routine_public
from .commerce import order_public


router = APIRouter(prefix="/api/admin", dependencies=[Depends(admin_user)])


def order_admin(order: Order) -> dict:
    return {**order_public(order), "id": order.id, "email": order.email, "district": order.district,
        "complement": order.complement, "delivery_notes": order.delivery_notes,
        "history": [{"status": h.status, "note": h.note, "created_at": h.created_at}
                    for h in sorted(order.history, key=lambda x: x.id)]}


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    orders = db.scalars(select(Order)).all()
    return {"to_confirm": sum(o.status == "a_confirmer" for o in orders),
        "confirmed": sum(o.status == "confirmee" for o in orders),
        "preparing": sum(o.status == "preparation" for o in orders),
        "shipped": sum(o.status == "expediee" for o in orders),
        "delivered": sum(o.status == "livree" for o in orders),
        "ordered_value_dh": sum(o.total_dh for o in orders),
        "delivered_revenue_dh": sum(o.total_dh for o in orders if o.status == "livree"),
        "out_of_stock": db.scalar(select(func.count(Product.id)).where(Product.stock <= 0, Product.active.is_(True), Product.publication_status == "published", Product.price_dh > 0)),
        "low_stock": db.scalar(select(func.count(Product.id)).where(Product.stock > 0,
            Product.stock <= Product.low_stock_threshold, Product.active.is_(True), Product.publication_status == "published", Product.price_dh > 0))}


@router.get("/orders")
def orders(status: str = "", q: str = "", city: str = "", created_after: date | None = None,
           created_before: date | None = None, cursor: str = "",
           limit: int | None = Query(None, ge=1, le=30), sort: str = "id", db: Session = Depends(get_db)):
    stmt = select(Order)
    where = []
    if status: where.append(Order.status == status)
    if q.strip():
        pattern = f"%{q.strip().casefold()}%"
        where.append(or_(func.lower(Order.number).like(pattern), func.lower(Order.first_name).like(pattern),
            func.lower(Order.last_name).like(pattern), func.lower(Order.phone).like(pattern), func.lower(Order.email).like(pattern)))
    if city: where.append(Order.city == city)
    if created_after: where.append(func.date(Order.created_at) >= created_after.isoformat())
    if created_before: where.append(func.date(Order.created_at) <= created_before.isoformat())
    if where: stmt = stmt.where(*where)
    if limit is not None:
        if sort not in {"id", "amount", "date", "customer"}: raise HTTPException(422, "Tri de commandes invalide.")
        sort_column = {"id": Order.id, "amount": Order.total_dh, "date": Order.created_at,
            "customer": func.lower(Order.last_name)}[sort]
        direction = "asc" if sort == "customer" else "desc"
        if cursor:
            last_value, last_id = decode_grid_cursor(cursor, sort)
            if direction == "asc": stmt = stmt.where(or_(sort_column > last_value, (sort_column == last_value) & (Order.id > last_id)))
            else: stmt = stmt.where(or_(sort_column < last_value, (sort_column == last_value) & (Order.id < last_id)))
        order = sort_column.asc() if direction == "asc" else sort_column.desc()
        id_order = Order.id.asc() if direction == "asc" else Order.id.desc()
        total = int(db.scalar(select(func.count(Order.id)).where(*where)) or 0)
        rows = db.scalars(stmt.order_by(order, id_order).limit(limit + 1)).all()
        has_more = len(rows) > limit
        rows = rows[:limit]
        last = rows[-1] if rows else None
        cursor_value = (last.id if sort == "id" else last.total_dh if sort == "amount" else
            last.created_at.isoformat() if sort == "date" else last.last_name.casefold()) if last else None
        return {"orders": [order_admin(item) for item in rows], "total": total,
            "has_more": has_more, "next_cursor": encode_grid_cursor(sort, cursor_value, last.id) if has_more and last else None,
            "limit": limit}
    return [order_admin(o) for o in db.scalars(stmt.order_by(Order.id.desc())).all()]


@router.get("/orders/{order_id}")
def order_detail(order_id: int, db: Session = Depends(get_db)):
    row = db.get(Order, order_id)
    if not row: raise HTTPException(404, "Commande introuvable.")
    return order_admin(row)


TRANSITIONS = {
    "a_confirmer": {"appel_en_cours", "confirmee", "injoignable", "annulee"},
    "appel_en_cours": {"confirmee", "injoignable", "annulee"},
    "injoignable": {"appel_en_cours", "confirmee", "annulee"},
    "confirmee": {"preparation", "annulee"},
    "preparation": {"expediee", "annulee"},
    "expediee": {"livree", "refusee", "retournee"},
    "livree": {"retournee"}, "annulee": set(), "refusee": set(), "retournee": set(),
}


class StatusIn(BaseModel):
    status: str
    note: str = ""


@router.post("/orders/{order_id}/status")
def change_status(order_id: int, payload: StatusIn, db: Session = Depends(get_db), admin: User = Depends(admin_user)):
    row = db.get(Order, order_id)
    if not row: raise HTTPException(404, "Commande introuvable.")
    if payload.status not in TRANSITIONS.get(row.status, set()):
        raise HTTPException(409, "Cette transition de statut n'est pas autorisée.")
    row.status = payload.status
    db.add(OrderStatusHistory(order_id=row.id, status=payload.status, note=payload.note.strip(), actor_id=admin.id))
    if payload.status == "annulee":
        for reservation in db.scalars(select(InventoryReservation).where(
                InventoryReservation.order_id == row.id, InventoryReservation.released.is_(False))).all():
            product = db.get(Product, reservation.product_id)
            product.stock += reservation.quantity
            reservation.released = True
    db.commit()
    return order_admin(row)


def admin_product_public(p: Product) -> dict:
    result = {**product_public(p), "active": p.active, "cost_dh": p.cost_dh,
        "usage_instructions": p.usage_instructions, "usage_instructions_fr": p.usage_instructions_fr, "wholesale_dh": p.wholesale_dh, "stock_is_sample": p.stock_is_sample,
        "skin_types": [{"name": item.name, "slug": item.slug} for item in p.skin_types],
        "concerns": [{"name": item.name, "slug": item.slug} for item in p.concerns],
        "ingredients": [{"name": item.name, "slug": item.slug} for item in p.ingredients]}
    research = p.research_record
    if research:
        result["research"] = {"external_id": research.external_id, "source_scope": research.source_scope,
            "desired_visibility": research.desired_visibility,
            "official_reference_price": float(research.official_reference_price) if research.official_reference_price is not None else None,
            "official_reference_currency": research.official_reference_currency,
            "official_price_note": research.official_price_note, "price_source": research.price_source,
            "media_status": research.media_status, "pdp_content_status": research.pdp_content_status,
            "commercial_ready": research.commercial_ready,
            "commercial_hold_reason": research.commercial_hold_reason,
            "selection_basis": research.selection_basis, "curation_basis": research.curation_basis,
            "research_notes": research.research_notes}
    result["images"] = [{"id": image.id, "image_url": image.image_url, "source_url": image.source_url,
        "alt_text": image.alt_text, "position": image.position, "is_primary": image.is_primary}
        for image in p.images]
    return result


def product_where(filters: dict) -> list:
    """Build the same allow-listed predicate for grids and server-side bulk actions."""
    where = []
    q = str(filters.get("q", "")).strip()
    if q:
        pattern = f"%{q.casefold()}%"
        where.append(or_(func.lower(Product.name).like(pattern), func.lower(Product.display_name_fr).like(pattern),
            func.lower(Product.official_name).like(pattern), func.lower(Product.sku).like(pattern),
            func.lower(Product.barcode).like(pattern), Product.brand.has(func.lower(Brand.name).like(pattern))))
    publication_status = str(filters.get("publication_status", ""))
    if publication_status:
        if publication_status not in {"draft", "published", "archived"}: raise HTTPException(422, "État de publication invalide.")
        where.append(Product.publication_status == publication_status)
    verification_status = str(filters.get("verification_status", ""))
    if verification_status:
        verification_status = verification_status.upper()
        if verification_status not in {"UNVERIFIED", "PARTIAL", "VERIFIED", "NEEDS_REVIEW"}: raise HTTPException(422, "État de vérification invalide.")
        where.append(Product.verification_status == verification_status)
    inventory_status = str(filters.get("inventory_status", ""))
    if inventory_status == "out_of_stock": where.append(Product.stock <= 0)
    elif inventory_status == "low_stock": where.append((Product.stock > 0) & (Product.stock <= Product.low_stock_threshold))
    elif inventory_status == "in_stock": where.append(Product.stock > Product.low_stock_threshold)
    elif inventory_status: raise HTTPException(422, "État de stock invalide.")
    for key, column in (("brand_slug", Brand.slug), ("product_type_slug", Category.slug)):
        value = str(filters.get(key, "")).strip()
        if value:
            relation = Product.brand if key == "brand_slug" else Product.category
            where.append(relation.has(column == value))
    skin = str(filters.get("skin_type_slug", "")).strip()
    concern = str(filters.get("concern_slug", "")).strip()
    if skin: where.append(Product.skin_types.any(SkinType.slug == skin))
    if concern: where.append(Product.concerns.any(Concern.slug == concern))
    readiness = str(filters.get("readiness", "")).strip()
    if readiness == "ready": where.append(Product.research_record.has(ProductResearch.commercial_ready.is_(True)))
    elif readiness == "blocked": where.append(Product.research_record.has(ProductResearch.commercial_ready.is_(False)))
    elif readiness: raise HTTPException(422, "Filtre de préparation invalide.")
    return where


def encode_grid_cursor(sort: str, value, row_id: int) -> str:
    raw = json.dumps([sort, value, row_id], separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_grid_cursor(cursor: str, sort: str):
    try:
        raw = base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4))
        parsed_sort, value, row_id = json.loads(raw)
        if parsed_sort != sort or not isinstance(row_id, int): raise ValueError()
        if sort in {"price", "stock", "amount", "id"}: value = int(value)
        elif sort in {"updated", "date"}: value = datetime.fromisoformat(value)
        return value, row_id
    except Exception:
        raise HTTPException(400, "Curseur de catalogue invalide.")


@router.get("/products")
def products(q: str = "", publication_status: str = "", verification_status: str = "",
             inventory_status: str = "", brand_slug: str = "", product_type_slug: str = "",
             skin_type_slug: str = "", concern_slug: str = "", readiness: str = "",
             ids: str = "", cursor: str = "", limit: int | None = Query(None, ge=1, le=30), sort: str = "id",
             page: int | None = Query(None, ge=1), page_size: int = Query(24, ge=1, le=100),
             db: Session = Depends(get_db)):
    filters = {"q": q, "publication_status": publication_status, "verification_status": verification_status,
        "inventory_status": inventory_status, "brand_slug": brand_slug, "product_type_slug": product_type_slug,
        "skin_type_slug": skin_type_slug, "concern_slug": concern_slug, "readiness": readiness}
    stmt = select(Product).options(selectinload(Product.brand), selectinload(Product.category),
        selectinload(Product.metadata_record), selectinload(Product.skin_types), selectinload(Product.concerns),
        selectinload(Product.ingredients), selectinload(Product.images))
    where = product_where(filters)
    if ids:
        try: selected_ids = list(dict.fromkeys(int(item) for item in ids.split(",") if item.strip()))
        except ValueError: raise HTTPException(422, "Liste d’identifiants invalide.")
        if len(selected_ids) > 100: raise HTTPException(422, "Limite de 100 identifiants dépassée.")
        rows = db.scalars(stmt.where(Product.id.in_(selected_ids)).order_by(Product.id)).all() if selected_ids else []
        return {"products": [admin_product_public(p) for p in rows], "total": len(rows)}
    if where: stmt = stmt.where(*where)
    total = int(db.scalar(select(func.count(Product.id)).where(*where)) or 0)
    sort_columns = {"id": Product.id, "name": func.lower(Product.name), "price": Product.price_dh,
        "stock": Product.stock, "updated": Product.updated_at}
    if sort not in sort_columns: raise HTTPException(422, "Tri de catalogue invalide.")
    sort_column = sort_columns[sort]
    if limit is not None:
        direction = "asc" if sort == "name" else "desc"
        if cursor:
            last_value, last_id = decode_grid_cursor(cursor, sort)
            if direction == "asc": stmt = stmt.where(or_(sort_column > last_value, (sort_column == last_value) & (Product.id > last_id)))
            else: stmt = stmt.where(or_(sort_column < last_value, (sort_column == last_value) & (Product.id < last_id)))
        order = sort_column.asc() if direction == "asc" else sort_column.desc()
        id_order = Product.id.asc() if direction == "asc" else Product.id.desc()
        rows = db.scalars(stmt.order_by(order, id_order).limit(limit + 1)).all()
        has_more = len(rows) > limit
        rows = rows[:limit]
        next_cursor = encode_grid_cursor(sort, (rows[-1].id if sort == "id" else
            rows[-1].name.casefold() if sort == "name" else rows[-1].price_dh if sort == "price" else
            rows[-1].stock if sort == "stock" else rows[-1].updated_at.isoformat()), rows[-1].id) if rows and has_more else None
        return {"products": [admin_product_public(p) for p in rows], "total": total,
            "next_cursor": next_cursor, "has_more": has_more, "limit": limit}
    if page is not None:
        rows = db.scalars(stmt.order_by(Product.id).offset((page - 1) * page_size).limit(page_size)).all()
        return {"products": [admin_product_public(p) for p in rows], "total": total, "page": page,
            "page_size": page_size, "pages": max(1, (total + page_size - 1) // page_size)}
    rows = db.scalars(stmt.order_by(Product.id)).all()
    return [admin_product_public(p) for p in rows]


@router.get("/products/{product_id}")
def admin_product(product_id: int, db: Session = Depends(get_db)):
    row = db.scalar(select(Product).options(selectinload(Product.brand), selectinload(Product.category),
        selectinload(Product.metadata_record), selectinload(Product.skin_types), selectinload(Product.concerns),
        selectinload(Product.ingredients), selectinload(Product.images)).where(Product.id == product_id))
    if not row: raise HTTPException(404, "Produit introuvable.")
    return admin_product_public(row)


class ProductPatch(BaseModel):
    price_dh: int | None = Field(None, ge=0)
    compare_at_dh: int | None = Field(None, ge=0)
    cost_dh: int | None = Field(None, ge=0)
    wholesale_dh: int | None = Field(None, ge=0)
    stock: int | None = Field(None, ge=0)
    low_stock_threshold: int | None = Field(None, ge=0)
    publication_status: str | None = None
    verification_status: str | None = None
    classification_verified: bool | None = None
    active: bool | None = None
    featured: bool | None = None
    new_arrival: bool | None = None
    short_description: str | None = None
    description: str | None = None
    usage_instructions: str | None = None
    inci: str | None = None
    official_name: str | None = None
    display_name_fr: str | None = None
    barcode: str | None = None
    size: str | None = None
    size_value: float | None = Field(None, gt=0)
    size_unit: str | None = None

    @field_validator("compare_at_dh", mode="before")
    @classmethod
    def round_compare_price_up(cls, value):
        return round_up_to_10_dh(value)
    manufacturer_description: str | None = None
    manufacturer_benefits: str | None = None
    benefits_fr: str | None = None
    usage_instructions_fr: str | None = None
    warnings_fr: str | None = None
    source_language: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    image_url: str | None = None
    official_source_url: str | None = None
    official_source_name: str | None = None
    mark_verified: bool | None = None
    category_slug: str | None = None
    skin_type_slugs: list[str] | None = None
    concern_slugs: list[str] | None = None
    ingredient_slugs: list[str] | None = None
    usage_time: str | None = None
    routine_step: str | None = None
    search_aliases: str | None = None
    new_until: datetime | None = None
    product_subtype_slug: str | None = None


class ProductCreateIn(BaseModel):
    sku: str = Field(min_length=1, max_length=80)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=220)
    name: str = Field(min_length=2, max_length=300)
    brand_slug: str
    category_slug: str
    size: str = ""
    price_dh: int = Field(0, ge=0)
    stock: int = Field(0, ge=0)


@router.post("/products", status_code=201)
def create_product(payload: ProductCreateIn, db: Session = Depends(get_db)):
    if db.scalar(select(Product.id).where((Product.sku == payload.sku) | (Product.slug == payload.slug))):
        raise HTTPException(409, "Ce SKU ou cette adresse produit existe déjà.")
    brand = db.scalar(select(Brand).where(Brand.slug == payload.brand_slug))
    category = db.scalar(select(Category).where(Category.slug == payload.category_slug))
    if not brand: raise HTTPException(422, "Choisissez une marque existante.")
    if not category: raise HTTPException(422, "Choisissez un type de soin existant.")
    row = Product(sku=payload.sku.strip(), slug=payload.slug, name=payload.name.strip(),
        official_name=payload.name.strip(), display_name_fr=payload.name.strip(), brand=brand,
        category=category, size=payload.size.strip(), price_dh=payload.price_dh,
        stock=payload.stock, active=False, publication_status="draft", verification_status="UNVERIFIED")
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, **admin_product_public(row)}


@router.post("/products/{product_id}/images", status_code=201)
async def upload_product_image(product_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    row = db.get(Product, product_id)
    if not row: raise HTTPException(404, "Produit introuvable.")
    data = await file.read(12 * 1024 * 1024 + 1)
    if len(data) > 12 * 1024 * 1024: raise HTTPException(413, "Image supérieure à la limite de 12 Mo.")
    detected = ("image/png" if data.startswith(b"\x89PNG\r\n\x1a\n") else
        "image/jpeg" if data.startswith(b"\xff\xd8\xff") else
        "image/webp" if data.startswith(b"RIFF") and data[8:12] == b"WEBP" else "")
    if not detected or file.content_type not in {detected, "application/octet-stream"}:
        raise HTTPException(415, "Format image invalide. Utilisez PNG, JPEG ou WebP.")
    try:
        from ..media import store_image
        image_url = store_image(data)
    except Exception as exc:
        raise HTTPException(422, f"Image illisible ou non prise en charge : {exc}")
    primary = not any(image.is_primary for image in row.images)
    position = max((image.position for image in row.images), default=-1) + 1
    image = ProductImage(product_id=row.id, image_url=image_url, alt_text=row.display_name_fr or row.name,
        position=position, is_primary=primary)
    row.images.append(image)
    if primary: row.image_url = image_url
    db.commit()
    db.refresh(image)
    return {"id": image.id, "image_url": image.image_url, "position": image.position, "is_primary": image.is_primary}


def require_product_publication_ready(row: Product) -> None:
    if row.price_dh <= 0:
        raise HTTPException(422, "Un produit publié exige un prix MAD strictement positif.")
    if not row.research_record:
        return
    if "MANUAL_REVIEW_POSSIBLE_DUPLICATE" in (row.research_record.commercial_hold_reason or ""):
        raise HTTPException(422, "Résolvez le rapprochement d’identité signalé avant la publication.")
    has_media = bool(row.image_url or row.images)
    has_content = bool(str(row.short_description or "").strip() and
        (str(row.description or "").strip() or str(row.manufacturer_description or "").strip()))
    missing = []
    if not has_media: missing.append("média local approuvé")
    if not has_content: missing.append("contenu produit validé")
    if missing:
        raise HTTPException(422, "Fiche de recherche incomplète : ajoutez " + " et ".join(missing) + " avant publication.")


@router.patch("/products/{product_id}")
def update_product(product_id: int, payload: ProductPatch, db: Session = Depends(get_db)):
    row = db.get(Product, product_id)
    if not row: raise HTTPException(404, "Produit introuvable.")
    previous_status = row.publication_status
    values = payload.model_dump(exclude_unset=True)
    details = row.metadata_record or ProductMetadata(product_id=row.id)
    if row.metadata_record is None: row.metadata_record = details
    if "category_slug" in values:
        category = db.scalar(select(Category).where(Category.slug == values.pop("category_slug")))
        if not category: raise HTTPException(422, "Type de soin inconnu.")
        row.category = category
        row.product_subtype = None
    if "product_subtype_slug" in values:
        subtype_slug = values.pop("product_subtype_slug")
        if subtype_slug:
            subtype = db.scalar(select(ProductSubtype).where(ProductSubtype.slug == subtype_slug,
                ProductSubtype.product_type_id == row.category.id))
            if not subtype: raise HTTPException(422, "Sous-type inconnu pour ce type de soin.")
            row.product_subtype = subtype
        else: row.product_subtype = None
    for key, model, attribute in [
        ("skin_type_slugs", SkinType, "skin_types"), ("concern_slugs", Concern, "concerns"),
        ("ingredient_slugs", Ingredient, "ingredients")]:
        if key in values:
            slugs = list(dict.fromkeys(values.pop(key)))
            found = db.scalars(select(model).where(model.slug.in_(slugs))).all() if slugs else []
            if len(found) != len(slugs): raise HTTPException(422, "Une valeur de taxonomie est inconnue.")
            setattr(row, attribute, found)
    for key in ("usage_time", "routine_step", "search_aliases", "official_source_name", "new_until"):
        if key in values:
            value = values.pop(key)
            if key == "usage_time" and value not in {"", "am", "pm", "both"}:
                raise HTTPException(422, "Utilisation invalide.")
            setattr(details, key, value)
    if values.pop("mark_verified", False):
        values["verification_status"] = "VERIFIED"
    status = values.get("publication_status")
    if status is not None:
        status = status.lower()
        if status not in {"draft", "published", "archived"}: raise HTTPException(422, "État de publication invalide.")
        values["publication_status"] = status
        values["active"] = status == "published"
    if "active" in values and "publication_status" not in values:
        values["publication_status"] = "published" if values["active"] else "archived"
    verification = values.get("verification_status")
    if verification is not None and verification.upper() not in {"UNVERIFIED", "PARTIAL", "VERIFIED", "NEEDS_REVIEW"}:
        raise HTTPException(422, "État de vérification invalide.")
    if verification is not None: values["verification_status"] = verification.upper()
    if values.get("classification_verified") is not None:
        row.classification_verified_at = now() if values["classification_verified"] else None
    if values.get("verification_status", row.verification_status) == "VERIFIED":
        if not values.get("official_source_url", row.official_source_url) or not details.official_source_name:
            raise HTTPException(422, "Une fiche vérifiée exige une source officielle et son nom.")
        if verification is not None: details.verified_at = now()
    if "official_source_url" in values and values["official_source_url"]:
        import re
        from urllib.parse import urlparse
        parsed = urlparse(values["official_source_url"])
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise HTTPException(422, "La source officielle doit être une URL http(s) complète.")
    if "barcode" in values:
        values["barcode"] = (values["barcode"] or "").strip() or None
        if values["barcode"] and db.scalar(select(Product.id).where(Product.barcode == values["barcode"], Product.id != row.id)):
            raise HTTPException(422, "Ce code-barres est déjà utilisé.")
    if "image_url" in values:
        image_url = (values.pop("image_url") or "").strip()
        if image_url.startswith(("http://", "https://")):
            raise HTTPException(422, "Importez une image locale plutôt que de conserver une URL distante.")
        if image_url:
            from ..scripts.import_products import safe_public_image
            try: safe_public_image(image_url)
            except ValueError as exc: raise HTTPException(422, str(exc))
        row.image_url = image_url
        if not image_url:
            for image in list(row.images): db.delete(image)
        if image_url:
            primary = db.scalar(select(ProductImage).where(ProductImage.product_id == row.id, ProductImage.is_primary.is_(True)))
            if primary: primary.image_url = image_url
            else: db.add(ProductImage(product_id=row.id, image_url=image_url, alt_text=row.display_name_fr or row.name, position=max([item.position for item in row.images], default=-1) + 1, is_primary=True))
    for key, value in values.items():
        setattr(row, key, value)
        if key == "stock": row.stock_is_sample = False
    if row.publication_status == "published" and row.price_dh <= 0:
        raise HTTPException(422, "Un produit publié exige un prix MAD strictement positif.")
    if previous_status != "published" and row.publication_status == "published":
        require_product_publication_ready(row)
    if previous_status != "published" and row.publication_status == "published" and row.research_record:
        row.research_record.commercial_ready = True
        row.research_record.commercial_hold_reason = ""
        row.research_record.pdp_content_status = "READY"
        if row.image_url or row.images:
            row.research_record.media_status = "APPROVED_LOCAL"
        if "price_dh" in payload.model_fields_set:
            row.research_record.price_source = "MERCHANT_ADMIN"
    elif row.research_record:
        research = row.research_record
        if "price_dh" in payload.model_fields_set and row.price_dh > 0:
            research.price_source = "MERCHANT_ADMIN"
        if any(key in payload.model_fields_set for key in ("price_dh", "image_url", "short_description", "description", "manufacturer_description")):
            missing = []
            if row.price_dh <= 0: missing.append("MISSING_MAD_PRICE")
            if not (row.image_url or row.images): missing.append("MISSING_MEDIA")
            if not (str(row.short_description or "").strip() and
                    (str(row.description or "").strip() or str(row.manufacturer_description or "").strip())):
                missing.append("MISSING_CONTENT")
            if "MANUAL_REVIEW_POSSIBLE_DUPLICATE" in (research.commercial_hold_reason or ""):
                missing.append("MANUAL_REVIEW_POSSIBLE_DUPLICATE")
            research.commercial_ready = False
            research.commercial_hold_reason = "|".join(missing)
    row.updated_at = now()
    db.commit()
    return admin_product_public(row)


class ProductBulkIn(BaseModel):
    product_ids: list[int] | None = Field(None, min_length=1, max_length=100)
    selection: dict | None = None
    publication_status: str | None = None
    featured: bool | None = None
    low_stock_threshold: int | None = Field(None, ge=0)
    category_slug: str | None = None


@router.post("/products/bulk")
def bulk_products(payload: ProductBulkIn, db: Session = Depends(get_db)):
    selection = payload.selection
    if selection:
        mode = selection.get("mode")
        if mode == "explicit":
            ids = list(dict.fromkeys(selection.get("ids") or []))
            if not ids or len(ids) > 100: raise HTTPException(422, "La sélection explicite doit contenir de 1 à 100 produits.")
            rows = db.scalars(select(Product).where(Product.id.in_(ids))).all()
            if len(rows) != len(ids): raise HTTPException(404, "Un ou plusieurs produits sont introuvables.")
        elif mode == "all_matching":
            filters = selection.get("filters") or {}
            allowed = {"q", "publication_status", "verification_status", "inventory_status", "brand_slug",
                "product_type_slug", "skin_type_slug", "concern_slug", "readiness"}
            if set(filters) - allowed: raise HTTPException(422, "Le périmètre de sélection contient des filtres inconnus.")
            excluded = list(dict.fromkeys(selection.get("excluded_ids") or []))
            where = product_where(filters)
            stmt = select(Product).where(*where)
            if excluded: stmt = stmt.where(Product.id.not_in(excluded))
            rows = db.scalars(stmt).all()
        else:
            raise HTTPException(422, "Mode de sélection invalide.")
    else:
        ids = list(dict.fromkeys(payload.product_ids or []))
        if not ids: raise HTTPException(422, "Sélectionnez au moins un produit.")
        rows = db.scalars(select(Product).where(Product.id.in_(ids))).all()
        if len(rows) != len(ids): raise HTTPException(404, "Un ou plusieurs produits sont introuvables.")
    values = payload.model_dump(exclude_unset=True, exclude_none=True, exclude={"product_ids", "selection"})
    if not values: raise HTTPException(422, "Choisissez une action à appliquer.")
    if "publication_status" in values:
        status = values["publication_status"].lower()
        if status not in {"draft", "published", "archived"}: raise HTTPException(422, "État de publication invalide.")
        skipped = []
        for row in rows:
            if status == "published" and row.publication_status != "published":
                try: require_product_publication_ready(row)
                except HTTPException as exc:
                    skipped.append({"id": row.id, "reason": str(exc.detail)})
                    continue
            row.publication_status = status
            row.active = status == "published"
            if status == "published" and row.research_record:
                row.research_record.commercial_ready = True
                row.research_record.commercial_hold_reason = ""
        rows = [row for row in rows if not any(item["id"] == row.id for item in skipped)]
    else:
        skipped = []
    if "featured" in values:
        for row in rows: row.featured = values["featured"]
    if "low_stock_threshold" in values:
        for row in rows: row.low_stock_threshold = values["low_stock_threshold"]
    if "category_slug" in values:
        category = db.scalar(select(Category).where(Category.slug == values["category_slug"]))
        if not category: raise HTTPException(422, "Type de soin inconnu.")
        for row in rows: row.category = category; row.product_subtype = None
    db.commit()
    return {"matched": len(rows) + len(skipped), "updated": len(rows), "skipped": skipped, "errors": []}


@router.get("/cities")
def cities(db: Session = Depends(get_db)):
    return [{"id": c.id, "name": c.name, "region": c.region,
        "shipping_dh": c.shipping_dh, "delivery_window": c.delivery_window, "active": c.active}
        for c in db.scalars(select(City).order_by(City.name))]


class CityPatch(BaseModel):
    shipping_dh: int | None = Field(None, ge=0)
    active: bool | None = None
    delivery_window: str | None = None


class CityCreate(BaseModel):
    name: str = Field(min_length=2, max_length=130)
    region: str = Field(default="", max_length=130)
    shipping_dh: int = Field(35, ge=0)
    delivery_window: str = Field(default="24–48h", max_length=50)
    active: bool = True


@router.post("/cities", status_code=201)
def create_city(payload: CityCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if db.scalar(select(City.id).where(func.lower(City.name) == name.casefold())):
        raise HTTPException(409, "Cette ville existe déjà.")
    row = City(name=name, region=payload.region.strip(), shipping_dh=payload.shipping_dh,
        delivery_window=payload.delivery_window.strip(), active=payload.active)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "name": row.name, "region": row.region, "shipping_dh": row.shipping_dh,
        "delivery_window": row.delivery_window, "active": row.active}


@router.patch("/cities/{city_id}")
def update_city(city_id: int, payload: CityPatch, db: Session = Depends(get_db)):
    row = db.get(City, city_id)
    if not row: raise HTTPException(404, "Ville introuvable.")
    for key, value in payload.model_dump(exclude_unset=True).items(): setattr(row, key, value)
    db.commit()
    return {"id": row.id, "name": row.name, "region": row.region, "shipping_dh": row.shipping_dh,
        "delivery_window": row.delivery_window, "active": row.active}


@router.get("/promotions")
def promotions(db: Session = Depends(get_db)):
    return [{"id": p.id, "name": p.name, "code": p.code, "kind": p.kind,
        "amount": p.amount, "minimum_dh": p.minimum_dh, "active": p.active}
        for p in db.scalars(select(Promotion).order_by(Promotion.id.desc()))]


class PromotionPatch(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=150)
    code: str | None = Field(None, max_length=60)
    kind: str | None = None
    amount: int | None = Field(None, ge=0)
    minimum_dh: int | None = Field(None, ge=0)
    active: bool | None = None


@router.patch("/promotions/{promotion_id}")
def update_promotion(promotion_id: int, payload: PromotionPatch, db: Session = Depends(get_db)):
    row = db.get(Promotion, promotion_id)
    if not row: raise HTTPException(404, "Promotion introuvable.")
    values = payload.model_dump(exclude_unset=True)
    kind = values.get("kind", row.kind)
    amount = values.get("amount", row.amount)
    if kind not in {"percent", "fixed", "free_shipping"}:
        raise HTTPException(422, "Type de promotion invalide.")
    if kind == "percent" and amount > 100:
        raise HTTPException(422, "Le pourcentage doit être inférieur ou égal à 100.")
    if "code" in values:
        code = values["code"].strip().upper() if values["code"] else None
        conflict = db.scalar(select(Promotion.id).where(Promotion.code == code, Promotion.id != row.id)) if code else None
        if conflict: raise HTTPException(409, "Ce code existe déjà.")
        values["code"] = code
    for key, value in values.items(): setattr(row, key, value)
    db.commit()
    return {"id": row.id, "name": row.name, "code": row.code, "kind": row.kind,
        "amount": row.amount, "minimum_dh": row.minimum_dh, "active": row.active}


class PromotionIn(BaseModel):
    name: str = Field(min_length=2)
    code: str | None = None
    kind: str
    amount: int = Field(ge=0)
    minimum_dh: int = Field(ge=0)
    active: bool = False


@router.post("/promotions", status_code=201)
def create_promotion(payload: PromotionIn, db: Session = Depends(get_db)):
    if payload.kind not in {"percent", "fixed", "free_shipping"}:
        raise HTTPException(422, "Type de promotion invalide.")
    if payload.kind == "percent" and payload.amount > 100:
        raise HTTPException(422, "Le pourcentage doit être inférieur à 100.")
    code = payload.code.strip().upper() if payload.code else None
    if code and db.scalar(select(Promotion).where(Promotion.code == code)):
        raise HTTPException(409, "Ce code existe déjà.")
    row = Promotion(name=payload.name, code=code, kind=payload.kind, amount=payload.amount,
        minimum_dh=payload.minimum_dh, active=payload.active)
    db.add(row)
    db.commit()
    return {"id": row.id}


@router.get("/settings")
def settings(db: Session = Depends(get_db)):
    return {r.key: r.value for r in db.scalars(select(SiteSetting))}


@router.put("/settings")
def save_settings(payload: dict[str, str], db: Session = Depends(get_db)):
    allowed = {"free_shipping_threshold_dh", "whatsapp_number", "support_phone", "instagram_url", "tiktok_url"}
    for key, value in payload.items():
        if key not in allowed: continue
        row = db.get(SiteSetting, key)
        if not row:
            row = SiteSetting(key=key, value=value)
            db.add(row)
        else: row.value = value
    db.commit()
    return {r.key: r.value for r in db.scalars(select(SiteSetting))}


@router.get("/stock-alerts")
def alerts(db: Session = Depends(get_db)):
    return [{"id": a.id, "product_id": a.product_id, "email": a.email,
        "created_at": a.created_at} for a in db.scalars(select(StockAlert).order_by(StockAlert.id.desc()))]


@router.get("/notification-outbox")
def outbox(db: Session = Depends(get_db)):
    return [{"id": n.id, "order_id": n.order_id, "attempts": n.attempts,
        "sent_at": n.sent_at, "last_error": n.last_error} for n in db.scalars(select(NotificationOutbox).order_by(NotificationOutbox.id.desc()))]


@router.get("/customers")
def customers(db: Session = Depends(get_db)):
    users = db.scalars(select(User).where(User.role == "customer").order_by(User.id.desc())).all()
    return [{"id": u.id, "name": f"{u.first_name} {u.last_name}".strip(), "email": u.email,
        "phone": u.phone, "orders": db.scalar(select(func.count(Order.id)).where(Order.user_id == u.id)),
        "created_at": u.created_at} for u in users]


@router.get("/customers/{customer_id}")
def customer_detail(customer_id: int, db: Session = Depends(get_db)):
    user = db.get(User, customer_id)
    if not user or user.role != "customer": raise HTTPException(404, "Client introuvable.")
    orders = db.scalars(select(Order).where(Order.user_id == user.id).order_by(Order.id.desc())).all()
    return {"id": user.id, "name": f"{user.first_name} {user.last_name}".strip(), "email": user.email,
        "phone": user.phone, "created_at": user.created_at, "orders_count": len(orders),
        "lifetime_value_dh": sum(order.total_dh for order in orders),
        "orders": [{"id": order.id, "number": order.number, "status": order.status, "city": order.city,
            "address": order.address, "district": order.district, "total_dh": order.total_dh,
            "created_at": order.created_at} for order in orders]}


TAXONOMY = {"brands": Brand, "product-types": Category, "skin-types": SkinType,
            "product-subtypes": ProductSubtype, "concerns": Concern, "ingredients": Ingredient}


def taxonomy_model(kind: str):
    model = TAXONOMY.get(kind)
    if not model: raise HTTPException(404, "Taxonomie inconnue.")
    return model


def taxonomy_public(item, kind: str, db: Session) -> dict:
    if kind == "brands":
        count = db.scalar(select(func.count(Product.id)).where(Product.brand_id == item.id, Product.active.is_(True)))
    elif kind == "product-types":
        count = db.scalar(select(func.count(Product.id)).where(Product.category_id == item.id, Product.active.is_(True)))
    elif kind == "skin-types":
        count = db.scalar(select(func.count(Product.id)).where(Product.skin_types.any(SkinType.id == item.id), Product.active.is_(True), Product.classification_verified.is_(True)))
    elif kind == "concerns":
        count = db.scalar(select(func.count(Product.id)).where(Product.concerns.any(Concern.id == item.id), Product.active.is_(True), Product.classification_verified.is_(True)))
    elif kind == "ingredients":
        count = db.scalar(select(func.count(Product.id)).where(Product.ingredients.any(Ingredient.id == item.id), Product.active.is_(True), Product.classification_verified.is_(True)))
    elif kind == "product-subtypes":
        count = db.scalar(select(func.count(Product.id)).where(Product.product_subtype_id == item.id, Product.active.is_(True)))
    else:
        count = 0
    description = getattr(item, "description", getattr(item, "description_fr", ""))
    return {"id": item.id, "name": item.name, "slug": item.slug,
        "description": description, "description_fr": getattr(item, "description_fr", description),
        "logo": getattr(item, "logo", ""), "official_website": getattr(item, "official_website", ""),
        "featured_homepage": getattr(item, "featured_homepage", False),
        "homepage_order": getattr(item, "homepage_order", 0),
        "seo_title": getattr(item, "seo_title", ""), "seo_description": getattr(item, "seo_description", ""),
        "product_type_id": getattr(item, "product_type_id", None),
        "active": getattr(item, "active", True),
        "count": count}


@router.get("/taxonomy/{kind}")
def taxonomy(kind: str, db: Session = Depends(get_db)):
    model = taxonomy_model(kind)
    return [taxonomy_public(item, kind, db) for item in db.scalars(select(model).order_by(model.name)).all()]


class TaxonomyIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=140)
    description: str = ""
    active: bool = True
    logo: str = ""
    official_website: str = ""
    featured_homepage: bool = False
    homepage_order: int = 0
    seo_title: str = ""
    seo_description: str = ""
    product_type_slug: str = ""


@router.post("/taxonomy/{kind}", status_code=201)
def create_taxonomy(kind: str, payload: TaxonomyIn, db: Session = Depends(get_db)):
    model = taxonomy_model(kind)
    if db.scalar(select(model).where((model.slug == payload.slug) | (model.name == payload.name))):
        raise HTTPException(409, "Ce nom ou cette adresse existe déjà.")
    fields = {"name": payload.name.strip(), "slug": payload.slug}
    if hasattr(model, "description"): fields["description"] = payload.description.strip()
    elif kind == "brands": fields["description_fr"] = payload.description.strip()
    if hasattr(model, "active"): fields["active"] = payload.active
    if kind == "brands":
        fields.update(logo=payload.logo.strip(), official_website=payload.official_website.strip(),
            featured_homepage=payload.featured_homepage, homepage_order=payload.homepage_order,
            seo_title=payload.seo_title.strip(), seo_description=payload.seo_description.strip())
    if kind == "product-subtypes":
        category = db.scalar(select(Category).where(Category.slug == payload.product_type_slug))
        if not category: raise HTTPException(422, "Type de soin parent inconnu.")
        fields["product_type_id"] = category.id
    row = model(**fields)
    db.add(row); db.commit(); db.refresh(row)
    return taxonomy_public(row, kind, db)


@router.patch("/taxonomy/{kind}/{item_id}")
def update_taxonomy(kind: str, item_id: int, payload: TaxonomyIn, db: Session = Depends(get_db)):
    model = taxonomy_model(kind)
    row = db.get(model, item_id)
    if not row: raise HTTPException(404, "Entrée introuvable.")
    conflict = db.scalar(select(model).where(((model.slug == payload.slug) | (model.name == payload.name)), model.id != item_id))
    if conflict: raise HTTPException(409, "Ce nom ou cette adresse existe déjà.")
    row.name = payload.name.strip(); row.slug = payload.slug
    if hasattr(row, "description"): row.description = payload.description.strip()
    elif kind == "brands": row.description_fr = payload.description.strip()
    if hasattr(row, "active"): row.active = payload.active
    if kind == "brands":
        row.logo = payload.logo.strip(); row.official_website = payload.official_website.strip()
        row.featured_homepage = payload.featured_homepage; row.homepage_order = payload.homepage_order
        row.seo_title = payload.seo_title.strip(); row.seo_description = payload.seo_description.strip()
    if kind == "product-subtypes":
        category = db.scalar(select(Category).where(Category.slug == payload.product_type_slug))
        if not category: raise HTTPException(422, "Type de soin parent inconnu.")
        row.product_type_id = category.id
    db.commit()
    return taxonomy_public(row, kind, db)


class RoutineStepIn(BaseModel):
    name: str = Field(min_length=2)
    description: str = ""
    category_slug: str = ""
    product_ids: list[int] = []


class RoutineIn(BaseModel):
    name: str = Field(min_length=2)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str = ""
    active: bool = True
    steps: list[RoutineStepIn] = []


def set_routine(row: Routine, payload: RoutineIn, db: Session):
    row.name = payload.name.strip(); row.slug = payload.slug
    row.description = payload.description.strip(); row.active = payload.active
    row.steps.clear()
    if row.id is not None: db.flush()
    for position, step_in in enumerate(payload.steps, 1):
        if step_in.category_slug and not db.scalar(select(Category).where(Category.slug == step_in.category_slug)):
            raise HTTPException(422, "Type de soin inconnu dans une étape.")
        step = RoutineStep(position=position, name=step_in.name.strip(),
            description=step_in.description.strip(), category_slug=step_in.category_slug)
        for index, product_id in enumerate(dict.fromkeys(step_in.product_ids)):
            product = db.get(Product, product_id)
            if not product or not product.active: raise HTTPException(422, "Produit de routine inconnu.")
            step.products.append(RoutineStepProduct(product=product, position=index))
        row.steps.append(step)


@router.get("/routines")
def admin_routines(db: Session = Depends(get_db)):
    return [routine_public(row) | {"active": row.active} for row in db.scalars(select(Routine).order_by(Routine.id)).all()]


@router.post("/routines", status_code=201)
def create_routine(payload: RoutineIn, db: Session = Depends(get_db)):
    if db.scalar(select(Routine).where(Routine.slug == payload.slug)):
        raise HTTPException(409, "Cette adresse existe déjà.")
    row = Routine()
    set_routine(row, payload, db)
    db.add(row); db.commit()
    return routine_public(row) | {"active": row.active}


@router.put("/routines/{routine_id}")
def update_routine(routine_id: int, payload: RoutineIn, db: Session = Depends(get_db)):
    row = db.get(Routine, routine_id)
    if not row: raise HTTPException(404, "Routine introuvable.")
    if db.scalar(select(Routine).where(Routine.slug == payload.slug, Routine.id != routine_id)):
        raise HTTPException(409, "Cette adresse existe déjà.")
    set_routine(row, payload, db)
    db.commit()
    return routine_public(row) | {"active": row.active}


class BundleComponentIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=25)


class BundleIn(BaseModel):
    name: str = Field(min_length=2)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str = ""
    image_url: str = ""
    price_dh: int = Field(ge=0)
    compare_at_dh: int | None = Field(None, ge=0)
    active: bool = False
    items: list[BundleComponentIn] = Field(min_length=2)

    @field_validator("compare_at_dh", mode="before")
    @classmethod
    def round_compare_price_up(cls, value):
        return round_up_to_10_dh(value)


def set_bundle(row: Bundle, payload: BundleIn, db: Session):
    ids = [item.product_id for item in payload.items]
    if len(set(ids)) != len(ids): raise HTTPException(422, "Chaque produit ne doit apparaître qu’une fois dans le pack.")
    products = {p.id: p for p in db.scalars(select(Product).where(Product.id.in_(ids), Product.active.is_(True))).all()}
    if len(products) != len(ids): raise HTTPException(422, "Un composant du pack est introuvable ou inactif.")
    row.name = payload.name.strip(); row.slug = payload.slug
    row.description = payload.description.strip(); row.image_url = payload.image_url.strip() or products[ids[0]].image_url
    row.price_dh = payload.price_dh; row.compare_at_dh = payload.compare_at_dh; row.active = payload.active
    row.items.clear()
    if row.id is not None: db.flush()
    for item in payload.items:
        row.items.append(BundleItem(product=products[item.product_id], quantity=item.quantity))


@router.get("/bundles")
def admin_bundles(db: Session = Depends(get_db)):
    return [bundle_public(row) for row in db.scalars(select(Bundle).order_by(Bundle.id)).all()]


@router.post("/bundles", status_code=201)
def create_bundle(payload: BundleIn, db: Session = Depends(get_db)):
    if db.scalar(select(Bundle).where(Bundle.slug == payload.slug)):
        raise HTTPException(409, "Cette adresse existe déjà.")
    row = Bundle()
    set_bundle(row, payload, db)
    db.add(row); db.commit()
    return bundle_public(row)


@router.put("/bundles/{bundle_id}")
def update_bundle(bundle_id: int, payload: BundleIn, db: Session = Depends(get_db)):
    row = db.get(Bundle, bundle_id)
    if not row: raise HTTPException(404, "Pack introuvable.")
    if db.scalar(select(Bundle).where(Bundle.slug == payload.slug, Bundle.id != bundle_id)):
        raise HTTPException(409, "Cette adresse existe déjà.")
    set_bundle(row, payload, db)
    db.commit()
    return bundle_public(row)


@router.get("/content/{key}")
def admin_content(key: str, db: Session = Depends(get_db)):
    if key not in SCHEMAS: raise HTTPException(404, "Section inconnue.")
    return content_public(db)[key]


@router.put("/content/{key}")
def save_content(key: str, payload: dict, db: Session = Depends(get_db)):
    schema = SCHEMAS.get(key)
    if not schema: raise HTTPException(404, "Section inconnue.")
    try:
        validated = schema.model_validate(payload)
    except ValueError as cause:
        raise HTTPException(422, str(cause)) from cause
    row = db.get(ContentSection, key)
    if not row:
        row = ContentSection(key=key)
        db.add(row)
    row.payload_json = validated.model_dump_json()
    db.commit()
    return validated.model_dump()


class ArticleIn(BaseModel):
    title: str = Field(min_length=5, max_length=240)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    excerpt: str = ""
    body: str = ""
    published: bool = False


def article_admin(row: Article):
    return {"id": row.id, "title": row.title, "slug": row.slug,
        "excerpt": row.excerpt, "body": row.body, "published": row.published,
        "created_at": row.created_at}


@router.get("/articles")
def admin_articles(db: Session = Depends(get_db)):
    return [article_admin(row) for row in db.scalars(select(Article).order_by(Article.id.desc())).all()]


@router.post("/articles", status_code=201)
def create_article(payload: ArticleIn, db: Session = Depends(get_db)):
    if db.scalar(select(Article).where(Article.slug == payload.slug)):
        raise HTTPException(409, "Cette adresse existe déjà.")
    row = Article(**payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return article_admin(row)


@router.put("/articles/{article_id}")
def update_article(article_id: int, payload: ArticleIn, db: Session = Depends(get_db)):
    row = db.get(Article, article_id)
    if not row: raise HTTPException(404, "Conseil introuvable.")
    if db.scalar(select(Article).where(Article.slug == payload.slug, Article.id != article_id)):
        raise HTTPException(409, "Cette adresse existe déjà.")
    for key, value in payload.model_dump().items(): setattr(row, key, value)
    db.commit()
    return article_admin(row)
