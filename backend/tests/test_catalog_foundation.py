import json
from types import SimpleNamespace

from sqlalchemy import func, select

from app.models import Brand, Category, Product, SkinType
from app.scripts import import_products as importer
from test_commerce_flow import build_client, teardown_client


def options(**overrides):
    return SimpleNamespace(**dict(dict(dry_run=False, update_existing=False,
        replace_relationships=False, create_brands=False, create_types=False,
        create_taxonomies=False, import_images=False), **overrides))


def test_import_dry_run_idempotency_validation_and_safe_blanks(tmp_path, monkeypatch):
    client, sessions, engine = build_client()
    monkeypatch.setattr(importer, "SessionLocal", sessions)
    path = tmp_path / "products.json"
    row = dict(brand="Test Brand", sku="NEW-001", official_name="New Serum",
               product_type="serums", price_dh=200, stock=0, cost_dh=80)
    path.write_text(json.dumps([row]), encoding="utf-8")
    try:
        assert importer.run(path, options(dry_run=True))[0]["status"] == "CREATED"
        with sessions() as db: assert db.scalar(select(func.count(Product.id))) == 1
        assert importer.run(path, options())[0]["status"] == "CREATED"
        assert client.get("/api/products?availability=out_of_stock").json()["total"] == 1
        assert importer.run(path, options())[0]["status"] == "SKIPPED"
        row.update(stock="", cost_dh=None, price_dh="", display_name_fr="Nom traduit")
        path.write_text(json.dumps([row]), encoding="utf-8")
        assert importer.run(path, options(update_existing=True))[0]["status"] == "UPDATED"
        with sessions() as db:
            product = db.scalar(select(Product).where(Product.sku == "NEW-001"))
            assert (product.stock, product.cost_dh, product.price_dh) == (0, 80, 200)
            assert db.scalar(select(func.count(Product.id))) == 2
        row["stock"] = -1
        path.write_text(json.dumps([row]), encoding="utf-8")
        assert importer.run(path, options())[0]["status"] == "ERROR"
    finally: teardown_client(client, engine)


def test_import_relationship_replacement_is_explicit(tmp_path, monkeypatch):
    client, sessions, engine = build_client()
    monkeypatch.setattr(importer, "SessionLocal", sessions)
    path = tmp_path / "relationships.json"
    row = dict(brand="Test Brand", sku="TEST-001", official_name="Test Serum",
               product_type="", skin_types="Sensitive QA", classification_verified=True)
    path.write_text(json.dumps([row]), encoding="utf-8")
    try:
        assert importer.run(path, options(update_existing=True, replace_relationships=True, create_taxonomies=True))[0]["status"] == "UPDATED"
        row["skin_types"] = ""
        path.write_text(json.dumps([row]), encoding="utf-8")
        importer.run(path, options(update_existing=True))
        with sessions() as db: assert len(db.scalar(select(Product)).skin_types) == 1
        importer.run(path, options(update_existing=True, replace_relationships=True))
        with sessions() as db: assert len(db.scalar(select(Product)).skin_types) == 0
    finally: teardown_client(client, engine)


def test_published_out_of_stock_search_availability_restock_and_private_costs():
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            original = db.scalar(select(Product))
            original.cost_dh = 80
            row = Product(sku="OUT-001", slug="out-serum", name="Out Serum", stock=0,
                          price_dh=150, brand_id=original.brand_id, category_id=original.category_id)
            hidden = Product(sku="DRAFT-001", slug="draft", name="Draft", stock=3,
                price_dh=150, brand_id=original.brand_id, category_id=original.category_id,
                publication_status="draft", active=True)
            db.add_all([row, hidden]); db.commit(); out_id = row.id
        data = client.get("/api/products?page_size=1").json()
        assert data["total"] == 2 and data["pages"] == 2
        assert data["products"][0]["stock"] > 0
        assert "cost_dh" not in data["products"][0]
        assert "wholesale_dh" not in data["products"][0]
        assert client.get("/api/products?availability=out_of_stock").json()["products"][0]["id"] == out_id
        assert client.get("/api/products?brand=test-brand").json()["total"] == 2
        assert client.get("/api/search?q=Out").json()["products"][0]["id"] == out_id
        assert client.get("/api/products/out-serum").status_code == 200
        assert client.get("/api/products/draft").status_code == 404
        assert client.post("/api/v1/cart/validate", json={"items": [{"product_id": 3, "quantity": 1}], "city_id": 1}).status_code == 409
        assert client.get("/api/navigation").status_code == 200
        payload = {"product_id": out_id, "email": "USER@example.ma"}
        assert client.post("/api/stock-alerts", json=payload).status_code == 201
        assert client.post("/api/stock-alerts", json=payload).json()["status"] == "already_subscribed"
        assert client.post("/api/stock-alerts", json={**payload, "email": "wrong"}).status_code == 422
        assert client.post("/api/stock-alerts", json={**payload, "product_id": 1}).status_code == 409
        assert client.post("/api/v1/cart/validate", json={"items": [{"product_id": out_id, "quantity": 1}], "city_id": 1}).status_code == 409
    finally: teardown_client(client, engine)


def test_classification_requires_review_and_contextual_counts():
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            product = db.scalar(select(Product))
            product.skin_types.append(SkinType(name="Peau sensible", slug="sensible"))
            db.commit()
        assert client.get("/api/products?skin_type=sensible").json()["total"] == 0
        with sessions() as db:
            db.scalar(select(Product)).classification_verified = True; db.commit()
        result = client.get("/api/products?brand=test-brand&skin_type=sensible").json()
        assert result["total"] == 1
        assert result["available_facets"]["skin_type"][0]["count"] == 1
    finally: teardown_client(client, engine)


def test_media_optimization_and_s3_adapter(tmp_path, monkeypatch):
    from io import BytesIO
    from PIL import Image
    import boto3
    from app.media import store_image
    image = BytesIO(); Image.new("RGB", (2000, 1000), "white").save(image, "PNG")
    calls = []
    monkeypatch.setenv("MEDIA_STORAGE", "s3")
    monkeypatch.setenv("MEDIA_S3_BUCKET", "qa")
    monkeypatch.setenv("MEDIA_PUBLIC_BASE_URL", "https://media.example.test")
    monkeypatch.setattr(boto3, "client", lambda *a, **k: SimpleNamespace(put_object=lambda **kw: calls.append(kw)))
    url = store_image(image.getvalue())
    assert url.endswith(".webp") and calls[0]["ContentType"] == "image/webp"
    with Image.open(BytesIO(calls[0]["Body"])) as output: assert output.size == (1800, 900)


def test_admin_verification_bulk_and_taxonomy_editor():
    from app.create_admin import create_admin
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            create_admin(db, "qa-owner@example.ma", "secure-password-123", "QA", "Owner")
        assert client.post("/api/auth/login", json={"email": "qa-owner@example.ma", "password": "secure-password-123"}).status_code == 200
        assert client.get("/api/admin/products?page=1&page_size=1").json()["total"] == 1
        assert client.patch("/api/admin/products/1", json={"mark_verified": True}).status_code == 422
        updated = client.patch("/api/admin/products/1", json={"official_source_name": "Official QA Source",
            "official_source_url": "https://example.test/product", "mark_verified": True, "cost_dh": 55})
        assert updated.status_code == 200
        assert updated.json()["verification_status"] == "VERIFIED" and updated.json()["verified_at"]
        assert updated.json()["cost_dh"] == 55
        assert "cost_dh" not in client.get("/api/products/test-serum").json()
        assert client.post("/api/admin/products/bulk", json={"product_ids": [1], "publication_status": "draft", "low_stock_threshold": 7}).status_code == 200
        assert client.get("/api/products").json()["total"] == 0
        assert client.get("/api/admin/products?publication_status=draft&page=1").json()["total"] == 1
        assert client.post("/api/admin/products/bulk", json={"product_ids": [1], "publication_status": "published"}).status_code == 200
        subtype = client.post("/api/admin/taxonomy/product-subtypes", json={"name": "Test subtype", "slug": "test-subtype", "product_type_slug": "serums"})
        assert subtype.status_code in {200, 201}
        assert client.patch("/api/admin/products/1", json={"category_slug": "serums", "product_subtype_slug": "test-subtype"}).status_code == 200
    finally: teardown_client(client, engine)


def test_admin_cursor_create_upload_and_all_matching_selection(monkeypatch):
    from io import BytesIO
    from PIL import Image
    from app.create_admin import create_admin
    from app.media import store_image
    client, sessions, engine = build_client()
    try:
        with sessions() as db: create_admin(db, "v2-owner@example.ma", "secure-password-123", "V2", "Admin")
        assert client.post("/api/auth/login", json={"email": "v2-owner@example.ma", "password": "secure-password-123"}).status_code == 200
        created = client.post("/api/admin/products", json={"sku": "DRAFT-002", "slug": "draft-two", "name": "Draft Two",
            "brand_slug": "test-brand", "category_slug": "serums", "price_dh": 0})
        assert created.status_code == 201
        assert created.json()["publication_status"] == "draft" and created.json()["price_dh"] == 0
        first = client.get("/api/admin/products?limit=1&sort=id").json()
        assert first["total"] == 2 and first["has_more"] and len(first["products"]) == 1
        second = client.get(f"/api/admin/products?limit=1&sort=id&cursor={first['next_cursor']}").json()
        assert second["products"][0]["id"] != first["products"][0]["id"]
        bulk = client.post("/api/admin/products/bulk", json={"selection": {"mode": "all_matching",
            "filters": {"publication_status": "draft"}, "excluded_ids": []}, "featured": True})
        assert bulk.status_code == 200
        assert bulk.json()["matched"] == bulk.json()["updated"] == 1
        image = BytesIO(); Image.new("RGB", (12, 10), "white").save(image, "PNG")
        monkeypatch.setattr("app.media.store_image", lambda data: "/assets/catalog/imported/test-upload.webp")
        response = client.post(f"/api/admin/products/{created.json()['id']}/images", files={"file": ("product.png", image.getvalue(), "image/png")})
        assert response.status_code == 201 and response.json()["is_primary"]
        refreshed = client.get(f"/api/admin/products/{created.json()['id']}").json()
        assert refreshed["image_url"] == "/assets/catalog/imported/test-upload.webp"
        assert len(refreshed["images"]) == 1 and refreshed["images"][0]["id"] == response.json()["id"]
    finally: teardown_client(client, engine)
