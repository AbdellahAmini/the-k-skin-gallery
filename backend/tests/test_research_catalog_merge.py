import json
from types import SimpleNamespace

from sqlalchemy import func, select

from app.create_admin import create_admin
from app.models import (Product, ProductImage, ProductMetadata, ProductResearch)
from app.scripts import import_products, merge_research_catalog
from test_commerce_flow import build_client, teardown_client


def research_row(**overrides):
    row = {
        "external_id": "research-test-product", "brand": "Test Brand",
        "official_name": "New Test Serum", "display_name_fr": "Nouveau sérum de test",
        "product_type": "Sérums", "product_subtype": "Sérum / Ampoule", "display_size": "30ml",
        "skin_types": "Sensible", "concerns": "Hydratation", "key_ingredients": "Niacinamide",
        "routine_step": "Traiter", "usage_time": "BOTH", "official_summary_en": "",
        "store_short_description_fr": "Un sérum de test.", "benefits_fr": "", "usage_instructions_fr": "",
        "full_inci": "", "warnings_fr": "", "official_source_name": "Test source",
        "official_source_url": "https://example.test/collection", "source_scope": "COLLECTION",
        "source_language": "en", "verified_at": "", "verification_status": "PARTIAL",
        "official_price_currency": "USD", "official_price": "22", "official_price_note": "reference only",
        "price_mad": "", "display_size": "30ml", "image_source_url": "",
        "media_status": "NEEDS_ASSET_INGESTION", "desired_visibility": "OUT_OF_STOCK",
        "selection_basis": "test", "curation_basis": "test curation", "research_notes": "test note",
        "slug": "new-test-serum", "sku": "", "barcode": "", "seo_title": "", "seo_description": "",
    }
    row.update(overrides)
    return row


def test_research_merge_creates_zero_price_private_draft_and_is_idempotent():
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            plan = {"action": "CREATE_DRAFT_OOS", "matched_product_id": ""}
            row = research_row()
            assert merge_research_catalog.merge_one(db, row, plan, []) == "CREATED"
            db.commit()
            product = db.scalar(select(Product).where(Product.sku.like("KSG-R-%")))
            assert product is not None
            product_id, product_slug = product.id, product.slug
            assert (product.price_dh, product.stock, product.publication_status, product.active) == (0, 0, "draft", False)
            assert product.research_record.official_reference_price == 22
            assert product.research_record.official_reference_currency == "USD"
            assert "MISSING_MAD_PRICE" in product.research_record.commercial_hold_reason
            assert product.research_record.commercial_ready is False
            assert product.metadata_record.usage_time == "both"
            assert product.classification_verified is False
            assert merge_research_catalog.merge_one(db, row, plan, []) == "ALREADY_IMPORTED"
            assert db.scalar(select(func.count(Product.id))) == 2

        assert client.get(f"/api/products/{product_slug}").status_code == 404
        assert client.get("/api/products?q=Nouveau sérum").json()["total"] == 0
        assert client.get("/api/products?q=New Test Serum").json()["total"] == 0
        assert client.post("/api/v1/cart/validate", json={"items": [{"product_id": product_id, "quantity": 1}],
            "city_id": 1}).status_code == 409
        assert client.post("/api/stock-alerts", json={"product_id": product_id,
            "email": "client@example.ma"}).status_code == 404
    finally:
        teardown_client(client, engine)


def test_enrichment_preserves_existing_price_stock_publication_and_image():
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            product = db.scalar(select(Product).where(Product.sku == "TEST-001"))
            product.image_url = "/assets/catalog/existing.webp"
            db.add(ProductImage(product_id=product.id, image_url=product.image_url,
                position=0, is_primary=True, alt_text="Existing product"))
            db.commit()
            source = research_row(external_id="research-existing-test-serum", official_name="Test Serum",
                display_name_fr="Nouveau nom non prioritaire", product_type="Sérums")
            plan = {"action": "ENRICH_EXISTING", "matched_product_id": str(product.id)}
            assert merge_research_catalog.merge_one(db, source, plan, []) == "ENRICHED"
            db.commit()
            updated = db.get(Product, product.id)
            assert (updated.price_dh, updated.stock, updated.publication_status, updated.sku) == (120, 5, "published", "TEST-001")
            assert updated.name == "Test Serum"
            assert updated.image_url == "/assets/catalog/existing.webp"
            assert len(updated.images) == 1
            assert updated.official_source_url == "https://example.test/collection"
    finally:
        teardown_client(client, engine)


def test_zero_price_cannot_be_imported_as_published(tmp_path, monkeypatch):
    client, sessions, engine = build_client()
    monkeypatch.setattr(import_products, "SessionLocal", sessions)
    source = tmp_path / "zero-price.json"
    source.write_text(json.dumps([{"brand": "Test Brand", "official_name": "Free Test Serum",
        "product_type": "Sérums", "price_dh": 0, "stock": 0,
        "publication_status": "published"}]), encoding="utf-8")
    options = SimpleNamespace(dry_run=False, update_existing=False, replace_relationships=False,
        create_brands=False, create_types=False, create_taxonomies=False, import_images=False)
    try:
        result = import_products.run(source, options)
        assert result[0]["status"] == "ERROR"
        assert "prix MAD strictement positif" in result[0]["reason"]
        with sessions() as db:
            assert db.scalar(select(func.count(Product.id))) == 1
    finally:
        teardown_client(client, engine)


def test_unverified_routine_usage_is_not_public_or_filterable():
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            product = db.scalar(select(Product).where(Product.sku == "TEST-001"))
            product.metadata_record = ProductMetadata(usage_time="am", routine_step="Traiter")
            db.commit()
        detail = client.get("/api/products/test-serum").json()
        assert detail["usage_time"] == "" and detail["routine_step"] == ""
        assert client.get("/api/products?usage=am").json()["total"] == 0
        with sessions() as db:
            db.scalar(select(Product).where(Product.sku == "TEST-001")).classification_verified = True
            db.commit()
        assert client.get("/api/products?usage=am").json()["total"] == 1
    finally:
        teardown_client(client, engine)


def test_admin_cannot_publish_placeholder_or_unready_research_product():
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            product = Product(sku="RESEARCH-ADMIN-001", slug="research-admin-draft",
                name="Research Admin Draft", official_name="Research Admin Draft", brand_id=1,
                category_id=1, price_dh=0, stock=0, active=False, publication_status="draft",
                short_description="Description courte")
            product.research_record = ProductResearch(external_id="research-admin-draft",
                source_scope="COLLECTION", official_reference_price=22,
                official_reference_currency="USD", price_source="USER_PLACEHOLDER_MISSING_PRICE",
                commercial_ready=False, commercial_hold_reason="MISSING_MAD_PRICE|MISSING_MEDIA|MISSING_CONTENT")
            db.add(product)
            db.commit()
            product_id = product.id
            create_admin(db, "research-admin@example.ma", "secure-password-123", "QA", "Owner")
        login = client.post("/api/auth/login", json={"email": "research-admin@example.ma",
            "password": "secure-password-123"})
        assert login.status_code == 200
        blocked_price = client.patch(f"/api/admin/products/{product_id}", json={"publication_status": "published"})
        assert blocked_price.status_code == 422
        blocked_media = client.patch(f"/api/admin/products/{product_id}", json={
            "price_dh": 150, "publication_status": "published"})
        assert blocked_media.status_code == 422
        assert client.get("/api/products/research-admin-draft").status_code == 404
        with sessions() as db:
            row = db.get(Product, product_id)
            assert row.price_dh == 0 and row.publication_status == "draft"
            assert row.research_record.commercial_ready is False
    finally:
        teardown_client(client, engine)


def test_admin_cannot_publish_research_row_with_unresolved_identity():
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            product = Product(sku="RESEARCH-ALIAS-001", slug="research-alias-draft",
                name="Possible Alias", official_name="Possible Alias", brand_id=1, category_id=1,
                price_dh=200, stock=0, active=False, publication_status="draft",
                image_url="/assets/catalog/local.webp", short_description="Short description",
                description="Full product content")
            product.research_record = ProductResearch(external_id="research-alias-draft",
                source_scope="COLLECTION", price_source="MERCHANT_ADMIN", media_status="APPROVED_LOCAL",
                commercial_ready=False, commercial_hold_reason="MANUAL_REVIEW_POSSIBLE_DUPLICATE")
            db.add(product)
            db.commit()
            product_id = product.id
            create_admin(db, "alias-admin@example.ma", "secure-password-123", "QA", "Owner")
        login = client.post("/api/auth/login", json={"email": "alias-admin@example.ma",
            "password": "secure-password-123"})
        assert login.status_code == 200
        response = client.patch(f"/api/admin/products/{product_id}", json={"publication_status": "published"})
        assert response.status_code == 422
        assert "rapprochement d’identité" in response.json()["detail"]
        with sessions() as db:
            row = db.get(Product, product_id)
            assert row.publication_status == "draft" and row.research_record.commercial_ready is False
    finally:
        teardown_client(client, engine)
