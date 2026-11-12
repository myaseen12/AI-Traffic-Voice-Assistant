"""add_traffic_rules_verification_and_sources

Revision ID: 77c1bb579c6e
Revises: 859647909b42
Create Date: 2026-11-07 14:49:38.215571

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '77c1bb579c6e'
down_revision: Union[str, Sequence[str], None] = '859647909b42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add source references, jurisdiction, and verification tracking."""
    with op.batch_alter_table('traffic_rules', schema=None) as batch_op:
        batch_op.add_column(sa.Column('source', sa.String(length=255), server_default='Provincial Motor Vehicles Ordinance 1965', nullable=False))
        batch_op.add_column(sa.Column('jurisdiction', sa.String(length=120), server_default='Federal / Provincial Highways', nullable=False))
        batch_op.add_column(sa.Column('verification_status', sa.String(length=32), server_default='VERIFIED', nullable=False))
        batch_op.add_column(sa.Column('source_wording', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('source_url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('verified_by_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('verification_notes', sa.Text(), nullable=True))
        batch_op.create_index(batch_op.f('ix_traffic_rules_jurisdiction'), ['jurisdiction'], unique=False)
        batch_op.create_index(batch_op.f('ix_traffic_rules_verification_status'), ['verification_status'], unique=False)
        batch_op.create_foreign_key('fk_traffic_rules_verified_by_id_users', 'users', ['verified_by_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('traffic_rules', schema=None) as batch_op:
        batch_op.drop_constraint('fk_traffic_rules_verified_by_id_users', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_traffic_rules_verification_status'))
        batch_op.drop_index(batch_op.f('ix_traffic_rules_jurisdiction'))
        batch_op.drop_column('verification_notes')
        batch_op.drop_column('verified_at')
        batch_op.drop_column('verified_by_id')
        batch_op.drop_column('source_url')
        batch_op.drop_column('source_wording')
        batch_op.drop_column('verification_status')
        batch_op.drop_column('jurisdiction')
        batch_op.drop_column('source')
