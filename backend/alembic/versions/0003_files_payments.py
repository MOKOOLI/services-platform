"""price/payment columns, payments, order_files

Revision ID: 0003
Revises: 0002
"""
import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("price_amount", sa.BigInteger, nullable=True))
    op.add_column("orders", sa.Column("price_currency", sa.String(3), nullable=False, server_default="IRT"))
    op.add_column("orders", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("order_id", sa.Integer, sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("authority", sa.String(64), nullable=False),
        sa.Column("amount", sa.BigInteger, nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("status", sa.String(10), nullable=False),
        sa.Column("ref_id", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_payments_order_id", "payments", ["order_id"])
    op.create_index("ix_payments_authority", "payments", ["authority"], unique=True)

    op.create_table(
        "order_files",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("order_id", sa.Integer, sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(12), nullable=False),
        sa.Column("filename", sa.String(200), nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("size", sa.BigInteger, nullable=False),
        sa.Column("storage_key", sa.String(400), nullable=False, unique=True),
        sa.Column("status", sa.String(10), nullable=False),
        sa.Column("uploaded_by", sa.String(10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_order_files_order_id", "order_files", ["order_id"])


def downgrade() -> None:
    op.drop_table("order_files")
    op.drop_table("payments")
    op.drop_column("orders", "paid_at")
    op.drop_column("orders", "price_currency")
    op.drop_column("orders", "price_amount")
