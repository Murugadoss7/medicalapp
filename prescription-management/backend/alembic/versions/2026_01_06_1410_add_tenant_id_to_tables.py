"""add tenant_id to all tables

Revision ID: 2026_01_06_1410
Revises: 2026_01_06_1400
Create Date: 2026-01-06 14:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2026_01_06_1410'
down_revision = '2026_01_06_1400'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add tenant_id column to all existing tables
    NOTE: Column is NULLABLE initially to allow data migration
    """

    # List of tables that need tenant_id
    tables = [
        'users',
        'doctors',
        'patients',
        'medicines',
        'short_keys',
        'appointments',
        'prescriptions',
        'prescription_items',
        'dental_observations',
        'dental_procedures',
        'dental_observation_templates',
        'dental_attachments',
        'case_studies'
    ]

    for table in tables:
        print(f"Adding tenant_id to {table}...")

        # Add tenant_id column (NULLABLE for now)
        op.add_column(
            table,
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True, comment='Tenant reference')
        )

        # Add foreign key constraint
        op.create_foreign_key(
            f'fk_{table}_tenant',
            table,
            'tenants',
            ['tenant_id'],
            ['id'],
            ondelete='CASCADE'
        )

        # Create index for performance
        op.create_index(
            f'idx_{table}_tenant_id',
            table,
            ['tenant_id']
        )

        print(f"✅ tenant_id added to {table}")

    # Add composite indexes for common queries
    print("Creating composite indexes...")

    # Appointments: tenant + doctor + date
    op.create_index(
        'idx_appointments_tenant_doctor_date',
        'appointments',
        ['tenant_id', 'doctor_id', 'appointment_date']
    )

    # Prescriptions: tenant + doctor + visit_date
    op.create_index(
        'idx_prescriptions_tenant_doctor_date',
        'prescriptions',
        ['tenant_id', 'doctor_id', 'visit_date']
    )

    # Patients: tenant + mobile + first_name (for composite key lookup)
    op.create_index(
        'idx_patients_tenant_composite',
        'patients',
        ['tenant_id', 'mobile_number', 'first_name']
    )

    print("✅ All tenant_id columns and indexes created successfully")
    print("⚠️  NOTE: tenant_id is NULLABLE - you must migrate existing data before making it NOT NULL")


def downgrade():
    """
    Remove tenant_id from all tables
    """

    tables = [
        'users',
        'doctors',
        'patients',
        'medicines',
        'short_keys',
        'appointments',
        'prescriptions',
        'prescription_items',
        'dental_observations',
        'dental_procedures',
        'dental_observation_templates',
        'dental_attachments',
        'case_studies'
    ]

    # Drop composite indexes first
    op.drop_index('idx_patients_tenant_composite', table_name='patients')
    op.drop_index('idx_prescriptions_tenant_doctor_date', table_name='prescriptions')
    op.drop_index('idx_appointments_tenant_doctor_date', table_name='appointments')

    # Drop tenant_id from each table
    for table in tables:
        print(f"Removing tenant_id from {table}...")

        op.drop_index(f'idx_{table}_tenant_id', table_name=table)
        op.drop_constraint(f'fk_{table}_tenant', table, type_='foreignkey')
        op.drop_column(table, 'tenant_id')

        print(f"✅ tenant_id removed from {table}")

    print("✅ All tenant_id columns removed successfully")
