from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Table, Column, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def now():
    return datetime.now(timezone.utc)


product_skin_types = Table("product_skin_types", Base.metadata,
    Column("product_id", ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("skin_type_id", ForeignKey("skin_types.id", ondelete="CASCADE"), primary_key=True))
product_concerns = Table("product_concerns", Base.metadata,
    Column("product_id", ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("concern_id", ForeignKey("concerns.id", ondelete="CASCADE"), primary_key=True))
product_ingredients = Table("product_ingredients", Base.metadata,
    Column("product_id", ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("ingredient_id", ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True))


class SkinType(Base):
    __tablename__ = "skin_types"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Concern(Base):
    __tablename__ = "concerns"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Ingredient(Base):
    __tablename__ = "ingredients"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)


class ProductMetadata(Base):
    __tablename__ = "product_metadata"
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    usage_time: Mapped[str] = mapped_column(String(8), default="")  # am, pm, both, or unverified
    routine_step: Mapped[str] = mapped_column(String(40), default="")
    search_aliases: Mapped[str] = mapped_column(Text, default="")
    official_source_name: Mapped[str] = mapped_column(String(160), default="")
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    new_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    product: Mapped["Product"] = relationship(back_populates="metadata_record")


class Brand(Base):
    __tablename__ = "brands"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    logo: Mapped[str] = mapped_column(String(500), default="")
    description_fr: Mapped[str] = mapped_column(Text, default="")
    official_website: Mapped[str] = mapped_column(String(500), default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    featured_homepage: Mapped[bool] = mapped_column(Boolean, default=False)
    homepage_order: Mapped[int] = mapped_column(Integer, default=0)
    seo_title: Mapped[str] = mapped_column(String(180), default="")
    seo_description: Mapped[str] = mapped_column(String(320), default="")
    products: Mapped[list["Product"]] = relationship(back_populates="brand")


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    subtypes: Mapped[list["ProductSubtype"]] = relationship(back_populates="product_type", cascade="all, delete-orphan")


# ProductType is the domain name; Category remains the ORM and API compatibility name.
ProductType = Category


class ProductSubtype(Base):
    __tablename__ = "product_subtypes"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    product_type_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    product_type: Mapped[Category] = relationship(back_populates="subtypes")


class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    sku: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    barcode: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(300))
    official_name: Mapped[str] = mapped_column(String(300), default="")
    display_name_fr: Mapped[str] = mapped_column(String(300), default="")
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    product_subtype_id: Mapped[int | None] = mapped_column(ForeignKey("product_subtypes.id"), nullable=True, index=True)
    size: Mapped[str] = mapped_column(String(50), default="")
    size_value: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    size_unit: Mapped[str] = mapped_column(String(20), default="")
    image_url: Mapped[str] = mapped_column(String(350), default="")
    price_dh: Mapped[int] = mapped_column(Integer)
    compare_at_dh: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_dh: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wholesale_dh: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=3)
    stock_is_sample: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    publication_status: Mapped[str] = mapped_column(String(16), default="published", index=True)
    verification_status: Mapped[str] = mapped_column(String(20), default="UNVERIFIED", index=True)
    classification_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    classification_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    new_arrival: Mapped[bool] = mapped_column(Boolean, default=False)
    short_description: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    manufacturer_description: Mapped[str] = mapped_column(Text, default="")
    manufacturer_benefits: Mapped[str] = mapped_column(Text, default="")
    benefits_fr: Mapped[str] = mapped_column(Text, default="")
    usage_instructions: Mapped[str] = mapped_column(Text, default="")
    usage_instructions_fr: Mapped[str] = mapped_column(Text, default="")
    inci: Mapped[str] = mapped_column(Text, default="")
    warnings_fr: Mapped[str] = mapped_column(Text, default="")
    official_source_url: Mapped[str] = mapped_column(String(500), default="")
    source_language: Mapped[str] = mapped_column(String(16), default="")
    seo_title: Mapped[str] = mapped_column(String(180), default="")
    seo_description: Mapped[str] = mapped_column(String(320), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    brand: Mapped[Brand] = relationship(back_populates="products")
    category: Mapped[Category] = relationship()
    product_subtype: Mapped[ProductSubtype | None] = relationship()
    images: Mapped[list["ProductImage"]] = relationship(back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.position")
    metadata_record: Mapped[ProductMetadata | None] = relationship(back_populates="product", uselist=False, cascade="all, delete-orphan")
    skin_types: Mapped[list[SkinType]] = relationship(secondary=product_skin_types)
    concerns: Mapped[list[Concern]] = relationship(secondary=product_concerns)
    ingredients: Mapped[list[Ingredient]] = relationship(secondary=product_ingredients)
    research_record: Mapped["ProductResearch | None"] = relationship(
        back_populates="product", uselist=False, cascade="all, delete-orphan")


class ProductResearch(Base):
    """Private provenance and commercial readiness for imported research rows."""
    __tablename__ = "product_research"
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    external_id: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    source_scope: Mapped[str] = mapped_column(String(30), default="")
    desired_visibility: Mapped[str] = mapped_column(String(30), default="")
    official_reference_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    official_reference_currency: Mapped[str] = mapped_column(String(8), default="")
    official_price_note: Mapped[str] = mapped_column(Text, default="")
    price_source: Mapped[str] = mapped_column(String(40), default="")
    media_status: Mapped[str] = mapped_column(String(40), default="NEEDS_ASSET_INGESTION")
    pdp_content_status: Mapped[str] = mapped_column(String(40), default="INCOMPLETE")
    commercial_ready: Mapped[bool] = mapped_column(Boolean, default=False)
    commercial_hold_reason: Mapped[str] = mapped_column(String(300), default="")
    selection_basis: Mapped[str] = mapped_column(String(160), default="")
    curation_basis: Mapped[str] = mapped_column(String(160), default="")
    research_notes: Mapped[str] = mapped_column(Text, default="")
    raw_payload_json: Mapped[str] = mapped_column(Text, default="{}")
    merged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    product: Mapped[Product] = relationship(back_populates="research_record")


class ProductImage(Base):
    __tablename__ = "product_images"
    __table_args__ = (UniqueConstraint("product_id", "position"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    image_url: Mapped[str] = mapped_column(String(500))
    source_url: Mapped[str] = mapped_column(String(1000), default="")
    alt_text: Mapped[str] = mapped_column(String(300), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    product: Mapped[Product] = relationship(back_populates="images")


class Routine(Base):
    __tablename__ = "routines"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    steps: Mapped[list["RoutineStep"]] = relationship(back_populates="routine", cascade="all, delete-orphan", order_by="RoutineStep.position")


class RoutineStep(Base):
    __tablename__ = "routine_steps"
    id: Mapped[int] = mapped_column(primary_key=True)
    routine_id: Mapped[int] = mapped_column(ForeignKey("routines.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    category_slug: Mapped[str] = mapped_column(String(140), default="")
    routine: Mapped[Routine] = relationship(back_populates="steps")
    products: Mapped[list["RoutineStepProduct"]] = relationship(back_populates="step", cascade="all, delete-orphan", order_by="RoutineStepProduct.position")


class RoutineStepProduct(Base):
    __tablename__ = "routine_step_products"
    __table_args__ = (UniqueConstraint("step_id", "product_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    step_id: Mapped[int] = mapped_column(ForeignKey("routine_steps.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    step: Mapped[RoutineStep] = relationship(back_populates="products")
    product: Mapped[Product] = relationship()


class Bundle(Base):
    __tablename__ = "bundles"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(350), default="")
    price_dh: Mapped[int] = mapped_column(Integer)
    compare_at_dh: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    items: Mapped[list["BundleItem"]] = relationship(back_populates="bundle", cascade="all, delete-orphan")


class BundleItem(Base):
    __tablename__ = "bundle_items"
    __table_args__ = (UniqueConstraint("bundle_id", "product_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    bundle_id: Mapped[int] = mapped_column(ForeignKey("bundles.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    bundle: Mapped[Bundle] = relationship(back_populates="items")
    product: Mapped[Product] = relationship()


class Collection(Base):
    __tablename__ = "collections"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    mode: Mapped[str] = mapped_column(String(20), default="manual")
    rule_json: Mapped[str] = mapped_column(Text, default="{}")
    active: Mapped[bool] = mapped_column(Boolean, default=False)
    products: Mapped[list["CollectionProduct"]] = relationship(back_populates="collection", cascade="all, delete-orphan")


class CollectionProduct(Base):
    __tablename__ = "collection_products"
    __table_args__ = (UniqueConstraint("collection_id", "product_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    collection_id: Mapped[int] = mapped_column(ForeignKey("collections.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    collection: Mapped[Collection] = relationship(back_populates="products")
    product: Mapped[Product] = relationship()


class ContentSection(Base):
    __tablename__ = "content_sections"
    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    payload_json: Mapped[str] = mapped_column(Text, default="{}")


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(240))
    excerpt: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class BundleCartItem(Base):
    __tablename__ = "bundle_cart_items"
    __table_args__ = (UniqueConstraint("user_id", "bundle_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    bundle_id: Mapped[int] = mapped_column(ForeignKey("bundles.id"))
    quantity: Mapped[int] = mapped_column(Integer)


class OrderBundleItem(Base):
    __tablename__ = "order_bundle_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    bundle_id: Mapped[int] = mapped_column(ForeignKey("bundles.id"))
    name: Mapped[str] = mapped_column(String(200))
    image_url: Mapped[str] = mapped_column(String(350), default="")
    components_json: Mapped[str] = mapped_column(Text, default="[]")
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price_dh: Mapped[int] = mapped_column(Integer)
    line_total_dh: Mapped[int] = mapped_column(Integer)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(250), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(500))
    first_name: Mapped[str] = mapped_column(String(100), default="")
    last_name: Mapped[str] = mapped_column(String(100), default="")
    phone: Mapped[str] = mapped_column(String(30), default="")
    role: Mapped[str] = mapped_column(String(20), default="customer")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class City(Base):
    __tablename__ = "cities"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(130), unique=True)
    region: Mapped[str] = mapped_column(String(130), default="")
    shipping_dh: Mapped[int] = mapped_column(Integer, default=35)
    delivery_window: Mapped[str] = mapped_column(String(50), default="24–48h")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Promotion(Base):
    __tablename__ = "promotions"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    code: Mapped[str | None] = mapped_column(String(60), unique=True, nullable=True)
    kind: Mapped[str] = mapped_column(String(30))  # percent, fixed, free_shipping
    amount: Mapped[int] = mapped_column(Integer, default=0)
    minimum_dh: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=False)


class SiteSetting(Base):
    __tablename__ = "site_settings"
    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="")


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer)


class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_token: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    client_request_id: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    number: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[str] = mapped_column(String(250), default="")
    city: Mapped[str] = mapped_column(String(130))
    region: Mapped[str] = mapped_column(String(130), default="")
    address: Mapped[str] = mapped_column(String(500))
    district: Mapped[str] = mapped_column(String(200), default="")
    complement: Mapped[str] = mapped_column(String(300), default="")
    delivery_notes: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40), default="a_confirmer")
    subtotal_dh: Mapped[int] = mapped_column(Integer)
    discount_dh: Mapped[int] = mapped_column(Integer, default=0)
    shipping_dh: Mapped[int] = mapped_column(Integer)
    total_dh: Mapped[int] = mapped_column(Integer)
    promotion_code: Mapped[str] = mapped_column(String(60), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    bundle_items: Mapped[list[OrderBundleItem]] = relationship(cascade="all, delete-orphan")
    history: Mapped[list["OrderStatusHistory"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    sku: Mapped[str] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(300))
    brand: Mapped[str] = mapped_column(String(120))
    image_url: Mapped[str] = mapped_column(String(350))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price_dh: Mapped[int] = mapped_column(Integer)
    line_total_dh: Mapped[int] = mapped_column(Integer)
    order: Mapped[Order] = relationship(back_populates="items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    status: Mapped[str] = mapped_column(String(40))
    note: Mapped[str] = mapped_column(Text, default="")
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    order: Mapped[Order] = relationship(back_populates="history")


class InventoryReservation(Base):
    __tablename__ = "inventory_reservations"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    released: Mapped[bool] = mapped_column(Boolean, default=False)


class NotificationOutbox(Base):
    __tablename__ = "notification_outbox"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    channel: Mapped[str] = mapped_column(String(30), default="telegram")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class StockAlert(Base):
    __tablename__ = "stock_alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    email: Mapped[str] = mapped_column(String(250))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
