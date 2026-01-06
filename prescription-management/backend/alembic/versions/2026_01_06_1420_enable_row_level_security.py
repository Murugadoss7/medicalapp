"""enable row level security for tenant isolation

Revision ID: 2026_01_06_1420
Revises: 2026_01_06_1410
Create Date: 2026-01-06 14:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2026_01_06_1420'
down_revision = '2026_01_06_1415'
branch_labels = None
depends_on = None


def upgrade():
    """
    Enable Row-Level Security (RLS) and create tenant isolation policies
    CRITICAL: This enforces tenant data isolation at database level
    """

    # List of tables that need RLS policies
    tables_with_rls = [
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

    print("="*60)
    print("Enabling Row-Level Security (RLS) for tenant isolation")
    print("="*60)

    for table in tables_with_rls:
        print(f"\nConfiguring RLS for {table}...")

        # 1. Enable RLS on table
        op.execute(f"""
            ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;
        """)
        print(f"  ✓ RLS enabled")

        # 2. Create policy for tenant isolation
        # Policy name format: {table}_tenant_isolation
        policy_name = f"{table}_tenant_isolation"

        # Special handling for medicines (support global medicines)
        if table == 'medicines':
            op.execute(f"""
                CREATE POLICY {policy_name} ON {table}
                    USING (
                        tenant_id IS NULL OR
                        tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid
                    );
            """)
            print(f"  ✓ Policy created (with global medicine support)")
        else:
            # Standard tenant isolation policy
            op.execute(f"""
                CREATE POLICY {policy_name} ON {table}
                    USING (
                        tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid
                    );
            """)
            print(f"  ✓ Policy created (strict tenant isolation)")

        # 3. Create policy for INSERT/UPDATE operations
        policy_insert_name = f"{table}_tenant_modification"

        if table == 'medicines':
            # For medicines, allow tenant-specific or global (NULL)
            op.execute(f"""
                CREATE POLICY {policy_insert_name} ON {table}
                    FOR ALL
                    USING (
                        tenant_id IS NULL OR
                        tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid
                    )
                    WITH CHECK (
                        tenant_id IS NULL OR
                        tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid
                    );
            """)
        else:
            op.execute(f"""
                CREATE POLICY {policy_insert_name} ON {table}
                    FOR ALL
                    USING (
                        tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid
                    )
                    WITH CHECK (
                        tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid
                    );
            """)
        print(f"  ✓ Modification policy created")

    # 4. Force RLS even for table owners (important for security)
    print("\n" + "="*60)
    print("Forcing RLS for table owners (security hardening)")
    print("="*60)

    for table in tables_with_rls:
        op.execute(f"""
            ALTER TABLE {table} FORCE ROW LEVEL SECURITY;
        """)
        print(f"  ✓ {table} - RLS forced")

    print("\n" + "="*60)
    print("✅ Row-Level Security successfully enabled!")
    print("="*60)
    print("\n🔒 Tenant isolation is now enforced at database level")
    print("📋 How it works:")
    print("   1. Application sets: SET app.current_tenant_id = 'tenant-uuid'")
    print("   2. All queries automatically filter by tenant_id")
    print("   3. Users can ONLY see/modify their tenant's data")
    print("   4. Global medicines (tenant_id=NULL) visible to all")
    print("\n⚠️  IMPORTANT:")
    print("   - Application MUST set app.current_tenant_id for each request")
    print("   - Use tenant middleware to set this automatically")
    print("   - Test with multiple tenants to verify isolation")


def downgrade():
    """
    Disable Row-Level Security and drop policies
    """

    tables_with_rls = [
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

    print("Disabling Row-Level Security...")

    for table in tables_with_rls:
        # Drop policies
        policy_name = f"{table}_tenant_isolation"
        policy_insert_name = f"{table}_tenant_modification"

        try:
            op.execute(f"DROP POLICY IF EXISTS {policy_insert_name} ON {table};")
            op.execute(f"DROP POLICY IF EXISTS {policy_name} ON {table};")
        except:
            pass

        # Disable RLS
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
        print(f"  ✓ {table} - RLS disabled")

    print("✅ Row-Level Security disabled")
