"""orders.ai_status

Revision ID: 0002
Revises: 0001
"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("ai_status", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "ai_status")
