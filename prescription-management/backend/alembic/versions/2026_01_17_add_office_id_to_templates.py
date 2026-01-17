"""Add office_id to prescription_templates

Revision ID: add_office_id_templates
Revises: 2026_01_16_fix_template_url_columns
Create Date: 2026-01-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_office_id_templates'
down_revision = '2026_01_16_fix_urls'
branch_labels = None
depends_on = None


def upgrade():
    """Add office_id column to prescription_templates table"""
    # Add office_id column (nullable UUID referencing doctor's offices JSONB array)
    op.add_column(
        'prescription_templates',
        sa.Column(
            'office_id',
            postgresql.UUID(as_uuid=True),
            nullable=True,
            comment='Office ID from doctor offices array (NULL = doctor/tenant default)'
        )
    )

    # Add index for office_id
    op.create_index(
        'idx_prescription_templates_office',
        'prescription_templates',
        ['office_id']
    )

    # Add composite index for doctor_id + office_id
    op.create_index(
        'idx_prescription_templates_doctor_office',
        'prescription_templates',
        ['doctor_id', 'office_id']
    )


def downgrade():
    """Remove office_id column from prescription_templates table"""
    # Drop indexes
    op.drop_index('idx_prescription_templates_doctor_office', table_name='prescription_templates')
    op.drop_index('idx_prescription_templates_office', table_name='prescription_templates')

    # Drop column
    op.drop_column('prescription_templates', 'office_id')
