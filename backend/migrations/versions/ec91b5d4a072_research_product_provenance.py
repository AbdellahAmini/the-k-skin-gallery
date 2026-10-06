"""Track research source provenance and draft readiness per product.

Revision ID: ec91b5d4a072
Revises: d143c9b8f171
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ec91b5d4a072"
down_revision: Union[str, None] = "d143c9b8f171"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_research",
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("external_id", sa.String(length=180), nullable=False),
        sa.Column("source_scope", sa.String(length=30), nullable=False, server_default=""),
        sa.Column("desired_visibility", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("official_reference_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("official_reference_currency", sa.String(length=8), nullable=False, server_default=""),
        sa.Column("official_price_note", sa.Text(), nullable=False, server_default=""),
        sa.Column("price_source", sa.String(length=40), nullable=False, server_default=""),
        sa.Column("media_status", sa.String(length=40), nullable=False, server_default="NEEDS_ASSET_INGESTION"),
        sa.Column("pdp_content_status", sa.String(length=40), nullable=False, server_default="INCOMPLETE"),
        sa.Column("commercial_ready", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("commercial_hold_reason", sa.String(length=300), nullable=False, server_default=""),
        sa.Column("selection_basis", sa.String(length=160), nullable=False, server_default=""),
        sa.Column("curation_basis", sa.String(length=160), nullable=False, server_default=""),
        sa.Column("research_notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("raw_payload_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("merged_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("product_id"),
    )
    op.create_index("ix_product_research_external_id", "product_research", ["external_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_product_research_external_id", table_name="product_research")
    op.drop_table("product_research")
