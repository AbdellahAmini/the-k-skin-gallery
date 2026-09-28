from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..content import SCHEMAS, content_public
from ..models import (Article, Brand, Bundle, BundleItem, Category, City, Collection, Concern, ContentSection, Ingredient,
    InventoryReservation, NotificationOutbox, Order, OrderStatusHistory, Product, ProductMetadata,
    Promotion, Routine, RoutineStep, RoutineStepProduct, SiteSetting, SkinType, StockAlert, User, now)
from ..security import admin_user
from ..services import bundle_public, product_public
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
        "out_of_stock": db.scalar(select(func.count(Product.id)).where(Product.stock == 0, Product.active.is_(True))),
        "low_stock": db.scalar(select(func.count(Product.id)).where(Product.stock > 0, Product.stock <= 3, Product.active.is_(True)))}


@router.get("/orders")
def orders(status: str = "", db: Session = Depends(get_db)):
    stmt = select(Order).order_by(Order.id.desc())
    if status: stmt = stmt.where(Order.status == status)
    return [order_admin(o) for o in db.scalars(stmt).all()]


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


@router.get("/products")
def products(db: Session = Depends(get_db)):
    rows = db.scalars(select(Product).order_by(Product.id)).all()
    return [{**product_public(p), "active": p.active, "cost_dh": p.cost_dh,
        "wholesale_dh": p.wholesale_dh, "stock_is_sample": p.stock_is_sample} for p in rows]


class ProductPatch(BaseModel):
    price_dh: int | None = Field(None, ge=0)
    compare_at_dh: int | None = Field(None, ge=0)
    stock: int | None = Field(None, ge=0)
    active: bool | None = None
    featured: bool | None = None
    new_arrival: bool | None = None
    short_description: str | None = None
    description: str | None = None
    usage_instructions: str | None = None
    inci: str | None = None
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


@router.patch("/products/{product_id}")
def update_product(product_id: int, payload: ProductPatch, db: Session = Depends(get_db)):
    row = db.get(Product, product_id)
    if not row: raise HTTPException(404, "Produit introuvable.")
    values = payload.model_dump(exclude_unset=True)
    details = row.metadata_record or ProductMetadata(product_id=row.id)
    if row.metadata_record is None: db.add(details)
    if "category_slug" in values:
        category = db.scalar(select(Category).where(Category.slug == values.pop("category_slug")))
        if not category: raise HTTPException(422, "Type de soin inconnu.")
        row.category = category
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
        if not (values.get("official_source_url", row.official_source_url)):
            raise HTTPException(422, "Ajoutez une source officielle avant de marquer la fiche vérifiée.")
        details.verified_at = now()
    for key, value in values.items():
        setattr(row, key, value)
        if key == "stock": row.stock_is_sample = False
    db.commit()
    return {**product_public(row), "active": row.active, "cost_dh": row.cost_dh,
        "wholesale_dh": row.wholesale_dh}


@router.get("/cities")
def cities(db: Session = Depends(get_db)):
    return [{"id": c.id, "name": c.name, "region": c.region,
        "shipping_dh": c.shipping_dh, "active": c.active} for c in db.scalars(select(City).order_by(City.name))]


class CityPatch(BaseModel):
    shipping_dh: int | None = Field(None, ge=0)
    active: bool | None = None
    delivery_window: str | None = None


@router.patch("/cities/{city_id}")
def update_city(city_id: int, payload: CityPatch, db: Session = Depends(get_db)):
    row = db.get(City, city_id)
    if not row: raise HTTPException(404, "Ville introuvable.")
    for key, value in payload.model_dump(exclude_unset=True).items(): setattr(row, key, value)
    db.commit()
    return {"id": row.id, "name": row.name, "shipping_dh": row.shipping_dh, "active": row.active}


@router.get("/promotions")
def promotions(db: Session = Depends(get_db)):
    return [{"id": p.id, "name": p.name, "code": p.code, "kind": p.kind,
        "amount": p.amount, "minimum_dh": p.minimum_dh, "active": p.active}
        for p in db.scalars(select(Promotion).order_by(Promotion.id.desc()))]


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
    return [{"id": u.id, "name": f"{u.first_name} {u.last_name}".strip(), "email": u.email,
        "phone": u.phone, "orders": db.scalar(select(func.count(Order.id)).where(Order.user_id == u.id))}
        for u in db.scalars(select(User).where(User.role == "customer").order_by(User.id.desc()))]


TAXONOMY = {"brands": Brand, "product-types": Category, "skin-types": SkinType,
            "concerns": Concern, "ingredients": Ingredient}


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
        count = db.scalar(select(func.count(Product.id)).where(Product.skin_types.any(SkinType.id == item.id), Product.active.is_(True)))
    elif kind == "concerns":
        count = db.scalar(select(func.count(Product.id)).where(Product.concerns.any(Concern.id == item.id), Product.active.is_(True)))
    elif kind == "ingredients":
        count = db.scalar(select(func.count(Product.id)).where(Product.ingredients.any(Ingredient.id == item.id), Product.active.is_(True)))
    else:
        count = 0
    return {"id": item.id, "name": item.name, "slug": item.slug,
        "description": getattr(item, "description", ""), "active": getattr(item, "active", True),
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


@router.post("/taxonomy/{kind}", status_code=201)
def create_taxonomy(kind: str, payload: TaxonomyIn, db: Session = Depends(get_db)):
    model = taxonomy_model(kind)
    if db.scalar(select(model).where((model.slug == payload.slug) | (model.name == payload.name))):
        raise HTTPException(409, "Ce nom ou cette adresse existe déjà.")
    fields = {"name": payload.name.strip(), "slug": payload.slug}
    if hasattr(model, "description"): fields["description"] = payload.description.strip()
    if hasattr(model, "active"): fields["active"] = payload.active
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
    if hasattr(row, "active"): row.active = payload.active
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
