"""fix prescription_templates url columns to TEXT

Revision ID: 2026_01_16_fix_urls
Revises: 2026_01_16_templates
Create Date: 2026-01-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2026_01_16_fix_urls'
down_revision = '2026_01_16_templates'
branch_labels = None
depends_on = None


def upgrade():
    """
    Change logo_url and signature_url from VARCHAR(500) to TEXT
    to support base64 data URLs which are much larger.
    """
    print("\n" + "=" * 60)
    print("Altering prescription_templates URL columns to TEXT")
    print("=" * 60)

    # Alter logo_url column
    op.alter_column(
        'prescription_templates',
        'logo_url',
        existing_type=sa.String(500),
        type_=sa.Text(),
        existing_nullable=True
    )
    print("  ✓ logo_url changed to TEXT")

    # Alter signature_url column
    op.alter_column(
        'prescription_templates',
        'signature_url',
        existing_type=sa.String(500),
        type_=sa.Text(),
        existing_nullable=True
    )
    print("  ✓ signature_url changed to TEXT")

    print("\n" + "=" * 60)
    print("✅ URL columns updated successfully!")
    print("=" * 60)


def downgrade():
    """
    Revert logo_url and signature_url back to VARCHAR(500).
    WARNING: This may truncate data if base64 URLs are stored.
    """
    print("\nReverting prescription_templates URL columns to VARCHAR(500)")

    op.alter_column(
        'prescription_templates',
        'logo_url',
        existing_type=sa.Text(),
        type_=sa.String(500),
        existing_nullable=True
    )
    print("  ✓ logo_url reverted to VARCHAR(500)")

    op.alter_column(
        'prescription_templates',
        'signature_url',
        existing_type=sa.Text(),
        type_=sa.String(500),
        existing_nullable=True
    )
    print("  ✓ signature_url reverted to VARCHAR(500)")

    print("\n✅ URL columns reverted")
