import json
import os
import re
import shutil
import unicodedata
from pathlib import Path
from datetime import timedelta
from sqlalchemy import select
from .database import Base, SessionLocal, engine
from .content import seed_content
from .models import (Brand, Bundle, BundleItem, Category, City, Concern, Product,
    ProductMetadata, Routine, RoutineStep, RoutineStepProduct, SiteSetting, SkinType, now)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = PROJECT_ROOT.parent
CATALOG_PATH = WORKSPACE_ROOT / "input" / "products_catalog.json"
IMAGE_SOURCE = WORKSPACE_ROOT / "input"
IMAGE_TARGET = PROJECT_ROOT / "public" / "assets" / "catalog"


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def category_for(name: str) -> tuple[str, str]:
    low = name.lower()
    if any(x in low for x in ("spf", "sunscreen", "sun cream", "sun serum", "sun stick", "sun protector")):
        return "Protection solaire", "protection-solaire"
    if any(x in low for x in ("cleansing", "cleanser", "wash", "foam", "grinding balm")):
        if any(x in low for x in ("oil", "balm")):
            return "Huiles & Baumes", "huiles-baumes"
        return "Nettoyants", "nettoyants"
    if any(x in low for x in ("mask", "masque")):
        return "Masques", "masques"
    if "eye" in low or "lash" in low:
        return "Contour des yeux", "contour-des-yeux"
    if any(x in low for x in ("peel", "exfoliat")):
        return "Exfoliants", "exfoliants"
    if any(x in low for x in ("toner", "essence", "milk")):
        return "Toners & Essences", "toners-essences"
    if any(x in low for x in ("serum", "sérum", "ampoule", "booster shot")):
        return "Sérums & Ampoules", "serums-ampoules"
    if any(x in low for x in ("cream", "crème", "gel", "moistur")):
        return "Crèmes", "cremes"
    return "Coffrets & Autres", "coffrets-autres"


def size_for(name: str) -> str:
    found = re.findall(r"\b\d+(?:[.,]\d+)?\s?(?:ml|g|sheets)\b", name, re.I)
    return found[-1].replace(" ", " ") if found else ""


CITY_SEED = [
    ("Casablanca", "Casablanca-Settat", 25), ("Rabat", "Rabat-Salé-Kénitra", 30),
    ("Salé", "Rabat-Salé-Kénitra", 30), ("Marrakech", "Marrakech-Safi", 35),
    ("Fès", "Fès-Meknès", 35), ("Tanger", "Tanger-Tétouan-Al Hoceïma", 40),
    ("Agadir", "Souss-Massa", 40), ("Meknès", "Fès-Meknès", 35),
    ("Oujda", "Oriental", 45), ("Tétouan", "Tanger-Tétouan-Al Hoceïma", 45),
    ("Kénitra", "Rabat-Salé-Kénitra", 35), ("El Jadida", "Casablanca-Settat", 35),
]

SKIN_TYPE_SEED = [
    ("Peau grasse", "peau-grasse"), ("Peau mixte", "peau-mixte"),
    ("Peau sèche", "peau-seche"), ("Peau sensible", "peau-sensible"),
    ("Peau normale", "peau-normale"),
]
CONCERN_SEED = [
    ("Imperfections", "imperfections"), ("Taches & teint irrégulier", "taches"),
    ("Déshydratation", "deshydratation"), ("Pores & excès de sébum", "pores-sebum"),
    ("Rougeurs", "rougeurs"), ("Barrière cutanée", "barriere-cutanee"),
    ("Éclat", "eclat"), ("Premiers signes de l’âge", "premiers-signes-age"),
]
ROUTINE_SEED = [
    ("simple", "Routine simple", "Trois gestes suffisent pour commencer.", [
        ("Nettoyer", "Un nettoyant pour commencer sur une peau propre.", "nettoyants", ["KG-0062"]),
        ("Hydrater", "Choisissez une crème selon vos préférences.", "cremes", ["KG-0059"]),
        ("Protéger", "Terminez avec une protection solaire le matin.", "protection-solaire", ["KG-0023"]),
    ]),
    ("matin", "Routine du matin", "Une séquence courte pour commencer la journée.", [
        ("Nettoyer", "Nettoyez en douceur.", "nettoyants", ["KG-0062"]),
        ("Traiter", "Un soin ciblé si vous en souhaitez un.", "serums-ampoules", ["KG-0063"]),
        ("Hydrater", "Apportez du confort à la peau.", "cremes", ["KG-0059"]),
        ("Protéger", "Appliquez une protection solaire.", "protection-solaire", ["KG-0023"]),
    ]),
    ("soir", "Routine du soir", "Des gestes simples après la journée.", [
        ("Nettoyer", "Retirez les produits de la journée.", "huiles-baumes", ["KG-0061"]),
        ("Traiter", "Ajoutez un soin si votre routine en a besoin.", "serums-ampoules", ["KG-0063"]),
        ("Hydrater", "Terminez avec une crème.", "cremes", ["KG-0059"]),
    ]),
    ("double-nettoyage", "Double nettoyage", "Deux étapes de nettoyage, puis votre soin habituel.", [
        ("Huile nettoyante", "Première étape sur peau sèche.", "huiles-baumes", ["KG-0061"]),
        ("Nettoyant", "Complétez avec un nettoyant à rincer.", "nettoyants", ["KG-0062"]),
    ]),
]


def import_catalog(demo_stock: bool | None = None):
    """Idempotent import. Retail prices come from the source; stock is explicit demo data only."""
    # Production schemas are created by Alembic before the API starts. The local
    # SQLite preview can still bootstrap itself without an extra setup command.
    if os.getenv("APP_ENV") != "production":
        Base.metadata.create_all(engine)
    if demo_stock is None:
        demo_stock = os.getenv("GALLERY_DEMO_STOCK", "0" if os.getenv("APP_ENV") == "production" else "1") == "1"
    rows = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    IMAGE_TARGET.mkdir(parents=True, exist_ok=True)
    with SessionLocal() as db:
        brands = {b.name: b for b in db.scalars(select(Brand)).all()}
        categories = {c.slug: c for c in db.scalars(select(Category)).all()}
        if "serums" in categories and "serums-ampoules" not in categories:
            categories["serums"].slug = "serums-ampoules"
            categories["serums-ampoules"] = categories.pop("serums")
        existing = {p.sku: p for p in db.scalars(select(Product)).all()}
        imported = 0
        for index, row in enumerate(rows, 1):
            brand_name = row.get("brand") or row["name"].split(" ")[0]
            if brand_name not in brands:
                brands[brand_name] = Brand(name=brand_name, slug=slugify(brand_name))
                db.add(brands[brand_name])
                db.flush()
            category_name, category_slug = category_for(row["name"])
            if category_slug not in categories:
                categories[category_slug] = Category(name=category_name, slug=category_slug)
                db.add(categories[category_slug])
                db.flush()
            sku = f"KG-{index:04d}"
            source = IMAGE_SOURCE / row["pic"]
            image_url = ""
            if source.is_file():
                destination = IMAGE_TARGET / source.name
                if not destination.exists():
                    shutil.copy2(source, destination)
                image_url = f"/assets/catalog/{source.name}"
            product = existing.get(sku)
            if product is None:
                product = Product(sku=sku, slug=f"{slugify(row['name'])}-{index:04d}", name=row["name"],
                    brand_id=brands[brand_name].id, category_id=categories[category_slug].id,
                    image_url=image_url, size=size_for(row["name"]), price_dh=int(row["retail_sell_price"]),
                    cost_dh=int(row["buy_price"]), wholesale_dh=int(row["mass_sell_price"]),
                    stock=10 if demo_stock else 0, stock_is_sample=demo_stock,
                    active=brand_name not in ("Acretin", "Skinoren"),
                    featured=index in (6, 10, 13, 53, 71), new_arrival=index <= 12)
                db.add(product)
                existing[sku] = product
                imported += 1
            else:
                product.image_url = image_url or product.image_url
        db.flush()
        for product in existing.values():
            if product.metadata_record is None:
                db.add(ProductMetadata(product_id=product.id,
                    new_until=now() + timedelta(days=30) if product.new_arrival else None))
        for name, slug in SKIN_TYPE_SEED:
            if not db.scalar(select(SkinType).where(SkinType.slug == slug)):
                db.add(SkinType(name=name, slug=slug))
        for name, slug in CONCERN_SEED:
            if not db.scalar(select(Concern).where(Concern.slug == slug)):
                db.add(Concern(name=name, slug=slug))
        for slug, name, description, steps in ROUTINE_SEED:
            if db.scalar(select(Routine).where(Routine.slug == slug)):
                continue
            routine = Routine(slug=slug, name=name, description=description)
            for position, (step_name, step_description, category_slug, skus) in enumerate(steps, 1):
                step = RoutineStep(position=position, name=step_name,
                    description=step_description, category_slug=category_slug)
                for index, sku in enumerate(skus):
                    product = existing.get(sku)
                    if product:
                        step.products.append(RoutineStepProduct(product=product, position=index))
                routine.steps.append(step)
            db.add(routine)
        if not db.scalar(select(Bundle).where(Bundle.slug == "duo-double-nettoyage")):
            oil, foam = existing.get("KG-0061"), existing.get("KG-0062")
            if oil and foam:
                db.add(Bundle(slug="duo-double-nettoyage", name="Duo Double Nettoyage",
                    description="L’huile nettoyante et le nettoyant moussant SKIN1004 réunis dans un duo.",
                    image_url=oil.image_url, price_dh=oil.price_dh + foam.price_dh, active=True,
                    items=[BundleItem(product=oil, quantity=1), BundleItem(product=foam, quantity=1)]))
        for name, region, fee in CITY_SEED:
            if not db.scalar(select(City).where(City.name == name)):
                db.add(City(name=name, region=region, shipping_dh=fee))
        defaults = {"free_shipping_threshold_dh": "500", "whatsapp_number": "", "support_phone": "", "instagram_url": "", "tiktok_url": ""}
        for key, value in defaults.items():
            if not db.get(SiteSetting, key):
                db.add(SiteSetting(key=key, value=value))
        seed_content(db)
        db.commit()
    return {"source_rows": len(rows), "new_products": imported}


if __name__ == "__main__":
    print(import_catalog())
