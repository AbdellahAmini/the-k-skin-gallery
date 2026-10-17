"""Store structured French and Darija content for pack pages.

Revision ID: 4f20c7d3e112
Revises: ec91b5d4a072
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "4f20c7d3e112"
down_revision: Union[str, None] = "ec91b5d4a072"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("bundles")}
    if "content_json" not in columns:
        op.add_column("bundles", sa.Column("content_json", sa.Text(), nullable=False, server_default="{}"))


def downgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("bundles")}
    if "content_json" in columns:
        op.drop_column("bundles", "content_json")
