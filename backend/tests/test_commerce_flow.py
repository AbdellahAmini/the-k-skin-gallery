from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import Brand, Category, City, InventoryReservation, NotificationOutbox, Order, Product, SiteSetting


def build_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_db():
        with test_sessions() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    with test_sessions() as db:
        brand = Brand(name="Test Brand", slug="test-brand")
        category = Category(name="Sérums", slug="serums")
        city = City(name="Casablanca Test", region="Test", shipping_dh=25)
        db.add_all([brand, category, city, SiteSetting(key="free_shipping_threshold_dh", value="500")])
        db.flush()
        db.add(Product(
            sku="TEST-001", slug="test-serum", name="Test Serum", brand_id=brand.id,
            category_id=category.id, price_dh=120, stock=5, active=True,
            featured=False, new_arrival=False,
        ))
        db.commit()

    return TestClient(app), test_sessions, engine


def teardown_client(client, engine):
    client.close()
    app.dependency_overrides.clear()
    engine.dispose()


def order_payload(quantity=2):
    return {
        "items": [{"product_id": 1, "quantity": quantity, "unit_price_dh": 1}],
        "city_id": 1,
        "first_name": "Test",
        "last_name": "Customer",
        "phone": "06 12 34 56 78",
        "email": "test@example.ma",
        "address": "12 rue de Test",
        "district": "Centre",
        "client_request_id": "test-request-0001",
    }


def test_server_calculates_quote_and_order_and_retry_is_idempotent():
    client, sessions, engine = build_client()
    try:
        quote = client.post("/api/quote", json={"items": [{"product_id": 1, "quantity": 2}], "city_id": 1})
        assert quote.status_code == 200
        assert quote.json()["subtotal_dh"] == 240
        assert quote.json()["shipping_dh"] == 25
        assert quote.json()["total_dh"] == 265

        created = client.post("/api/orders", json=order_payload())
        assert created.status_code == 201
        order = created.json()
        assert order["total_dh"] == 265
        assert order["status"] == "a_confirmer"
        assert order["phone"] == "+212612345678"

        retry = client.post("/api/orders", json=order_payload())
        assert retry.status_code == 200
        assert retry.json()["id"] == order["id"]

        with sessions() as db:
            product = db.scalar(select(Product).where(Product.sku == "TEST-001"))
            assert product.stock == 3
            assert db.scalar(select(Order).where(Order.number == order["number"])) is not None
            assert len(db.scalars(select(InventoryReservation)).all()) == 1
            assert len(db.scalars(select(NotificationOutbox)).all()) == 1
    finally:
        teardown_client(client, engine)


def test_order_rejects_insufficient_stock_without_mutating_inventory():
    client, sessions, engine = build_client()
    try:
        response = client.post("/api/orders", json=order_payload(quantity=6))
        assert response.status_code == 409
        assert "Stock insuffisant" in response.json()["detail"]
        with sessions() as db:
            product = db.scalar(select(Product).where(Product.sku == "TEST-001"))
            assert product.stock == 5
            assert db.scalars(select(Order)).all() == []
            assert db.scalars(select(NotificationOutbox)).all() == []
    finally:
        teardown_client(client, engine)
