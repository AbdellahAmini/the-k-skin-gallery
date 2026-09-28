import re
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import Bundle, City, Product, Promotion, SiteSetting, now


def product_public(p: Product) -> dict:
    details = p.metadata_record
    return {"id": p.id, "sku": p.sku, "slug": p.slug, "name": p.name,
        "brand": p.brand.name, "brand_slug": p.brand.slug,
        "category": p.category.name, "category_slug": p.category.slug,
        "size": p.size, "image_url": p.image_url, "price_dh": p.price_dh,
        "compare_at_dh": p.compare_at_dh, "stock": p.stock,
        "featured": p.featured, "new_arrival": bool(details and details.new_until and details.new_until.date() >= now().date()),
        "short_description": p.short_description, "description": p.description,
        "usage_instructions": p.usage_instructions, "inci": p.inci,
        "official_source_url": p.official_source_url,
        "official_source_name": details.official_source_name if details else "",
        "verified_at": details.verified_at if details else None,
        "new_until": details.new_until if details else None,
        "search_aliases": details.search_aliases if details else "",
        "usage_time": details.usage_time if details else "",
        "routine_step": details.routine_step if details else "",
        "skin_types": [{"name": item.name, "slug": item.slug} for item in p.skin_types],
        "concerns": [{"name": item.name, "slug": item.slug} for item in p.concerns],
        "ingredients": [{"name": item.name, "slug": item.slug} for item in p.ingredients]}


def bundle_stock(bundle: Bundle) -> int:
    if not bundle.active or not bundle.items:
        return 0
    if any(item.quantity <= 0 or not item.product.active for item in bundle.items):
        return 0
    return min(item.product.stock // item.quantity for item in bundle.items)


def bundle_public(bundle: Bundle) -> dict:
    return {"id": bundle.id, "slug": bundle.slug, "name": bundle.name,
        "description": bundle.description, "image_url": bundle.image_url,
        "price_dh": bundle.price_dh, "compare_at_dh": bundle.compare_at_dh,
        "stock": bundle_stock(bundle), "active": bundle.active,
        "items": [{"product": product_public(item.product), "quantity": item.quantity}
                  for item in bundle.items]}


def normalize_phone(phone: str) -> str:
    compact = re.sub(r"[\s().-]", "", phone)
    if compact.startswith("00212"):
        compact = "+212" + compact[5:]
    if re.fullmatch(r"0[67]\d{8}", compact):
        return "+212" + compact[1:]
    if re.fullmatch(r"\+212[67]\d{8}", compact):
        return compact
    raise HTTPException(422, "Saisissez un numéro mobile marocain valide (06, 07 ou +212).")


def setting(db: Session, key: str, default: str = "") -> str:
    row = db.get(SiteSetting, key)
    return row.value if row else default


def calculate_quote(db: Session, items: list, city_id: int | None, code: str = "", lock: bool = False) -> dict:
    if not items:
        raise HTTPException(422, "Votre panier est vide.")
    merged = {}
    for item in items:
        product_id = item.product_id if hasattr(item, "product_id") else item.get("product_id")
        bundle_id = item.bundle_id if hasattr(item, "bundle_id") else item.get("bundle_id")
        quantity = item.quantity if hasattr(item, "quantity") else item["quantity"]
        if bool(product_id) == bool(bundle_id):
            raise HTTPException(422, "Choisissez un produit ou un pack pour chaque ligne.")
        if quantity < 1 or quantity > 25:
            raise HTTPException(422, "La quantité doit être comprise entre 1 et 25.")
        key = ("bundle", bundle_id) if bundle_id else ("product", product_id)
        merged[key] = merged.get(key, 0) + quantity
    bundles = {b.id: b for b in db.scalars(select(Bundle).where(
        Bundle.id.in_([item_id for (kind, item_id) in merged if kind == "bundle"]))).all()}
    needed = {}
    for (kind, item_id), quantity in merged.items():
        if kind == "product":
            needed[item_id] = needed.get(item_id, 0) + quantity
        else:
            bundle = bundles.get(item_id)
            if not bundle or not bundle.active or not bundle.items:
                raise HTTPException(409, "Un pack du panier n'est plus disponible.")
            for component in bundle.items:
                needed[component.product_id] = needed.get(component.product_id, 0) + component.quantity * quantity
    stmt = select(Product).where(Product.id.in_(sorted(needed)))
    if lock:
        stmt = stmt.with_for_update()
    products = {p.id: p for p in db.scalars(stmt).all()}
    for product_id, quantity in needed.items():
        product = products.get(product_id)
        if not product or not product.active:
            raise HTTPException(409, "Un article du panier n'est plus disponible.")
        if product.stock < quantity:
            raise HTTPException(409, f"Stock insuffisant pour {product.name}. Disponible : {product.stock}.")
    lines = []
    for (kind, item_id), quantity in merged.items():
        if kind == "product":
            product = products[item_id]
            lines.append({"kind": "product", "product": product, "quantity": quantity,
                "unit_price_dh": product.price_dh, "line_total_dh": product.price_dh * quantity})
        else:
            bundle = bundles[item_id]
            lines.append({"kind": "bundle", "bundle": bundle, "quantity": quantity,
                "unit_price_dh": bundle.price_dh, "line_total_dh": bundle.price_dh * quantity})
    subtotal = sum(line["line_total_dh"] for line in lines)
    active = db.scalars(select(Promotion).where(Promotion.active.is_(True))).all()
    promo = None
    if code:
        promo = next((p for p in active if p.code and p.code.lower() == code.strip().lower()), None)
        if not promo:
            raise HTTPException(422, "Ce code promotionnel n'est pas valide.")
    else:
        promo = next((p for p in active if not p.code and p.kind != "free_shipping" and subtotal >= p.minimum_dh), None)
    discount = 0
    if promo and subtotal >= promo.minimum_dh:
        if promo.kind == "percent":
            discount = subtotal * min(promo.amount, 100) // 100
        elif promo.kind == "fixed":
            discount = min(subtotal, promo.amount)
    elif promo:
        raise HTTPException(422, f"Ce code nécessite {promo.minimum_dh} DH d'achats.")
    city = db.get(City, city_id) if city_id else None
    if city_id and (not city or not city.active):
        raise HTTPException(422, "Choisissez une ville de livraison valide.")
    shipping = city.shipping_dh if city else 0
    threshold = int(setting(db, "free_shipping_threshold_dh", "0") or 0)
    free_ship_promo = promo and promo.kind == "free_shipping"
    if city and ((threshold and subtotal - discount >= threshold) or free_ship_promo):
        shipping = 0
    return {"lines": lines, "subtotal_dh": subtotal, "discount_dh": discount,
        "shipping_dh": shipping, "total_dh": subtotal - discount + shipping,
        "city": city, "promotion": promo, "free_shipping_threshold_dh": threshold,
        "needed": needed, "products": products}
