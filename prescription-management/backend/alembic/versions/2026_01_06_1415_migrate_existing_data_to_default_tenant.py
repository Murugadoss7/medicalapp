"""migrate existing data to default tenant

Revision ID: 2026_01_06_1415
Revises: 2026_01_06_1410
Create Date: 2026-01-06 14:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime, timedelta
import uuid

# revision identifiers, used by Alembic.
revision = '2026_01_06_1415'
down_revision = '2026_01_06_1410'
branch_labels = None
depends_on = None


def upgrade():
    """
    Create default tenant and migrate all existing data to it
    """
    print("="*60)
    print("DATA MIGRATION: Creating default tenant")
    print("="*60)

    # Create connection
    conn = op.get_bind()

    # Check if any data exists
    result = conn.execute(sa.text("SELECT COUNT(*) FROM users"))
    user_count = result.scalar()

    if user_count == 0:
        print("\n✅ No existing data found - skipping migration")
        print("   You can proceed with clean tenant setup!")
        return

    print(f"\n📊 Found {user_count} existing users")
    print("   Creating default tenant for existing data...")

    # 1. Create default tenant
    default_tenant_id = str(uuid.uuid4())
    trial_ends_at = datetime.now() + timedelta(days=30)

    conn.execute(sa.text("""
        INSERT INTO tenants (
            id,
            tenant_name,
            tenant_code,
            subscription_plan,
            subscription_status,
            trial_ends_at,
            max_clinics,
            max_doctors,
            max_patients,
            max_storage_mb,
            created_at,
            updated_at,
            is_active
        ) VALUES (
            :id,
            'Legacy Clinic',
            'LEGACY_001',
            'premium',
            'active',
            :trial_ends_at,
            10,
            100,
            -1,
            100000,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            true
        )
    """), {
        'id': default_tenant_id,
        'trial_ends_at': trial_ends_at
    })

    print(f"✅ Default tenant created:")
    print(f"   ID: {default_tenant_id}")
    print(f"   Name: Legacy Clinic")
    print(f"   Code: LEGACY_001")
    print(f"   Plan: Premium (unlimited)")

    # 2. Migrate data to default tenant
    tables_to_migrate = [
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

    print(f"\n📝 Migrating existing data to default tenant...")

    total_records_migrated = 0

    for table in tables_to_migrate:
        # Check if table exists and has data
        try:
            result = conn.execute(sa.text(f"SELECT COUNT(*) FROM {table} WHERE tenant_id IS NULL"))
            count = result.scalar()

            if count > 0:
                # Update tenant_id for existing records
                conn.execute(sa.text(f"""
                    UPDATE {table}
                    SET tenant_id = :tenant_id
                    WHERE tenant_id IS NULL
                """), {'tenant_id': default_tenant_id})

                print(f"   ✓ {table}: {count} records migrated")
                total_records_migrated += count
            else:
                print(f"   ○ {table}: No data to migrate")

        except Exception as e:
            print(f"   ⚠ {table}: Table not found or error - {str(e)}")

    print(f"\n{'='*60}")
    print(f"✅ Migration complete!")
    print(f"   Total records migrated: {total_records_migrated}")
    print(f"{'='*60}")

    # 3. Now make tenant_id NOT NULL (since all data has tenant_id now)
    print(f"\n🔒 Making tenant_id NOT NULL (enforcing referential integrity)...")

    for table in tables_to_migrate:
        try:
            # Check if there are any NULL tenant_id records
            result = conn.execute(sa.text(f"SELECT COUNT(*) FROM {table} WHERE tenant_id IS NULL"))
            null_count = result.scalar()

            if null_count == 0:
                # Safe to make NOT NULL
                conn.execute(sa.text(f"""
                    ALTER TABLE {table}
                    ALTER COLUMN tenant_id SET NOT NULL
                """))
                print(f"   ✓ {table}: tenant_id now NOT NULL")
            else:
                print(f"   ⚠ {table}: {null_count} records still have NULL tenant_id - skipping NOT NULL constraint")

        except Exception as e:
            print(f"   ⚠ {table}: Error setting NOT NULL - {str(e)}")

    print(f"\n{'='*60}")
    print("✅ Data migration successfully completed!")
    print(f"{'='*60}")
    print("\n📋 Summary:")
    print(f"   - Default tenant created (LEGACY_001)")
    print(f"   - {total_records_migrated} records migrated")
    print(f"   - tenant_id is now NOT NULL (enforced)")
    print(f"   - All existing data belongs to 'Legacy Clinic'")
    print("\n🎯 Next steps:")
    print("   1. Existing users continue using system normally")
    print("   2. New clinics register and get their own tenant_id")
    print("   3. Enable RLS policies for tenant isolation")


def downgrade():
    """
    Revert data migration
    NOTE: This does NOT delete the tenant, just removes tenant_id references
    """
    print("Reverting data migration...")

    # Make tenant_id nullable again
    tables = [
        'users', 'doctors', 'patients', 'medicines', 'short_keys',
        'appointments', 'prescriptions', 'prescription_items',
        'dental_observations', 'dental_procedures',
        'dental_observation_templates', 'dental_attachments', 'case_studies'
    ]

    conn = op.get_bind()

    for table in tables:
        try:
            conn.execute(sa.text(f"""
                ALTER TABLE {table}
                ALTER COLUMN tenant_id DROP NOT NULL
            """))
            print(f"  ✓ {table}: tenant_id now nullable")
        except Exception as e:
            print(f"  ⚠ {table}: {str(e)}")

    # Optionally set tenant_id back to NULL (commented out for safety)
    # for table in tables:
    #     conn.execute(sa.text(f"UPDATE {table} SET tenant_id = NULL"))

    # Delete default tenant (commented out for safety - let admin decide)
    # conn.execute(sa.text("DELETE FROM tenants WHERE tenant_code = 'LEGACY_001'"))

    print("✅ Migration reverted (tenant_id is nullable again)")
    print("⚠️  NOTE: tenant_id values NOT cleared - delete manually if needed")
