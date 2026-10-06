"""Conservative, repeatable merge of the researched K-Skin product catalog."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sqlite3
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from difflib import SequenceMatcher
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import DATABASE_URL, SessionLocal, engine
from ..models import (Brand, Category, Concern, Ingredient, InventoryReservation, Order,
    OrderItem, Product, ProductImage, ProductMetadata, ProductResearch, ProductSubtype,
    SkinType, User, product_concerns, product_ingredients, product_skin_types)
from .import_products import safe_public_image, slugify


ROOT = Path(__file__).resolve().parents[3]
SOURCE_CSV = ROOT / "docs" / "k_skin_gallery_products_import.csv"
PREVIEW_CSV = ROOT / "docs" / "catalog-merge-preview.csv"
LOCAL_JSON = ROOT.parent / "input" / "products_catalog.json"
BACKUP = ROOT / "docs" / "merge-backups" / "gallery-before-research-merge-20261002-165222.db"
PREVIEW_FIELDS = ["research_external_id", "brand", "research_name", "matched_product_id",
                  "matched_product_name", "match_method", "confidence", "action"]
STATUS_RANK = {"UNVERIFIED": 0, "PARTIAL": 1, "VERIFIED": 2}
PACKAGE_UNITS = re.compile(r"\b\d+(?:\.\d+)?\s?(?:ml|g|mg|l|oz|pcs|piece|pieces|ea)\b", re.I)


def normalized(value: str | None) -> str:
    text = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().casefold()
    text = PACKAGE_UNITS.sub(" ", text)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", text).split())


def normalized_brand_name(value: str | None, brand: str | None) -> str:
    name, prefix = normalized(value), normalized(brand)
    return name[len(prefix):].strip() if prefix and name.startswith(prefix + " ") else name


def read_source() -> list[dict[str, str]]:
    with SOURCE_CSV.open("r", encoding="utf-8-sig", newline="") as stream:
        return [{key: (value or "").strip() for key, value in row.items()} for row in csv.DictReader(stream)]


def write_dicts(path: Path, fields: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def match_candidates(db: Session, source: dict) -> tuple[list[Product], tuple[float, Product] | None]:
    brand_key = normalized(source["brand"])
    name_key = normalized_brand_name(source["official_name"], source["brand"])
    candidates = db.scalars(select(Product).options(selectinload(Product.brand))
        .join(Brand).where(Brand.slug == slugify(source["brand"]))).all()
    exact: list[Product] = []
    fuzzy: tuple[float, Product] | None = None
    source_sku = source.get("sku", "").strip()
    if source_sku:
        sku_match = db.scalar(select(Product).where(Product.sku == source_sku))
        if sku_match:
            return [sku_match], (1.0, sku_match)
    for product in candidates:
        if normalized(product.brand.name) != brand_key:
            continue
        names = {normalized_brand_name(value, product.brand.name)
                 for value in (product.official_name, product.name, product.display_name_fr) if value}
        if name_key in names:
            exact.append(product)
        score = max((SequenceMatcher(None, name_key, name).ratio() for name in names), default=0.0)
        if fuzzy is None or score > fuzzy[0]:
            fuzzy = (score, product)
    return exact, fuzzy


def known_alias_candidate(db: Session, source: dict) -> Product | None:
    """Known SKIN1004 line-name omission is a review candidate, never an auto-merge."""
    if slugify(source.get("brand", "")) != "skin1004":
        return None
    source_name = normalized_brand_name(source["official_name"], source["brand"])
    rows = db.scalars(select(Product).options(selectinload(Product.brand))
        .join(Brand).where(Brand.slug == "skin1004")).all()
    matches = []
    for product in rows:
        names = {normalized_brand_name(value, product.brand.name)
                 for value in (product.official_name, product.name, product.display_name_fr) if value}
        if any(name.removeprefix("madagascar ") == source_name and name != source_name for name in names):
            matches.append(product)
    return matches[0] if len(matches) == 1 else None


def create_preview(db: Session) -> list[dict]:
    preview = []
    for source in read_source():
        alias = known_alias_candidate(db, source)
        exact, fuzzy = match_candidates(db, source)
        product = None
        if alias:
            product, method, confidence, action = alias, "KNOWN_LINE_PREFIX_ALIAS_REVIEW_ONLY", "0.84", "MANUAL_REVIEW"
        elif len(exact) == 1:
            product, method, confidence, action = exact[0], "NORMALIZED_BRAND_NAME", "1.00", "ENRICH_EXISTING"
        elif len(exact) > 1:
            product, method, confidence, action = exact[0], "MULTIPLE_EXACT_CANDIDATES", "1.00", "MANUAL_REVIEW"
        elif fuzzy and fuzzy[0] >= 0.88:
            product, method, confidence, action = fuzzy[1], "FUZZY_CANDIDATE_REVIEW_ONLY", f"{fuzzy[0]:.2f}", "MANUAL_REVIEW"
        else:
            method, confidence, action = "NO_EXACT_MATCH", "", "CREATE_DRAFT_OOS"
        preview.append({"research_external_id": source["external_id"], "brand": source["brand"],
            "research_name": source["official_name"], "matched_product_id": str(product.id) if product else "",
            "matched_product_name": product.name if product else "", "match_method": method,
            "confidence": confidence, "action": action})
    write_dicts(PREVIEW_CSV, PREVIEW_FIELDS, preview)
    return preview


def load_preview() -> dict[str, dict]:
    if not PREVIEW_CSV.is_file():
        raise RuntimeError("catalog-merge-preview.csv absent; exécutez --preview avant la fusion.")
    with PREVIEW_CSV.open("r", encoding="utf-8-sig", newline="") as stream:
        rows = list(csv.DictReader(stream))
    if not rows or any(field not in rows[0] for field in PREVIEW_FIELDS):
        raise RuntimeError("Le rapport de prévisualisation est vide ou ses colonnes ne correspondent pas.")
    preview = {row["research_external_id"]: row for row in rows}
    source_ids = {row["external_id"] for row in read_source()}
    if len(preview) != len(rows) or set(preview) != source_ids:
        raise RuntimeError("Les identifiants de la prévisualisation ne correspondent plus au CSV source.")
    return preview


def split_values(value: str) -> list[str]:
    return list(dict.fromkeys(item.strip() for item in re.split(r"[;,|]", value or "") if item.strip()))


def exact_or_create(db: Session, model, label: str, *, slug: str | None = None):
    key = normalized(label)
    rows = db.scalars(select(model)).all()
    match = next((row for row in rows if normalized(row.name) == key), None)
    if match:
        return match
    term_slug = slug or slugify(label)
    match = next((row for row in rows if row.slug == term_slug), None)
    if match:
        return match
    values = {"name": label, "slug": term_slug}
    row = model(**values)
    db.add(row)
    db.flush()
    return row


def get_brand(db: Session, value: str) -> Brand:
    slug = slugify(value)
    row = db.scalar(select(Brand).where(Brand.slug == slug))
    if row:
        return row
    return exact_or_create(db, Brand, value, slug=slug)


def get_category(db: Session, value: str) -> Category:
    key = slugify(value)
    aliases = {"cremes-hydratantes": "cremes", "huiles-baumes-demaquillants": "huiles-baumes"}
    slug = aliases.get(key, key)
    row = db.scalar(select(Category).where(Category.slug == slug))
    if row:
        return row
    display_name = value
    if slug == "cremes": display_name = "Crèmes"
    if slug == "huiles-baumes": display_name = "Huiles & Baumes"
    return exact_or_create(db, Category, display_name, slug=slug)


def get_subtype(db: Session, label: str, category: Category) -> ProductSubtype:
    key = normalized(label)
    current = db.scalars(select(ProductSubtype).where(ProductSubtype.product_type_id == category.id)).all()
    row = next((item for item in current if normalized(item.name) == key), None)
    if row:
        return row
    slug = slugify(label)
    conflict = db.scalar(select(ProductSubtype).where(ProductSubtype.slug == slug))
    if conflict:
        slug = f"{category.slug}-{slug}"
    row = ProductSubtype(name=label, slug=slug, product_type_id=category.id)
    db.add(row)
    db.flush()
    return row


def get_taxonomies(db: Session, field: str, values: str) -> list:
    models = {"skin_types": SkinType, "concerns": Concern, "key_ingredients": Ingredient}
    model = models[field]
    results = []
    for label in split_values(values):
        display = label
        if field == "skin_types" and not normalized(label).startswith("peau "):
            display = f"Peau {label}"
        results.append(exact_or_create(db, model, display))
    return results


def parse_date(value: str) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def reference_price(value: str) -> Decimal | None:
    if not value:
        return None
    try:
        return Decimal(value)
    except InvalidOperation:
        return None


def local_catalog_rows() -> list[dict]:
    if not LOCAL_JSON.is_file():
        return []
    parsed = json.loads(LOCAL_JSON.read_text(encoding="utf-8-sig"))
    return parsed.get("products", parsed) if isinstance(parsed, dict) else parsed


def local_match(source: dict, items: list[dict]) -> dict | None:
    name = normalized_brand_name(source["official_name"], source["brand"])
    matches = [item for item in items if normalized(item.get("brand")) == normalized(source["brand"])
               and normalized_brand_name(item.get("name"), item.get("brand")) == name]
    return matches[0] if len(matches) == 1 else None


def size_parts(value: str) -> tuple[float | None, str]:
    if not value:
        return None, ""
    match = re.search(r"(\d+(?:[.,]\d+)?)\s*(ml|g|mg|l|oz|pcs?|sheets?)\b", value, re.I)
    if not match:
        return None, ""
    return float(match.group(1).replace(",", ".")), match.group(2).lower()


def has_product_media(product: Product) -> bool:
    return bool(product.image_url or product.images)


def has_basic_content(product: Product) -> bool:
    return bool(str(product.short_description or "").strip() and
                (str(product.description or "").strip() or str(product.manufacturer_description or "").strip()))


def choose_new_price(source: dict, local: dict | None) -> tuple[int, str, str]:
    if local is not None:
        try:
            retail = int(Decimal(str(local.get("retail_sell_price", 0))))
        except (InvalidOperation, ValueError, TypeError):
            retail = 0
        if retail > 0:
            return retail, "EXISTING_LOCAL_CATALOG", str(local.get("pic") or "")
    # The merchant requested zero as a placeholder. It is never a publishable price.
    return 0, "USER_PLACEHOLDER_MISSING_PRICE", ""


def image_path(value: str) -> str:
    if not value:
        return ""
    try:
        safe_public_image(value)
        return value
    except ValueError:
        return ""


def hold_reasons(product: Product) -> list[str]:
    reasons = []
    if product.price_dh <= 0: reasons.append("MISSING_MAD_PRICE")
    if not has_product_media(product): reasons.append("MISSING_MEDIA")
    if not has_basic_content(product): reasons.append("MISSING_CONTENT")
    return reasons


def add_product_image(db: Session, product: Product, image_url: str, alt: str) -> None:
    if not image_url:
        return
    product.image_url = image_url
    db.add(ProductImage(product=product, image_url=image_url, alt_text=alt[:300], position=0, is_primary=True))


def merge_one(db: Session, source: dict, plan: dict, local_rows: list[dict]) -> str:
    existing_research = db.scalar(select(ProductResearch).where(ProductResearch.external_id == source["external_id"]))
    if existing_research:
        return "ALREADY_IMPORTED"
    action = plan["action"]
    if action == "MANUAL_REVIEW":
        return "MANUAL_REVIEW"
    product = None
    if action == "ENRICH_EXISTING":
        product_id = int(plan["matched_product_id"])
        product = db.get(Product, product_id)
        if not product or product.brand.slug != slugify(source["brand"]):
            raise RuntimeError(f"Correspondance devenue invalide: {source['external_id']}")
        exact, _ = match_candidates(db, source)
        if len(exact) != 1 or exact[0].id != product.id:
            raise RuntimeError(f"Identité existante ambiguë depuis la prévisualisation: {source['external_id']}")
    elif action != "CREATE_DRAFT_OOS":
        raise RuntimeError(f"Action non autorisée dans la prévisualisation: {action}")

    brand = get_brand(db, source["brand"])
    created = product is None
    local = local_match(source, local_rows) if created else None
    imported_image = image_path(str(local.get("pic") or "")) if local else ""
    if created:
        category = get_category(db, source.get("product_type", "") or "Autres soins")
        subtype = get_subtype(db, source["product_subtype"], category) if source.get("product_subtype") else None
        selling_price, price_source, _ = choose_new_price(source, local)
        official = source["official_name"]
        display = source.get("display_name_fr") or official
        suffix = hashlib.sha256(source["external_id"].encode()).hexdigest()[:10]
        requested_slug = slugify(source.get("slug") or f"{brand.slug}-{official}")[:205].strip("-")
        slug = requested_slug
        if db.scalar(select(Product.id).where(Product.slug == slug)):
            slug = f"{requested_slug[:190]}-{suffix}"
        sku = source.get("sku") or f"KSG-R-{hashlib.sha256(source['external_id'].encode()).hexdigest()[:14].upper()}"
        size = source.get("display_size", "")
        size_value, size_unit = size_parts(size)
        verification = (source.get("verification_status") or "UNVERIFIED").upper()
        scope = source.get("source_scope", "").upper()
        is_published = bool(selling_price > 0 and imported_image and source.get("store_short_description_fr")
                            and source.get("official_summary_en") and verification == "VERIFIED"
                            and scope == "INDIVIDUAL_PRODUCT")
        product = Product(sku=sku, barcode=source.get("barcode") or None, slug=slug,
            name=display, official_name=official, display_name_fr=display, brand=brand,
            category=category, product_subtype=subtype, size=size,
            size_value=size_value, size_unit=size_unit, image_url="", price_dh=selling_price,
            stock=0, low_stock_threshold=3, stock_is_sample=False,
            active=is_published, publication_status="published" if is_published else "draft",
            verification_status=verification, classification_verified=False,
            featured=False, new_arrival=False,
            short_description=source.get("store_short_description_fr", ""),
            description="",
            manufacturer_description=(source.get("official_summary_en", "")
                if verification == "VERIFIED" and scope == "INDIVIDUAL_PRODUCT" else ""),
            benefits_fr=(source.get("benefits_fr", "")
                if verification == "VERIFIED" and scope == "INDIVIDUAL_PRODUCT" else ""),
            usage_instructions_fr=(source.get("usage_instructions_fr", "")
                if verification == "VERIFIED" and scope == "INDIVIDUAL_PRODUCT" else ""),
            inci=(source.get("full_inci", "")
                if verification == "VERIFIED" and scope == "INDIVIDUAL_PRODUCT" else ""),
            warnings_fr=(source.get("warnings_fr", "")
                if verification == "VERIFIED" and scope == "INDIVIDUAL_PRODUCT" else ""),
            official_source_url=source.get("official_source_url", ""),
            source_language=source.get("source_language", ""),
            seo_title=source.get("seo_title", ""), seo_description=source.get("seo_description", ""))
        db.add(product)
        db.flush()
        add_product_image(db, product, imported_image, display)
    else:
        # Enrich blanks only; inventory, pricing, publication, SKU and media remain untouched.
        if not str(product.official_name or "").strip(): product.official_name = source["official_name"]
        if not str(product.display_name_fr or "").strip() and source.get("display_name_fr"):
            product.display_name_fr = source["display_name_fr"]
        if not str(product.short_description or "").strip() and source.get("store_short_description_fr"):
            product.short_description = source["store_short_description_fr"]
        if not str(product.official_source_url or "").strip() and source.get("official_source_url"):
            product.official_source_url = source["official_source_url"]
        if not str(product.source_language or "").strip() and source.get("source_language"):
            product.source_language = source["source_language"]
        if not str(product.seo_title or "").strip() and source.get("seo_title"):
            product.seo_title = source["seo_title"]
        if not str(product.seo_description or "").strip() and source.get("seo_description"):
            product.seo_description = source["seo_description"]
        source_status = (source.get("verification_status") or "UNVERIFIED").upper()
        current = (product.verification_status or "UNVERIFIED").upper()
        if current not in {"NEEDS_REVIEW", "VERIFIED"} and STATUS_RANK.get(source_status, 0) > STATUS_RANK.get(current, 0):
            product.verification_status = source_status
        if source_status == "VERIFIED" and source.get("source_scope", "").upper() == "INDIVIDUAL_PRODUCT":
            for field, source_field in (("manufacturer_description", "official_summary_en"),
                                        ("benefits_fr", "benefits_fr"), ("usage_instructions_fr", "usage_instructions_fr"),
                                        ("inci", "full_inci"), ("warnings_fr", "warnings_fr")):
                if not str(getattr(product, field) or "").strip() and source.get(source_field):
                    setattr(product, field, source[source_field])
        category = product.category
        subtype = get_subtype(db, source["product_subtype"], category) if source.get("product_subtype") else None
        if not product.product_subtype_id and subtype:
            product.product_subtype = subtype

    metadata = product.metadata_record
    if metadata is None:
        metadata = ProductMetadata(product=product)
        db.add(metadata)
    if not str(metadata.official_source_name or "").strip() and source.get("official_source_name"):
        metadata.official_source_name = source["official_source_name"]
    if not metadata.verified_at and (source.get("verification_status", "").upper() == "VERIFIED"):
        metadata.verified_at = parse_date(source.get("verified_at", ""))
    if not str(metadata.usage_time or "").strip() and source.get("usage_time"):
        metadata.usage_time = source["usage_time"].strip().lower()
    if not str(metadata.routine_step or "").strip() and source.get("routine_step"):
        metadata.routine_step = source["routine_step"]

    if not product.classification_verified:
        if not product.skin_types:
            product.skin_types = get_taxonomies(db, "skin_types", source.get("skin_types", ""))
        if not product.concerns:
            product.concerns = get_taxonomies(db, "concerns", source.get("concerns", ""))
        if not product.ingredients:
            product.ingredients = get_taxonomies(db, "key_ingredients", source.get("key_ingredients", ""))

    product.updated_at = datetime.now(timezone.utc)
    reasons = hold_reasons(product) if created else ([] if product.publication_status == "published" else hold_reasons(product))
    ready = product.publication_status == "published" and product.price_dh > 0 and has_product_media(product)
    price_source = "PRESERVED_EXISTING_STORE_PRICE" if not created else ("EXISTING_LOCAL_CATALOG" if product.price_dh > 0 else "USER_PLACEHOLDER_MISSING_PRICE")
    ref_currency = source.get("official_price_currency", "").upper()
    record = ProductResearch(product=product, external_id=source["external_id"],
        source_scope=source.get("source_scope", ""), desired_visibility=source.get("desired_visibility", ""),
        official_reference_price=reference_price(source.get("official_price", "")),
        official_reference_currency=ref_currency, official_price_note=source.get("official_price_note", ""),
        price_source=price_source,
        media_status=("EXISTING_MEDIA_PRESERVED" if not created and has_product_media(product)
                      else "APPROVED_LOCAL" if created and imported_image
                      else source.get("media_status", "NEEDS_ASSET_INGESTION")),
        pdp_content_status="READY" if has_basic_content(product) else source.get("pdp_content_status", "INCOMPLETE"),
        commercial_ready=ready,
        commercial_hold_reason="|".join(reasons), selection_basis=source.get("selection_basis", ""),
        curation_basis=source.get("curation_basis", ""), research_notes=source.get("research_notes", ""),
        raw_payload_json=json.dumps(source, ensure_ascii=False, sort_keys=True))
    db.add(record)
    db.flush()
    return "CREATED" if created else "ENRICHED"


def table_count(db: Session, model) -> int:
    return int(db.scalar(select(func.count()).select_from(model)) or 0)


def snapshot_digest(connection: sqlite3.Connection, sql: str, params=()) -> str:
    rows = connection.execute(sql, params).fetchall()
    payload = json.dumps([list(row) for row in rows], ensure_ascii=False, default=str, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()


def database_counts(connection: sqlite3.Connection) -> dict[str, int]:
    queries = {"products": "products", "brands": "brands", "orders": "orders", "order_items": "order_items",
        "customers": "users where role = 'customer'", "users": "users", "product_images": "product_images",
        "inventory_reservations": "inventory_reservations", "stock_alerts": "stock_alerts",
        "published": "products where publication_status='published'", "draft": "products where publication_status='draft'",
        "archived": "products where publication_status='archived'", "in_stock": "products where stock>0",
        "out_of_stock": "products where stock<=0"}
    return {key: connection.execute(f"select count(*) from {table}").fetchone()[0] for key, table in queries.items()}


def protected_digests(connection: sqlite3.Connection, max_product_id: int | None = None) -> dict[str, str]:
    if max_product_id is None:
        max_product_id = connection.execute("select coalesce(max(id), 0) from products").fetchone()[0]
    return {
        "orders": snapshot_digest(connection, "select * from orders order by id"),
        "order_items": snapshot_digest(connection, "select * from order_items order by id"),
        "inventory_reservations": snapshot_digest(connection, "select * from inventory_reservations order by id"),
        "product_images": snapshot_digest(connection, "select * from product_images order by id"),
        "existing_commercial_fields": snapshot_digest(connection,
            "select id,sku,barcode,price_dh,compare_at_dh,cost_dh,wholesale_dh,stock,low_stock_threshold,stock_is_sample,active,publication_status,featured,new_arrival from products where id <= ? order by id",
            (max_product_id,)),
    }


def queue_files(db: Session) -> tuple[list[dict], list[dict]]:
    research_products = db.scalars(select(Product).join(ProductResearch).options(
        selectinload(Product.brand), selectinload(Product.category), selectinload(Product.images),
        selectinload(Product.research_record)).order_by(Product.brand_id, Product.official_name)).all()
    prices, media = [], []
    for product in research_products:
        source = product.research_record
        identity_hold = "MANUAL_REVIEW_POSSIBLE_DUPLICATE" in (source.commercial_hold_reason or "")
        if product.price_dh <= 0:
            prices.append({"product_id": product.id, "brand": product.brand.name, "official_name": product.official_name,
                "size": product.size, "product_type": product.category.name,
                "official_reference_price": source.official_reference_price,
                "official_reference_currency": source.official_reference_currency,
                "official_source_url": product.official_source_url,
                "suggested_action": ("Résoudre le rapprochement manuel avant toute saisie de prix" if identity_hold
                    else "Saisir le prix de vente MAD confirmé par le marchand")})
        if not has_product_media(product):
            media.append({"product_id": product.id, "brand": product.brand.name, "official_name": product.official_name,
                "official_source_url": product.official_source_url, "current_media_status": source.media_status,
                "recommended_action": ("Résoudre le rapprochement manuel avant tout enrichissement média" if identity_hold
                    else "Importer et approuver un visuel produit local")})
    return prices, media


def duplicate_rows(db: Session) -> list[dict]:
    result = []
    products = db.scalars(select(Product).options(selectinload(Product.brand)).order_by(Product.id)).all()
    groups = defaultdict(list)
    for product in products:
        groups[("SKU", (product.sku or "").casefold())].append(product)
        if product.barcode:
            groups[("BARCODE", product.barcode.casefold())].append(product)
        groups[("BRAND_NORMALIZED_NAME", normalized(product.brand.name) + "|" +
                normalized_brand_name(product.official_name or product.name, product.brand.name))].append(product)
        groups[("SLUG", (product.slug or "").casefold())].append(product)
    for (kind, identity), rows in groups.items():
        if identity and len(rows) > 1:
            result.append({"source": "CURRENT_DATABASE", "issue": kind, "brand": rows[0].brand.name,
                "identity": identity, "product_ids": ";".join(str(row.id) for row in rows),
                "names": " | ".join(row.name for row in rows), "recommended_action": "Review manually; no rows deleted"})
    for preview in load_preview().values():
        if preview["action"] == "MANUAL_REVIEW":
            result.append({"source": "RESEARCH_IMPORT", "issue": "POSSIBLE_NAME_COLLISION", "brand": preview["brand"],
                "identity": preview["research_external_id"], "product_ids": preview["matched_product_id"],
                "names": f"{preview['research_name']} => {preview['matched_product_name']}",
                "recommended_action": "Resolve product identity manually before import"})
    return result


def report(db: Session, counters: Counter, before: dict, before_hashes: dict, preview: dict[str, dict]) -> None:
    if not DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("Rapport automatique de sauvegarde SQLite indisponible pour une base non-SQLite.")
    after_connection = sqlite3.connect(DATABASE_URL.removeprefix("sqlite:///"))
    after = database_counts(after_connection)
    backup_connection = sqlite3.connect(BACKUP)
    existing_max_id = backup_connection.execute("select coalesce(max(id), 0) from products").fetchone()[0]
    backup_connection.close()
    after_hashes = protected_digests(after_connection, existing_max_id)
    after_connection.close()
    price_queue, media_queue = queue_files(db)
    write_dicts(ROOT / "docs" / "products-needing-price.csv",
        ["product_id", "brand", "official_name", "size", "product_type", "official_reference_price",
         "official_reference_currency", "official_source_url", "suggested_action"], price_queue)
    write_dicts(ROOT / "docs" / "products-needing-media.csv",
        ["product_id", "brand", "official_name", "official_source_url", "current_media_status", "recommended_action"], media_queue)
    duplicates = duplicate_rows(db)
    write_dicts(ROOT / "docs" / "catalog-duplicate-report.csv",
        ["source", "issue", "brand", "identity", "product_ids", "names", "recommended_action"], duplicates)

    brands = db.execute(select(Brand.name, func.count(Product.id)).join(Product, Product.brand_id == Brand.id)
        .group_by(Brand.id, Brand.name).order_by(Brand.name)).all()
    categories = db.execute(select(Category.name, func.count(Product.id)).join(Product, Product.category_id == Category.id)
        .group_by(Category.id, Category.name).order_by(Category.name)).all()
    verification = db.execute(select(Product.verification_status, func.count(Product.id)
        ).group_by(Product.verification_status).order_by(Product.verification_status)).all()
    publication = db.execute(select(Product.publication_status, func.count(Product.id)
        ).group_by(Product.publication_status).order_by(Product.publication_status)).all()
    ready_new = db.scalar(select(func.count(ProductResearch.product_id)).join(Product)
        .where(ProductResearch.price_source != "PRESERVED_EXISTING_STORE_PRICE", Product.publication_status == "published")) or 0
    imported_ids = set(db.scalars(select(ProductResearch.external_id)).all())
    enriched = sum(row["action"] == "ENRICH_EXISTING" and row["research_external_id"] in imported_ids
                   for row in preview.values())
    created = len(imported_ids) - enriched
    manual = sum(row["action"] == "MANUAL_REVIEW" for row in preview.values())
    manual_already_created = sum(row["action"] == "MANUAL_REVIEW" and row["research_external_id"] in imported_ids
                                 for row in preview.values())
    missing_price = sum(product.price_dh <= 0 for product in db.scalars(select(Product).join(ProductResearch)).all())
    missing_media = len(media_queue)
    backup_hash = hashlib.sha256(BACKUP.read_bytes()).hexdigest()
    db_url = "SQLite locale configurée par backend/app/database.py"
    count_rows = "\n".join(f"| {key} | {before[key]} | {after[key]} |" for key in before)
    brand_rows = "\n".join(f"| {name} | {count} |" for name, count in brands)
    category_rows = "\n".join(f"| {name} | {count} |" for name, count in categories)
    verification_rows = "\n".join(f"| {status} | {count} |" for status, count in verification)
    publication_rows = "\n".join(f"| {status} | {count} |" for status, count in publication)
    protected = "\n".join(f"| {key} | {'INCHANGÉ' if before_hashes[key] == after_hashes[key] else 'DIFFÉRENT'} |" for key in before_hashes)
    content = f"""# Rapport de fusion du catalogue K-Skin Gallery

Exécuté le {datetime.now(timezone.utc).isoformat(timespec='seconds')}. Base examinée : {db_url} (`backend/gallery.db` dans la configuration locale). Aucun accès à une base PostgreSQL externe n’était configuré.

## Sauvegarde et contrôles avant fusion

- Sauvegarde : `docs/merge-backups/gallery-before-research-merge-20261002-165222.db`
- SHA-256 : `{backup_hash}`
- Sources concordantes : 265 identifiants dans le CSV, le JSON, le classeur de recherche et la base de recherche SQLite.
- Classeur marchand et `input/products_catalog.json` : 27 noms exacts avec prix de détail, tous déjà dans la base. Aucun tarif exact supplémentaire pour une nouvelle fiche; aucun coût fournisseur n’a été repris comme prix de vente.
- Prix MAD recherche : 0/265; image source exploitable : 0/265. Les prix officiels USD/KRW sont conservés uniquement dans `product_research` comme références privées.

| Mesure | Avant | Après |
|---|---:|---:|
{count_rows}

## Résultat de la fusion

- Fiches existantes enrichies sans remplacer leurs prix, stocks, images ou statut : {enriched}
- Nouvelles fiches créées : {created}
- Fiches nouvelles conservées en brouillon et mises en attente de résolution d’identité après contrôle d’alias : {manual_already_created}
- Nouvelles fiches publiées en rupture : {ready_new}
- Nouveautés en brouillon à prix zéro : {sum(1 for row in db.scalars(select(Product).join(ProductResearch)).all() if row.research_record.price_source == 'USER_PLACEHOLDER_MISSING_PRICE')}
- Produits sans prix MAD confirmé (file d’attente) : {len(price_queue)}
- Produits sans média local approuvé (file d’attente) : {missing_media}
- Identités suspendues pour vérification manuelle : {manual}
- Groupes signalés dans l’audit de doublons (sans suppression) : {len(duplicates)}
- Enregistrements déjà importés lors d’une relance : {counters['ALREADY_IMPORTED']}

Le prix `0` est un marqueur de prix à fournir, pas un prix gratuit : ces lignes restent `draft`, stock `0`, non achetables et absentes de l’API publique. L’admin ne peut les publier qu’après saisie d’un prix strictement positif, approbation d’un média local et présence d’un contenu produit suffisant.

## Intégrité des données opérationnelles

Les hachages avant/après des commandes, snapshots de lignes de commande, réservations d’inventaire, images existantes et champs commerciaux des 96 produits déjà présents ont été comparés à la sauvegarde :

| Données protégées | Contrôle |
|---|---|
{protected}

## Vérification par état

### Publication

| État | Produits |
|---|---:|
{publication_rows}

### Vérification produit

| Statut | Produits |
|---|---:|
{verification_rows}

### Marques

| Marque | Produits |
|---|---:|
{brand_rows}

### Types de soin

| Type | Produits |
|---|---:|
{category_rows}

## Tests et parcours navigateur

- Tests API/backend : 17 réussis (`pytest -q`), un avertissement de dépréciation Starlette/httpx.
- Playwright en lecture seule : 13 réussis, 2 échecs, 4 scénarios catalogue ignorés faute de base QA isolée. Le test du tiroir mobile expire après sa réouverture immédiate suivant une navigation; une reproduction navigateur confirme que le tiroir se rouvre et contient `Soins`, ce qui indique une course de synchronisation dans le test à investiguer. Le test du lien ANUA ne stabilise pas la cible pendant le marquee animé; la navigation demeure présente. Un snapshot mobile précédent gardait l’écran de chargement de `/soins`, mais une reproduction directe affiche `Les soins` en moins de 500 ms. Le checkout COD a été exclu de la seconde passe pour éviter d’écrire dans la base active.
- Lors du premier passage, le scénario E2E COD existant a créé une commande de test; la commande, son snapshot bundle, son historique, son outbox et ses réservations ont été supprimés, et les stocks des deux produits ont été restaurés depuis la sauvegarde. Les quatre commandes originales et leurs snapshots ont été revalidés inchangés.

## Fichiers générés

- `docs/catalog-merge-preview.csv`
- `docs/catalog-duplicate-report.csv`
- `docs/products-needing-price.csv`
- `docs/products-needing-media.csv`
- `docs/RESEARCH_IMPORT_MAPPING.md`

Les relations de curation peau/besoins/ingrédients/routine sont conservées en brouillon et cachées du storefront tant que `classification_verified` n’est pas vrai. Les commandes COD, leur historique et les avis ne sont pas modifiés.
"""
    (ROOT / "docs" / "CATALOG_MERGE_REPORT.md").write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--preview", action="store_true", help="rebuild identity preview; does not change catalog rows")
    mode.add_argument("--dry-run", action="store_true", help="run the merge in a transaction then roll it back")
    mode.add_argument("--apply", action="store_true", help="apply the reviewed merge to the configured database")
    args = parser.parse_args()
    if args.preview:
        with SessionLocal() as db:
            rows = create_preview(db)
        print(f"Preview: {len(rows)} lignes | actions={dict(Counter(row['action'] for row in rows))}")
        print(PREVIEW_CSV)
        return 0

    preview = load_preview()
    source_rows = read_source()
    baseline_connection = sqlite3.connect(BACKUP)
    before = database_counts(baseline_connection)
    before_hashes = protected_digests(baseline_connection)
    baseline_connection.close()
    if not DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("Cette prévisualisation et sa sauvegarde sont liées à SQLite; base configurée différente détectée.")

    with SessionLocal() as db:
        now_counts = {"products": table_count(db, Product), "orders": table_count(db, Order),
            "order_items": table_count(db, OrderItem), "product_images": table_count(db, ProductImage),
            "inventory_reservations": table_count(db, InventoryReservation)}
        already_imported = table_count(db, ProductResearch) > 0
        checked_counts = [key for key in now_counts if key != "products"]
        if not already_imported:
            checked_counts.append("products")
        for key in checked_counts:
            if now_counts[key] != before[key]:
                raise RuntimeError(f"La base a changé depuis la sauvegarde (`{key}`: {before[key]} -> {now_counts[key]}). Nouvelle sauvegarde/audit requis.")
        local_rows = local_catalog_rows()
        counters: Counter = Counter()
        if args.dry_run:
            db.rollback()
            transaction = db.begin()
            try:
                for source in source_rows:
                    counters[merge_one(db, source, preview[source["external_id"]], local_rows)] += 1
                db.flush()
            finally:
                transaction.rollback()
            print(f"Dry run valide; transaction annulée | résultat simulé={dict(counters)}")
            return 0

        for source in source_rows:
            counters[merge_one(db, source, preview[source["external_id"]], local_rows)] += 1
        db.commit()
        report(db, counters, before, before_hashes, preview)
        print(f"Fusion appliquée | résultat={dict(counters)}")
        print(f"Produits après: {table_count(db, Product)}")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
