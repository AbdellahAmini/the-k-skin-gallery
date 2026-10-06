"""Validated CSV/JSON product upsert. See docs/PRODUCT_IMPORT.md."""
from __future__ import annotations

import argparse
import csv
import hashlib
import ipaddress
import json
import re
import socket
import sys
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

import httpx
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import (Brand, Category, Concern, Ingredient, Product, ProductImage,
    ProductMetadata, ProductSubtype, SkinType, now)
from ..pricing import round_up_to_10_dh

ROOT = Path(__file__).resolve().parents[3]
MEDIA = ROOT / "public" / "assets" / "catalog" / "imported"
STATUSES = {"DRAFT", "PUBLISHED", "ARCHIVED"}
VERIFICATION = {"UNVERIFIED", "PARTIAL", "VERIFIED", "NEEDS_REVIEW"}
USAGE = {"", "AM", "PM", "BOTH"}
TAXONOMIES = {"skin_types": SkinType, "concerns": Concern, "key_ingredients": Ingredient}


def slugify(value: str) -> str:
    text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().casefold()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def clean(row: dict) -> dict:
    return {str(key).strip(): ("" if value is None else value.strip() if isinstance(value, str) else value)
            for key, value in row.items() if key is not None}


def truthy(value) -> bool:
    value = str(value if value is not None else "").strip().casefold()
    if value in {"1", "true", "yes", "oui"}: return True
    if value in {"", "0", "false", "no", "non"}: return False
    raise ValueError("booléen invalide (true/false ou 1/0 attendu)")


def list_values(value) -> list[str]:
    if isinstance(value, list):
        return list(dict.fromkeys(str(item).strip() for item in value if str(item).strip()))
    return list(dict.fromkeys(item.strip() for item in re.split(r"[;,|]", str(value or "")) if item.strip()))


def money(value, label: str, required: bool = False) -> int | None:
    if value is None or str(value).strip() == "":
        if required: raise ValueError(f"{label} est obligatoire pour créer une fiche")
        return None
    try:
        amount = int(str(value).strip())
    except ValueError as exc:
        raise ValueError(f"{label} doit être un montant entier en MAD") from exc
    if amount < 0: raise ValueError(f"{label} ne peut pas être négatif")
    return amount


def source_url(value: str, label: str) -> str:
    value = (value or "").strip()
    if value and (urlparse(value).scheme not in {"http", "https"} or not urlparse(value).netloc):
        raise ValueError(f"{label} doit être une URL http(s) complète")
    return value


def lookup_brand(db: Session, value: str, create: bool) -> Brand:
    if not value: raise ValueError("brand est obligatoire")
    slug = slugify(value)
    row = db.scalar(select(Brand).where(or_(Brand.slug == slug, Brand.name.ilike(value))))
    if row: return row
    if not create: raise ValueError(f"marque inconnue « {value} » (utilisez --create-brands si sa création est voulue)")
    row = Brand(name=value, slug=slug)
    db.add(row); db.flush()
    return row


def lookup_type(db: Session, value: str, create: bool) -> Category:
    if not value: raise ValueError("product_type est obligatoire")
    slug = slugify(value)
    row = db.scalar(select(Category).where(or_(Category.slug == slug, Category.name.ilike(value))))
    if row: return row
    if not create: raise ValueError(f"type de soin inconnu « {value} » (utilisez --create-types si nécessaire)")
    row = Category(name=value, slug=slug)
    db.add(row); db.flush()
    return row


def lookup_taxonomy(db: Session, kind: str, value: str, create: bool) -> list:
    model = TAXONOMIES[kind]
    result = []
    for term in list_values(value):
        slug = slugify(term)
        row = db.scalar(select(model).where(or_(model.slug == slug, model.name.ilike(term))))
        if row is None and create:
            row = model(name=term, slug=slug)
            db.add(row); db.flush()
        if row is None: raise ValueError(f"{kind}: valeur inconnue « {term} » (ajoutez --create-taxonomies pour la créer)")
        result.append(row)
    return result


def safe_public_image(value: str) -> Path:
    path = (ROOT / "public" / value.lstrip("/\\")).resolve()
    public = (ROOT / "public").resolve()
    if public not in path.parents or not path.is_file():
        raise ValueError(f"image locale introuvable ou hors du dossier public: {value}")
    validate_image(path.read_bytes())
    return path


def validate_image(data: bytes) -> tuple[str, str]:
    if data.startswith(b"\x89PNG\r\n\x1a\n"): return "image/png", ".png"
    if data.startswith(b"\xff\xd8\xff"): return "image/jpeg", ".jpg"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP": return "image/webp", ".webp"
    raise ValueError("format image non accepté (PNG, JPEG ou WebP attendu)")


def validate_public_host(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("URL média invalide; http(s) attendu")
    host = parsed.hostname.casefold()
    if host in {"localhost", "localhost.localdomain"}:
        raise ValueError("hôte local refusé pour une importation média")
    try:
        addresses = {ipaddress.ip_address(host)}
    except ValueError:
        try: addresses = {ipaddress.ip_address(info[4][0]) for info in socket.getaddrinfo(host, None)}
        except OSError as exc: raise ValueError(f"hôte média inaccessible: {host}") from exc
    if not addresses or any(not address.is_global for address in addresses):
        raise ValueError("l’URL média doit pointer vers un hôte public")


def download_image(url: str) -> tuple[str, str]:
    from ..media import store_image
    current = url
    with httpx.Client(timeout=15, follow_redirects=False) as client:
        for _ in range(4):
            validate_public_host(current)
            with client.stream("GET", current, headers={"Accept": "image/png,image/jpeg,image/webp"}) as response:
                if response.is_redirect:
                    location = response.headers.get("location")
                    if not location: raise ValueError("redirection média sans destination")
                    current = str(response.url.join(location))
                    continue
                response.raise_for_status()
                data = bytearray()
                for chunk in response.iter_bytes():
                    data.extend(chunk)
                    if len(data) > 12 * 1024 * 1024: raise ValueError("image supérieure à la limite de 12 Mo")
                detected, _ = validate_image(bytes(data))
                content_type = response.headers.get("content-type", "").split(";")[0].lower()
                if content_type != detected: raise ValueError(f"type MIME incohérent ({content_type} / {detected})")
                return store_image(bytes(data)), current
    raise ValueError("trop de redirections pour l’image")


def find_product(db: Session, sku: str, brand: Brand, official_name: str) -> Product | None:
    if sku:
        by_sku = db.scalar(select(Product).where(Product.sku == sku))
        if by_sku: return by_sku
    normalized = " ".join(official_name.casefold().split())
    exact = db.scalar(select(Product).where(Product.brand_id == brand.id,
        func.lower(func.trim(Product.official_name)) == normalized))
    if exact: return exact
    exact_legacy = db.scalar(select(Product).where(Product.brand_id == brand.id,
        func.lower(func.trim(Product.name)) == normalized))
    if exact_legacy: return exact_legacy
    # Rare legacy spacing variants are normalized in Python after the indexed lookup.
    candidates = db.scalars(select(Product).where(Product.brand_id == brand.id)).all()
    for product in candidates:
        current = " ".join((product.official_name or product.name).casefold().split())
        if current == normalized: return product
    return None


def import_row(db: Session, source: dict, line: int, args) -> dict:
    row = clean(source)
    brand = lookup_brand(db, row.get("brand", ""), args.create_brands)
    official_name = row.get("official_name") or row.get("name") or ""
    if not official_name: raise ValueError("official_name est obligatoire")
    requested_sku = row.get("sku", "")
    existing = find_product(db, requested_sku, brand, official_name)
    sku = requested_sku or (existing.sku if existing else "AUTO-" + hashlib.sha256(
        f"{brand.slug}|{official_name.casefold()}".encode()).hexdigest()[:16].upper())
    slug = row.get("slug") or (existing.slug if existing else slugify(f"{brand.slug}-{official_name}"))
    if not slug or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise ValueError("slug invalide (minuscules, chiffres et tirets uniquement)")
    collision = db.scalar(select(Product).where(Product.slug == slug))
    if collision and (existing is None or collision.id != existing.id):
        raise ValueError(f"slug déjà utilisé par {collision.sku}")
    type_value = row.get("product_type", "") or row.get("category", "")
    category = existing.category if existing and not type_value else lookup_type(db, type_value, args.create_types)
    subtype = None
    subtype_slug = row.get("product_subtype", "")
    if subtype_slug:
        subtype = db.scalar(select(ProductSubtype).where(ProductSubtype.slug == slugify(subtype_slug),
            ProductSubtype.product_type_id == category.id))
        if subtype is None: raise ValueError(f"sous-type inconnu « {subtype_slug} » pour {category.name}")

    price = money(row.get("price_dh"), "price_dh", required=existing is None)
    compare = round_up_to_10_dh(money(row.get("compare_at_dh"), "compare_at_dh"))
    cost = money(row.get("cost_dh"), "cost_dh")
    wholesale = money(row.get("wholesale_dh"), "wholesale_dh")
    stock_value = row.get("stock", "")
    stock = None
    if stock_value not in (None, ""):
        try: stock = int(stock_value)
        except (TypeError, ValueError) as exc: raise ValueError("stock doit être un entier positif ou nul") from exc
        if stock < 0: raise ValueError("stock ne peut pas être négatif")
    status = (row.get("publication_status") or (existing.publication_status if existing else "PUBLISHED")).upper()
    if status not in STATUSES: raise ValueError("publication_status doit être DRAFT, PUBLISHED ou ARCHIVED")
    effective_price = price if price is not None else (existing.price_dh if existing else None)
    if status == "PUBLISHED" and (effective_price is None or effective_price <= 0):
        raise ValueError("un produit publié exige un prix MAD strictement positif")
    verification = (row.get("verification_status") or (existing.verification_status if existing else "UNVERIFIED")).upper()
    if verification not in VERIFICATION: raise ValueError("verification_status invalide")
    usage = (row.get("usage_time") or "").upper()
    if usage not in USAGE: raise ValueError("usage_time doit être AM, PM ou BOTH")
    source_url_value = source_url(row.get("official_source_url", "") or (existing.official_source_url if existing else ""), "official_source_url")
    source_name = row.get("official_source_name", "") or (existing.metadata_record.official_source_name if existing and existing.metadata_record else "")
    if verification == "VERIFIED" and (not source_url_value or not source_name):
        raise ValueError("une fiche VERIFIED exige official_source_name et official_source_url")
    try:
        size_value = float(row["size_value"]) if row.get("size_value") else None
    except (ValueError, TypeError) as exc:
        raise ValueError("size_value doit être numérique") from exc
    if size_value is not None and size_value <= 0: raise ValueError("size_value doit être supérieur à zéro")

    image_warnings = []
    local_image = row.get("image_url", "")
    if local_image and not local_image.startswith("http"):
        try: safe_public_image(local_image)
        except ValueError as exc:
            image_warnings.append(str(exc))
            local_image = ""
    image_urls = list_values(row.get("image_urls") or row.get("official_image_urls"))
    if row.get("image_url", "").startswith("http"):
        image_urls.insert(0, row["image_url"])
    image_urls = list(dict.fromkeys(image_urls))
    if image_urls:
        for image_url in image_urls: source_url(image_url, "image_urls")

    # Validate relationships and optional fields before a skipped row is accepted.
    relationships = {}
    for field in TAXONOMIES:
        if row.get(field) not in (None, ""):
            relationships[field] = lookup_taxonomy(db, field, row[field], args.create_taxonomies)
    for field in ("featured", "new_arrival", "classification_verified", "stock_is_sample"):
        if row.get(field) not in (None, ""): truthy(row[field])
    if row.get("low_stock_threshold") not in (None, ""):
        money(row["low_stock_threshold"], "low_stock_threshold")
    for field in ("verified_at", "new_until"):
        if row.get(field):
            from datetime import datetime
            try: datetime.fromisoformat(row[field].replace("Z", "+00:00"))
            except ValueError as exc: raise ValueError(f"{field} doit être une date ISO") from exc
    if row.get("barcode"):
        duplicate = db.scalar(select(Product).where(Product.barcode == row["barcode"]))
        if duplicate and (not existing or duplicate.id != existing.id): raise ValueError("code-barres déjà utilisé")
    if existing and not args.update_existing:
        return {"line": line, "status": "SKIPPED", "reason": f"fiche existante: {existing.sku or existing.slug}"}
    result = existing or Product(sku=sku, slug=slug, name=official_name,
        brand_id=brand.id, category_id=category.id)
    is_new = existing is None
    result.sku = sku
    result.slug = slug
    result.name = row.get("display_name_fr") or row.get("name") or result.name or official_name
    result.official_name = official_name
    result.display_name_fr = row.get("display_name_fr") or result.display_name_fr or result.name
    result.brand = brand; result.category = category
    if subtype_slug or is_new: result.product_subtype = subtype
    if price is not None: result.price_dh = price
    if "compare_at_dh" in row and row.get("compare_at_dh") != "": result.compare_at_dh = compare
    if "cost_dh" in row and row.get("cost_dh") != "": result.cost_dh = cost
    if "wholesale_dh" in row and row.get("wholesale_dh") != "": result.wholesale_dh = wholesale
    if stock is not None:
        result.stock = stock
        result.stock_is_sample = truthy(row.get("stock_is_sample")) if "stock_is_sample" in row else False
    if "publication_status" in row:
        result.publication_status = status.lower()
        result.active = status == "PUBLISHED"
    elif is_new:
        result.publication_status = status.lower(); result.active = status == "PUBLISHED"
    result.verification_status = verification
    result.updated_at = now()
    if row.get("classification_verified") not in (None, ""):
        result.classification_verified = truthy(row["classification_verified"])
        result.classification_verified_at = now() if result.classification_verified else None
    result.barcode = row.get("barcode") or result.barcode
    if row.get("size"): result.size = row["size"]
    if size_value is not None: result.size_value = size_value
    if row.get("size_unit"): result.size_unit = row["size_unit"]
    if local_image and not local_image.startswith("http"): result.image_url = local_image
    if row.get("low_stock_threshold") not in (None, ""):
        try: threshold = int(row["low_stock_threshold"])
        except ValueError as exc: raise ValueError("low_stock_threshold doit être un entier positif ou nul") from exc
        if threshold < 0: raise ValueError("low_stock_threshold ne peut pas être négatif")
        result.low_stock_threshold = threshold
    for csv_key, model_key in [
        ("short_description_fr", "short_description"), ("description_fr", "description"),
        ("manufacturer_description", "manufacturer_description"), ("manufacturer_benefits", "manufacturer_benefits"),
        ("benefits_fr", "benefits_fr"), ("usage_instructions_fr", "usage_instructions_fr"),
        ("manufacturer_usage_instructions", "usage_instructions"),
        ("full_inci", "inci"), ("warnings_fr", "warnings_fr"), ("official_source_url", "official_source_url"),
        ("source_language", "source_language"), ("seo_title", "seo_title"), ("seo_description", "seo_description"),
    ]:
        if row.get(csv_key) not in (None, ""):
            if model_key == "official_source_url": setattr(result, model_key, source_url_value)
            else: setattr(result, model_key, row[csv_key])
    if row.get("featured") not in (None, ""): result.featured = truthy(row["featured"])
    if row.get("new_arrival") not in (None, ""): result.new_arrival = truthy(row["new_arrival"])
    if row.get("verified_at"):
        try: verified_at = __import__("datetime").datetime.fromisoformat(row["verified_at"].replace("Z", "+00:00"))
        except ValueError as exc: raise ValueError("verified_at doit être une date ISO") from exc
    else: verified_at = None
    if is_new: db.add(result)
    db.flush()
    details = result.metadata_record or ProductMetadata(product_id=result.id)
    if result.metadata_record is None: result.metadata_record = details
    if row.get("usage_time"): details.usage_time = usage.lower()
    if row.get("routine_step"): details.routine_step = row["routine_step"]
    if row.get("search_aliases"): details.search_aliases = row["search_aliases"]
    if source_name: details.official_source_name = source_name
    if verified_at: details.verified_at = verified_at
    elif verification == "VERIFIED" and not details.verified_at: details.verified_at = now()
    elif is_new: details.verified_at = None
    if row.get("new_until"):
        from datetime import datetime
        details.new_until = datetime.fromisoformat(row["new_until"].replace("Z", "+00:00"))

    for field, attr in [("skin_types", "skin_types"), ("concerns", "concerns"), ("key_ingredients", "ingredients")]:
        if row.get(field) not in (None, "") or (existing is not None and args.replace_relationships and field in row):
            found = lookup_taxonomy(db, field, row[field], args.create_taxonomies)
            if is_new or args.replace_relationships: setattr(result, attr, found)
    if local_image and not local_image.startswith("http"):
        primary = next((item for item in result.images if item.is_primary), None)
        if primary:
            primary.image_url = local_image
            if row.get("image_alt_fr"): primary.alt_text = row["image_alt_fr"]
        else:
            result.images.append(ProductImage(image_url=local_image,
                alt_text=row.get("image_alt_fr") or result.display_name_fr,
                position=max([item.position for item in result.images], default=-1) + 1, is_primary=True))
    if image_urls:
        for position, image_source in enumerate(image_urls):
            try:
                if args.import_images and not args.dry_run:
                    image_path, source = download_image(image_source)
                else:
                    image_path, source = "", image_source
                if image_path:
                    image_record = next((item for item in result.images if item.source_url == source), None)
                    if image_record is None:
                        image_record = ProductImage(image_url=image_path, source_url=source,
                            alt_text=row.get("image_alt_fr") or result.display_name_fr,
                            position=max([item.position for item in result.images], default=-1) + 1)
                        result.images.append(image_record)
                    if position == 0 and (is_new or args.update_existing):
                        for item in result.images:
                            item.is_primary = False
                        image_record.is_primary = True
                        result.image_url = image_path
            except Exception as exc:
                image_warnings.append(str(exc))
    if image_urls and not args.import_images:
        image_warnings.append("image distante non importée; utilisez --import-images")
    status_label = "CREATED" if is_new else "UPDATED"
    reason = "; ".join(f"image: {message}" for message in image_warnings)
    return {"line": line, "status": status_label, "reason": reason}


def load_rows(path: Path) -> list[dict]:
    if path.suffix.casefold() == ".json":
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
        if isinstance(payload, dict): payload = payload.get("products")
        if not isinstance(payload, list): raise ValueError("Le JSON doit être un tableau ou contenir products: []")
        return payload
    if path.suffix.casefold() != ".csv": raise ValueError("Fichier attendu: CSV ou JSON")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def run(path: Path, args) -> list[dict]:
    rows = load_rows(path)
    report = []
    with SessionLocal() as db:
        # SQLite legacy transaction mode otherwise releases the outermost SAVEPOINT
        # as a commit, which would make --dry-run persist rows.
        connection = db.connection()
        if connection.dialect.name == "sqlite": connection.exec_driver_sql("BEGIN")
        for index, row in enumerate(rows, 2 if path.suffix.casefold() == ".csv" else 1):
            try:
                with db.begin_nested():
                    result = import_row(db, row, index, args)
                report.append(result)
            except Exception as exc:
                report.append({"line": index, "status": "ERROR", "reason": str(exc)})
        if args.dry_run: db.rollback()
        else: db.commit()
    return report


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Import validé du catalogue produits")
    parser.add_argument("file", type=Path)
    parser.add_argument("--dry-run", action="store_true", help="Valider et rapporter sans écrire en base")
    parser.add_argument("--update-existing", action="store_true", help="Mettre à jour les fiches existantes")
    parser.add_argument("--replace-relationships", action="store_true", help="Remplacer les relations fournies lors d’une mise à jour")
    parser.add_argument("--create-brands", action="store_true", help="Créer explicitement les marques inconnues")
    parser.add_argument("--create-types", action="store_true", help="Créer explicitement les types de soin inconnus")
    parser.add_argument("--create-taxonomies", action="store_true", help="Créer explicitement peau, besoins et ingrédients inconnus")
    parser.add_argument("--import-images", action="store_true", help="Télécharger et enregistrer les images officielles")
    args = parser.parse_args(argv)
    if not args.file.is_file(): parser.error(f"fichier introuvable: {args.file}")
    try: report = run(args.file, args)
    except Exception as exc:
        print(f"ERROR fichier: {exc}", file=sys.stderr); return 1
    for item in report:
        suffix = f" — {item['reason']}" if item.get("reason") else ""
        print(f"{item['status']} ligne {item['line']}{suffix}")
    from collections import Counter
    counts = Counter(row["status"] for row in report)
    print(" | ".join(f"{key}: {counts.get(key, 0)}" for key in ("CREATED", "UPDATED", "SKIPPED", "ERROR")))
    if args.dry_run: print("DRY RUN — aucune écriture en base")
    return 1 if counts.get("ERROR") else 0


if __name__ == "__main__":
    raise SystemExit(main())
