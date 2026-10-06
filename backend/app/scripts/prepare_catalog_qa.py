"""Seed synthetic QA variations into an explicitly isolated migrated database."""
import os
from pathlib import Path
from types import SimpleNamespace
from sqlalchemy import select
from ..database import SessionLocal
from ..models import Product, ProductMetadata, SkinType, Concern, Ingredient, SiteSetting
from .import_products import run
from ..create_admin import create_admin


def main():
    if "/.qa/" not in os.getenv("DATABASE_URL", "").replace("\\", "/"):
        raise RuntimeError("QA seeding requires a DATABASE_URL inside backend/.qa/")
    args = SimpleNamespace(dry_run=False, update_existing=False, replace_relationships=False,
        create_brands=True, create_types=True, create_taxonomies=False, import_images=False)
    report = run(Path(__file__).resolve().parents[3] / "docs/product-pilot.csv", args)
    assert all(item["status"] in {"CREATED", "SKIPPED"} for item in report), report
    with SessionLocal() as db:
        skin = db.scalar(select(SkinType).where(SkinType.slug == "qa-sensible"))
        if not skin: skin = SkinType(name="Sensible (QA)", slug="qa-sensible"); db.add(skin)
        need = db.scalar(select(Concern).where(Concern.slug == "qa-hydratation"))
        if not need: need = Concern(name="Hydratation (QA)", slug="qa-hydratation"); db.add(need)
        ingredient = db.scalar(select(Ingredient).where(Ingredient.slug == "qa-ingredient"))
        if not ingredient: ingredient = Ingredient(name="Ingrédient test (QA)", slug="qa-ingredient"); db.add(ingredient)
        pilot = db.scalars(select(Product).where(Product.sku.like("KG-%")).order_by(Product.id)).all()
        for index, product in enumerate(pilot):
            product.publication_status = "published"
            product.active = True
            product.stock = 0 if index % 3 == 0 else 10
            product.stock_is_sample = True
            product.featured = index < 6
            product.compare_at_dh = product.price_dh + 50 if index % 4 == 0 else None
            product.skin_types = [skin]; product.concerns = [need]; product.ingredients = [ingredient]
            product.classification_verified = True  # Synthetic QA association, not official data.
            details = product.metadata_record
            if not details: details = ProductMetadata(product_id=product.id); db.add(details)
            details.usage_time = ["am", "pm", "both"][index % 3]
        # Enough synthetic rows to exercise 24-item pagination.
        for index in range(16):
            sku = f"QA-EXTRA-{index:03}"
            existing = db.scalar(select(Product).where(Product.sku == sku))
            if existing:
                existing.stock = 5
                existing.classification_verified = False
                existing.featured = False
                existing.compare_at_dh = None
                continue
            sample = pilot[index % len(pilot)]
            db.add(Product(sku=sku, slug=sku.lower(), name=f"Produit test QA {index + 1}",
                official_name=f"Produit test QA {index + 1}", brand_id=sample.brand_id,
                category_id=sample.category_id, price_dh=100 + index, stock=5,
                stock_is_sample=True, image_url=sample.image_url))
        if not db.get(SiteSetting, "reviews_enabled"):
            db.add(SiteSetting(key="reviews_enabled", value="false"))
        db.commit()
        create_admin(db, "catalog-qa@example.ma", "catalog-qa-password-123", "Catalog", "QA")
    print("16 pilot records imported; synthetic QA stock, curation and pagination data prepared.")


if __name__ == "__main__": main()
