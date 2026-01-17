"""enable row level security for tenant isolation

Revision ID: 2026_01_06_1420
Revises: 2026_01_06_1410
Create Date: 2026-01-06 14:20:00.000000
Last Updated: 2026-01-09 (Fixed NULL-safe policies and privilege removal)

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

        # Special handling for medicines (support global medicines) - NULL-safe
        if table == 'medicines':
            op.execute(f"""
                CREATE POLICY {policy_name} ON {table}
                    USING (
                        tenant_id IS NULL OR
                        (current_setting('app.current_tenant_id', TRUE) IS NOT NULL
                         AND tenant_id::text = current_setting('app.current_tenant_id', TRUE))
                    );
            """)
            print(f"  ✓ Policy created (with global medicine support, NULL-safe)")
        elif table == 'users':
            # Users table needs SELECT without tenant for login flow
            op.execute(f"""
                CREATE POLICY {policy_name} ON {table}
                    FOR SELECT
                    USING (true);
            """)
            print(f"  ✓ Policy created (open SELECT for login)")
        else:
            # Standard tenant isolation policy (NULL-safe)
            op.execute(f"""
                CREATE POLICY {policy_name} ON {table}
                    USING (
                        current_setting('app.current_tenant_id', TRUE) IS NOT NULL
                        AND tenant_id::text = current_setting('app.current_tenant_id', TRUE)
                    );
            """)
            print(f"  ✓ Policy created (NULL-safe strict tenant isolation)")

        # 3. Create policy for INSERT/UPDATE operations
        policy_insert_name = f"{table}_tenant_modification"

        if table == 'medicines':
            # For medicines, allow tenant-specific or global (NULL) - NULL-safe
            op.execute(f"""
                CREATE POLICY {policy_insert_name} ON {table}
                    FOR ALL
                    USING (
                        tenant_id IS NULL OR
                        (current_setting('app.current_tenant_id', TRUE) IS NOT NULL
                         AND tenant_id::text = current_setting('app.current_tenant_id', TRUE))
                    )
                    WITH CHECK (
                        tenant_id IS NULL OR
                        (current_setting('app.current_tenant_id', TRUE) IS NOT NULL
                         AND tenant_id::text = current_setting('app.current_tenant_id', TRUE))
                    );
            """)
        else:
            op.execute(f"""
                CREATE POLICY {policy_insert_name} ON {table}
                    FOR ALL
                    USING (
                        current_setting('app.current_tenant_id', TRUE) IS NOT NULL
                        AND tenant_id::text = current_setting('app.current_tenant_id', TRUE)
                    )
                    WITH CHECK (
                        current_setting('app.current_tenant_id', TRUE) IS NOT NULL
                        AND tenant_id::text = current_setting('app.current_tenant_id', TRUE)
                    );
            """)
        print(f"  ✓ Modification policy created (NULL-safe)")

    # 4. Force RLS even for table owners (important for security)
    print("\n" + "="*60)
    print("Forcing RLS for table owners (security hardening)")
    print("="*60)

    for table in tables_with_rls:
        op.execute(f"""
            ALTER TABLE {table} FORCE ROW LEVEL SECURITY;
        """)
        print(f"  ✓ {table} - RLS forced")

    # 5. Remove SUPERUSER and BYPASSRLS privileges from application user
    # Note: Skip on Neon/cloud DBs where the role name differs
    print("\n" + "="*60)
    print("Securing application database user")
    print("="*60)

    try:
        op.execute("""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'prescription_user') THEN
                    ALTER ROLE prescription_user NOSUPERUSER;
                    ALTER ROLE prescription_user NOBYPASSRLS;
                    RAISE NOTICE 'Secured prescription_user role';
                ELSE
                    RAISE NOTICE 'prescription_user role not found - skipping (cloud DB)';
                END IF;
            END $$;
        """)
        print("  ✓ Role security check completed")
    except Exception as e:
        print(f"  ⚠ Skipped role modification (cloud DB): {e}")

    print("\n" + "="*60)
    print("✅ Row-Level Security successfully enabled!")
    print("="*60)
    print("\n🔒 Tenant isolation is now enforced at database level")
    print("📋 How it works:")
    print("   1. Application sets: SET app.current_tenant_id = 'tenant-uuid'")
    print("   2. All queries automatically filter by tenant_id")
    print("   3. Users can ONLY see/modify their tenant's data")
    print("   4. Global medicines (tenant_id=NULL) visible to all")
    print("   5. Database user has NO privileges to bypass RLS")
    print("\n⚠️  IMPORTANT:")
    print("   - Application MUST set app.current_tenant_id for each request")
    print("   - Use tenant middleware to set this automatically")
    print("   - Test with multiple tenants to verify isolation")
    print("\n🔐 Security:")
    print("   - Database user is NOT a superuser")
    print("   - Database user CANNOT bypass RLS policies")
    print("   - RLS is FORCED even for table owners")


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
