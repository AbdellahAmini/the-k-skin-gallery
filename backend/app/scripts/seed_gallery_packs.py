"""Import the 20 reviewed Gallery pack concepts into the live bundle catalogue.

Run after ``alembic upgrade head``. Existing packs are left untouched unless
``--update-existing`` is supplied, so merchant edits survive later reruns.
"""

import argparse
import json
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Bundle, BundleItem, Product
from app.scripts.pack_content_ar import AR_COPY, AR_PRODUCT_NOTES
from app.scripts.pack_content_fr import FR_COPY, FR_PRODUCT_NOTES


SOURCE = Path(__file__).resolve().parents[3] / "docs" / "pack_strategy_2026" / "recommended_packs_20.json"
SKIN_AR = {
    "normale": "العادية", "mixte": "المختلطة", "grasse": "الدهنية",
    "sèche": "الناشفة", "seche": "الناشفة", "sensible": "الحساسة",
}


def customer_content(pack):
    key = pack["pack_id"].rsplit("-", 1)[-1]
    ar = AR_COPY[key]
    french = FR_COPY[key]
    fr = {
        "name": pack["name_fr"],
        **french,
        "skin_types": pack["suitable_skin_types"],
        "not_for": [french["caution"]],
        "component_notes": {str(item["product_id"]): FR_PRODUCT_NOTES[item["product_id"]] for item in pack["components"]},
    }
    ar_content = {
        "name": pack["name_darija"],
        **ar,
        "skin_types": [SKIN_AR.get(skin, skin) for skin in pack["suitable_skin_types"]],
        "not_for": [ar["caution"]],
        "component_notes": {str(item["product_id"]): AR_PRODUCT_NOTES[item["product_id"]] for item in pack["components"]},
    }
    return {
        "version": 1,
        "source_pack_id": pack["pack_id"],
        "category": pack["category"],
        "beginner_friendly": pack["beginner_friendly"],
        "fr": fr,
        "ar": ar_content,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--update-existing", action="store_true")
    args = parser.parse_args()

    packs = json.loads(SOURCE.read_text(encoding="utf-8"))["packs"]
    if len(packs) != 20 or len({pack["slug"] for pack in packs}) != 20:
        raise ValueError("Expected exactly 20 distinct pack slugs")

    with SessionLocal() as db:
        ids = {item["product_id"] for pack in packs for item in pack["components"]}
        products = {product.id: product for product in db.scalars(select(Product).where(Product.id.in_(ids)))}
        if ids - products.keys():
            raise ValueError(f"Missing product IDs: {sorted(ids - products.keys())}")
        for pack in packs:
            customer_content(pack)
            for item in pack["components"]:
                product = products[item["product_id"]]
                if product.sku != item["sku"] or product.name != item["product_name"]:
                    raise ValueError(f"Catalogue mismatch for {item['sku']}: {product.sku} / {product.name}")
                if item["quantity"] < 1:
                    raise ValueError(f"Invalid quantity for {item['sku']}")
            if pack["pricing"]["promo_pack_price_dh"] <= 0:
                raise ValueError(f"Invalid pack price for {pack['slug']}")

        created = updated = skipped = 0
        for pack in packs:
            row = db.scalar(select(Bundle).where(Bundle.slug == pack["slug"]))
            if row and not args.update_existing:
                skipped += 1
                continue
            if row is None:
                row = Bundle(slug=pack["slug"])
                db.add(row)
                created += 1
            else:
                updated += 1
                row.items.clear()
                db.flush()
            row.name = pack["name_fr"]
            row.description = FR_COPY[pack["pack_id"].rsplit("-", 1)[-1]]["summary"]
            row.content_json = json.dumps(customer_content(pack), ensure_ascii=False)
            row.image_url = f"/assets/packs/{pack['slug']}.webp"
            row.price_dh = pack["pricing"]["promo_pack_price_dh"]
            row.compare_at_dh = None
            row.active = True
            row.items = [BundleItem(product_id=item["product_id"], quantity=item["quantity"]) for item in pack["components"]]
        if args.dry_run:
            db.rollback()
        else:
            db.commit()
        print(f"{'DRY RUN ' if args.dry_run else ''}packs: created={created}, updated={updated}, skipped={skipped}")


if __name__ == "__main__":
    main()
