"""add prescription_templates table

Revision ID: 2026_01_16_templates
Revises: add_appointment_type
Create Date: 2026-01-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2026_01_16_templates'
down_revision = 'add_appointment_type'
branch_labels = None
depends_on = None


def upgrade():
    """
    Create prescription_templates table with RLS for multi-tenant isolation.
    Supports tenant defaults and doctor-specific overrides.
    """
    print("\n" + "=" * 60)
    print("Creating prescription_templates table")
    print("=" * 60)

    # Create the table
    op.create_table(
        'prescription_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),

        # Multi-tenancy
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), nullable=True),

        # Template metadata
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),

        # Paper configuration
        sa.Column('paper_size', sa.String(20), nullable=False, server_default='a4'),
        sa.Column('orientation', sa.String(20), nullable=False, server_default='portrait'),
        sa.Column('margin_top', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('margin_bottom', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('margin_left', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('margin_right', sa.Integer(), nullable=False, server_default='15'),

        # Layout configuration (JSONB for flexibility)
        sa.Column('layout_config', postgresql.JSONB(), nullable=False, server_default='{}'),

        # Branding (using Text for base64 data URLs)
        sa.Column('logo_url', sa.Text(), nullable=True),
        sa.Column('signature_url', sa.Text(), nullable=True),
        sa.Column('signature_text', sa.String(200), nullable=True),

        # Settings
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('preset_type', sa.String(50), nullable=True),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
    )
    print("  ✓ Table created")

    # Create indexes
    op.create_index('idx_prescription_templates_tenant', 'prescription_templates', ['tenant_id'])
    op.create_index('idx_prescription_templates_doctor', 'prescription_templates', ['doctor_id'])
    op.create_index('idx_prescription_templates_tenant_default', 'prescription_templates', ['tenant_id', 'is_default'])
    op.create_index('idx_prescription_templates_doctor_default', 'prescription_templates', ['doctor_id', 'is_default'])
    print("  ✓ Indexes created")

    # Enable RLS
    print("\nEnabling Row-Level Security...")
    op.execute("ALTER TABLE prescription_templates ENABLE ROW LEVEL SECURITY;")
    print("  ✓ RLS enabled")

    # Create tenant isolation policy (standard - no global templates)
    op.execute("""
        CREATE POLICY prescription_templates_tenant_isolation ON prescription_templates
            USING (
                current_setting('app.current_tenant_id', TRUE) IS NOT NULL
                AND tenant_id::text = current_setting('app.current_tenant_id', TRUE)
            );
    """)
    print("  ✓ Tenant isolation policy created")

    # Create modification policy
    op.execute("""
        CREATE POLICY prescription_templates_tenant_modification ON prescription_templates
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
    print("  ✓ Modification policy created")

    # Force RLS for table owner
    op.execute("ALTER TABLE prescription_templates FORCE ROW LEVEL SECURITY;")
    print("  ✓ RLS forced for table owner")

    print("\n" + "=" * 60)
    print("✅ prescription_templates table created successfully!")
    print("=" * 60)


def downgrade():
    """
    Drop prescription_templates table and RLS policies.
    """
    print("\nDropping prescription_templates table...")

    # Drop RLS policies
    op.execute("DROP POLICY IF EXISTS prescription_templates_tenant_modification ON prescription_templates;")
    op.execute("DROP POLICY IF EXISTS prescription_templates_tenant_isolation ON prescription_templates;")
    print("  ✓ RLS policies dropped")

    # Disable RLS
    op.execute("ALTER TABLE prescription_templates DISABLE ROW LEVEL SECURITY;")
    print("  ✓ RLS disabled")

    # Drop indexes
    op.drop_index('idx_prescription_templates_doctor_default', 'prescription_templates')
    op.drop_index('idx_prescription_templates_tenant_default', 'prescription_templates')
    op.drop_index('idx_prescription_templates_doctor', 'prescription_templates')
    op.drop_index('idx_prescription_templates_tenant', 'prescription_templates')
    print("  ✓ Indexes dropped")

    # Drop table
    op.drop_table('prescription_templates')
    print("  ✓ Table dropped")

    print("\n✅ prescription_templates table removed")
