"""init

Revision ID: 0001
Revises:
"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_types",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("schema_json", sa.JSON, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_product_types_slug", "product_types", ["slug"], unique=True)

    op.create_table(
        "templates",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("product_type_id", sa.Integer, sa.ForeignKey("product_types.id"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column("format", sa.String(10), nullable=False),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("tracking_code", sa.String(32), nullable=False),
        sa.Column("product_type_id", sa.Integer, sa.ForeignKey("product_types.id"), nullable=False),
        sa.Column("customer_name", sa.String(160), nullable=False),
        sa.Column("customer_email", sa.String(254), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("deliverable_template_id", sa.Integer, sa.ForeignKey("templates.id"), nullable=True),
        sa.Column("ai_draft", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_orders_tracking_code", "orders", ["tracking_code"], unique=True)
    op.create_index("ix_orders_status", "orders", ["status"])

    op.create_table(
        "order_fields",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("order_id", sa.Integer, sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("key", sa.String(80), nullable=False),
        sa.Column("value", sa.JSON, nullable=True),
    )
    op.create_index("ix_order_fields_order_id", "order_fields", ["order_id"])


def downgrade() -> None:
    op.drop_table("order_fields")
    op.drop_table("orders")
    op.drop_table("templates")
    op.drop_table("product_types")
