"""Index the importer fallback identity lookup.

Revision ID: d143c9b8f171
Revises: a7601d4e2c91
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d143c9b8f171"
down_revision: Union[str, None] = "a7601d4e2c91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    indexes = {item["name"] for item in sa.inspect(op.get_bind()).get_indexes("products")}
    if "ix_products_brand_official_name" not in indexes:
        op.create_index("ix_products_brand_official_name", "products", ["brand_id", "official_name"])


def downgrade() -> None:
    indexes = {item["name"] for item in sa.inspect(op.get_bind()).get_indexes("products")}
    if "ix_products_brand_official_name" in indexes:
        op.drop_index("ix_products_brand_official_name", table_name="products")
