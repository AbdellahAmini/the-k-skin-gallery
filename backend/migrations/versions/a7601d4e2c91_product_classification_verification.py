"""Track validation of store-curated product classifications separately.

Revision ID: a7601d4e2c91
Revises: 5c8f3d9a1b20
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a7601d4e2c91"
down_revision: Union[str, None] = "5c8f3d9a1b20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("products")}
    if "classification_verified" not in columns:
        op.add_column("products", sa.Column("classification_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    if "classification_verified_at" not in columns:
        op.add_column("products", sa.Column("classification_verified_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("products")}
    if "classification_verified_at" in columns: op.drop_column("products", "classification_verified_at")
    if "classification_verified" in columns: op.drop_column("products", "classification_verified")
