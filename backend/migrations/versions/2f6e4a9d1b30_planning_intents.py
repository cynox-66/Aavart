"""planning_intents

Revision ID: 2f6e4a9d1b30
Revises: 97da68b1d7c5
Create Date: 2026-08-30 19:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2f6e4a9d1b30"
down_revision: Union[str, None] = "97da68b1d7c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "planning_intents",
        sa.Column("id", sa.String(length=100), nullable=False),
        sa.Column("base_run_id", sa.String(length=100), nullable=False),
        sa.Column("actor", sa.String(length=100), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("rejected_edits", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_planning_intents_base_run",
        "planning_intents",
        ["base_run_id"],
        unique=False,
    )
    op.add_column("planning_runs", sa.Column("intent_id", sa.String(length=100), nullable=True))
    op.create_foreign_key(
        "fk_planning_runs_intent_id_planning_intents",
        "planning_runs",
        "planning_intents",
        ["intent_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_planning_runs_intent_id_planning_intents",
        "planning_runs",
        type_="foreignkey",
    )
    op.drop_column("planning_runs", "intent_id")
    op.drop_index("ix_planning_intents_base_run", table_name="planning_intents")
    op.drop_table("planning_intents")
