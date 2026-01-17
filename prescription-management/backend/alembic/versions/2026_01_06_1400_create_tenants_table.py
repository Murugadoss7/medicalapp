"""create tenants table

Revision ID: 2026_01_06_1400
Revises: 53cebb2ea904
Create Date: 2026-01-06 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2026_01_06_1400'
down_revision = '53cebb2ea904'  # Latest migration
branch_labels = None
depends_on = None


def upgrade():
    """
    Create tenants table for multi-tenancy support
    """
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),

        # Basic Information
        sa.Column('tenant_name', sa.String(200), nullable=False, comment='Organization/clinic group name'),
        sa.Column('tenant_code', sa.String(50), nullable=False, unique=True, comment='Unique tenant code'),

        # Subscription Management
        sa.Column('subscription_plan', sa.String(50), nullable=False, server_default='trial', comment='Subscription plan: trial, basic, premium, enterprise'),
        sa.Column('subscription_status', sa.String(50), nullable=False, server_default='active', comment='Status: active, suspended, cancelled'),
        sa.Column('trial_ends_at', sa.TIMESTAMP(timezone=True), nullable=True, comment='Trial expiration date'),
        sa.Column('subscription_ends_at', sa.TIMESTAMP(timezone=True), nullable=True, comment='Subscription expiration date'),

        # Subscription Limits
        sa.Column('max_clinics', sa.Integer, nullable=False, server_default='1', comment='Maximum clinics allowed'),
        sa.Column('max_doctors', sa.Integer, nullable=False, server_default='5', comment='Maximum doctors allowed'),
        sa.Column('max_patients', sa.Integer, nullable=False, server_default='1000', comment='Maximum patients allowed'),
        sa.Column('max_storage_mb', sa.Integer, nullable=False, server_default='1000', comment='Maximum storage in MB'),

        # Contact Information
        sa.Column('billing_email', sa.String(255), nullable=True, comment='Billing contact email'),
        sa.Column('support_email', sa.String(255), nullable=True, comment='Support contact email'),
        sa.Column('phone', sa.String(20), nullable=True, comment='Primary contact phone'),

        # Settings (JSONB for flexibility)
        sa.Column('settings', postgresql.JSONB, nullable=True, server_default='{}', comment='Tenant-specific settings'),

        # Audit Fields (matching BaseModel pattern)
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
    )

    # Create indexes
    op.create_index('idx_tenants_code', 'tenants', ['tenant_code'])
    op.create_index('idx_tenants_status', 'tenants', ['subscription_status', 'is_active'])
    op.create_index('idx_tenants_plan', 'tenants', ['subscription_plan'])

    print("✅ Tenants table created successfully")


def downgrade():
    """
    Drop tenants table
    """
    op.drop_index('idx_tenants_plan', table_name='tenants')
    op.drop_index('idx_tenants_status', table_name='tenants')
    op.drop_index('idx_tenants_code', table_name='tenants')
    op.drop_table('tenants')

    print("✅ Tenants table dropped successfully")
