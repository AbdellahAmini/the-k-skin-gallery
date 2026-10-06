"""Add provenance, lifecycle, taxonomy and product media catalog foundation.

Revision ID: 5c8f3d9a1b20
Revises: 3b53de908a0d
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "5c8f3d9a1b20"
down_revision: Union[str, None] = "3b53de908a0d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def has_table(name: str) -> bool:
    return name in sa.inspect(op.get_bind()).get_table_names()


def has_column(table: str, name: str) -> bool:
    return name in {column["name"] for column in sa.inspect(op.get_bind()).get_columns(table)}


def add_column_if_missing(table: str, column: sa.Column) -> None:
    if not has_column(table, column.name):
        op.add_column(table, column)


def create_index_if_missing(name: str, table: str, columns: list[str], unique: bool = False) -> None:
    indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table)}
    if name not in indexes:
        op.create_index(name, table, columns, unique=unique)


def upgrade() -> None:
    for name, column in [
        ("logo", sa.Column("logo", sa.String(500), nullable=False, server_default="")),
        ("description_fr", sa.Column("description_fr", sa.Text(), nullable=False, server_default="")),
        ("official_website", sa.Column("official_website", sa.String(500), nullable=False, server_default="")),
        ("active", sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true())),
        ("featured_homepage", sa.Column("featured_homepage", sa.Boolean(), nullable=False, server_default=sa.false())),
        ("homepage_order", sa.Column("homepage_order", sa.Integer(), nullable=False, server_default="0")),
        ("seo_title", sa.Column("seo_title", sa.String(180), nullable=False, server_default="")),
        ("seo_description", sa.Column("seo_description", sa.String(320), nullable=False, server_default="")),
    ]:
        add_column_if_missing("brands", column)

    if not has_table("product_subtypes"):
        op.create_table(
        "product_subtypes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("slug", sa.String(140), nullable=False),
        sa.Column("product_type_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    create_index_if_missing("ix_product_subtypes_slug", "product_subtypes", ["slug"], unique=True)
    create_index_if_missing("ix_product_subtypes_product_type_id", "product_subtypes", ["product_type_id"])

    product_columns = [
        sa.Column("barcode", sa.String(80), nullable=True),
        sa.Column("official_name", sa.String(300), nullable=False, server_default=""),
        sa.Column("display_name_fr", sa.String(300), nullable=False, server_default=""),
        sa.Column("product_subtype_id", sa.Integer(),
            None if op.get_bind().dialect.name == "sqlite" else sa.ForeignKey("product_subtypes.id"), nullable=True),
        sa.Column("size_value", sa.Numeric(10, 2), nullable=True),
        sa.Column("size_unit", sa.String(20), nullable=False, server_default=""),
        sa.Column("low_stock_threshold", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("publication_status", sa.String(16), nullable=False, server_default="published"),
        sa.Column("verification_status", sa.String(20), nullable=False, server_default="UNVERIFIED"),
        sa.Column("manufacturer_description", sa.Text(), nullable=False, server_default=""),
        sa.Column("manufacturer_benefits", sa.Text(), nullable=False, server_default=""),
        sa.Column("benefits_fr", sa.Text(), nullable=False, server_default=""),
        sa.Column("usage_instructions_fr", sa.Text(), nullable=False, server_default=""),
        sa.Column("warnings_fr", sa.Text(), nullable=False, server_default=""),
        sa.Column("source_language", sa.String(16), nullable=False, server_default=""),
        sa.Column("seo_title", sa.String(180), nullable=False, server_default=""),
        sa.Column("seo_description", sa.String(320), nullable=False, server_default=""),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    ]
    for column in product_columns:
        add_column_if_missing("products", column)
    bind = op.get_bind()
    bind.execute(sa.text("UPDATE products SET official_name = name, display_name_fr = name, publication_status = CASE WHEN active THEN 'published' ELSE 'archived' END, updated_at = CURRENT_TIMESTAMP"))
    bind.execute(sa.text("UPDATE products SET verification_status = 'VERIFIED' WHERE id IN (SELECT product_id FROM product_metadata WHERE verified_at IS NOT NULL)"))
    create_index_if_missing("ix_products_publication_status", "products", ["publication_status"])
    create_index_if_missing("ix_products_verification_status", "products", ["verification_status"])
    create_index_if_missing("ix_products_barcode", "products", ["barcode"], unique=True)
    create_index_if_missing("ix_products_product_subtype_id", "products", ["product_subtype_id"])

    image_table_existed = has_table("product_images")
    if not image_table_existed:
        op.create_table(
        "product_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("source_url", sa.String(1000), nullable=False, server_default=""),
        sa.Column("alt_text", sa.String(300), nullable=False, server_default=""),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("product_id", "position", name="uq_product_images_position"),
        )
    create_index_if_missing("ix_product_images_product_id", "product_images", ["product_id"])
    bind.execute(sa.text("INSERT INTO product_images (product_id, image_url, alt_text, position, is_primary, created_at) SELECT p.id, p.image_url, p.name, 0, true, CURRENT_TIMESTAMP FROM products p WHERE p.image_url IS NOT NULL AND p.image_url <> '' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id)"))


def downgrade() -> None:
    op.drop_index("ix_product_images_product_id", table_name="product_images")
    op.drop_table("product_images")
    op.drop_index("ix_products_product_subtype_id", table_name="products")
    op.drop_index("ix_products_barcode", table_name="products")
    op.drop_index("ix_products_verification_status", table_name="products")
    op.drop_index("ix_products_publication_status", table_name="products")
    for column in ["updated_at", "seo_description", "seo_title", "source_language", "warnings_fr",
                   "usage_instructions_fr", "benefits_fr", "manufacturer_benefits", "manufacturer_description",
                   "verification_status", "publication_status", "low_stock_threshold", "size_unit", "size_value",
                   "product_subtype_id", "display_name_fr", "official_name", "barcode"]:
        op.drop_column("products", column)
    op.drop_index("ix_product_subtypes_product_type_id", table_name="product_subtypes")
    op.drop_index("ix_product_subtypes_slug", table_name="product_subtypes")
    op.drop_table("product_subtypes")
    for column in ["seo_description", "seo_title", "homepage_order", "featured_homepage", "active",
                   "official_website", "description_fr", "logo"]:
        op.drop_column("brands", column)
