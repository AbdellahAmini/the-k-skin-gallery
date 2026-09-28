from sqlalchemy import select

from app.models import Bundle, BundleItem, Concern, OrderBundleItem, Product, ProductMetadata, SkinType
from test_commerce_flow import build_client, teardown_client
from app.create_admin import create_admin


def test_taxonomy_filters_search_and_contextual_facets():
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            product = db.scalar(select(Product).where(Product.sku == "TEST-001"))
            product.skin_types.append(SkinType(name="Peau sensible", slug="peau-sensible"))
            product.concerns.append(Concern(name="Éclat", slug="eclat"))
            product.metadata_record = ProductMetadata(usage_time="am", search_aliases="sérum lumière")
            db.commit()

        response = client.get("/api/v1/products", params={
            "q": "lumiere", "skin_type": "peau-sensible", "concern": "eclat",
            "usage": "am", "brand": "test-brand"})
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["products"][0]["sku"] == "TEST-001"
        assert data["available_facets"]["skin_type"][0]["count"] == 1
        assert client.get("/api/v1/brands/test-brand").status_code == 200
        assert client.get("/api/v1/search?q=lumiere").json()["products"][0]["sku"] == "TEST-001"
        assert client.get("/api/v1/products?sort=best_sellers").status_code == 422
    finally:
        teardown_client(client, engine)


def test_pack_quote_order_and_shared_component_stock():
    client, sessions, engine = build_client()
    try:
        with sessions() as db:
            product = db.scalar(select(Product).where(Product.sku == "TEST-001"))
            bundle = Bundle(slug="test-duo", name="Test Duo", price_dh=220, active=True,
                            items=[BundleItem(product=product, quantity=2)])
            db.add(bundle)
            db.commit()
            bundle_id = bundle.id
            product_id = product.id

        lines = [{"bundle_id": bundle_id, "quantity": 2},
                 {"product_id": product_id, "quantity": 1}]
        quote = client.post("/api/v1/cart/validate", json={"items": lines, "city_id": 1})
        assert quote.status_code == 200
        assert quote.json()["subtotal_dh"] == 560
        assert quote.json()["shipping_dh"] == 0
        assert client.get("/api/v1/bundles/test-duo").json()["stock"] == 2

        payload = {"items": lines, "city_id": 1, "first_name": "Test",
                   "last_name": "Customer", "phone": "06 12 34 56 78",
                   "address": "12 rue de Test", "district": "Centre",
                   "client_request_id": "pack-test-request-0001"}
        created = client.post("/api/v1/checkout", json=payload)
        assert created.status_code == 201
        assert any(line["kind"] == "bundle" for line in created.json()["items"])
        with sessions() as db:
            assert db.get(Product, product_id).stock == 0
            assert db.scalars(select(OrderBundleItem)).first() is not None
        assert client.post("/api/v1/cart/validate", json={
            "items": [{"bundle_id": bundle_id, "quantity": 1}], "city_id": 1}).status_code == 409
    finally:
        teardown_client(client, engine)


def test_admin_bootstrap_allows_protected_catalog_access():
    client, sessions, engine = build_client()
    try:
        assert client.get("/api/admin/products").status_code == 401
        with sessions() as db:
            create_admin(db, "owner@example.ma", "secure-password-123", "Gallery", "Owner")
        login = client.post("/api/auth/login", json={
            "email": "owner@example.ma", "password": "secure-password-123"})
        assert login.status_code == 200
        assert login.json()["role"] == "admin"
        assert client.get("/api/admin/products").status_code == 200
    finally:
        teardown_client(client, engine)
