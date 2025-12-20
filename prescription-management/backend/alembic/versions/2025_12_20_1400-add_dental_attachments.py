"""add_dental_attachments_table

Revision ID: a1b2c3d4e5f6
Revises: c11d0c00d0c7
Create Date: 2025-12-20 14:00:00.000000+00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'c11d0c00d0c7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create dental_attachments table
    op.create_table(
        'dental_attachments',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),

        # Foreign Keys (one of these must be set)
        sa.Column('observation_id', sa.UUID(), nullable=True),
        sa.Column('procedure_id', sa.UUID(), nullable=True),
        sa.Column('case_study_id', sa.UUID(), nullable=True),

        # Patient Reference (for easier queries)
        sa.Column('patient_mobile_number', sa.String(length=20), nullable=False),
        sa.Column('patient_first_name', sa.String(length=100), nullable=False),

        # File Information
        sa.Column('file_type', sa.String(length=20), nullable=False),
        # ENUM: 'xray', 'photo_before', 'photo_after', 'test_result', 'document', 'other'
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=False),  # Cloud storage URL or path
        sa.Column('file_size', sa.Integer(), nullable=False),  # Size in bytes
        sa.Column('mime_type', sa.String(length=100), nullable=False),  # 'image/jpeg', 'application/pdf', etc.

        # Metadata
        sa.Column('caption', sa.Text(), nullable=True),  # Optional description
        sa.Column('taken_date', sa.TIMESTAMP(), nullable=True),  # When photo/xray was taken

        # Audit Fields
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('uploaded_by', sa.UUID(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),

        # Primary Key
        sa.PrimaryKeyConstraint('id'),

        # Foreign Keys
        sa.ForeignKeyConstraint(['observation_id'], ['dental_observations.id'],
                                name='fk_dental_attach_observation', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['procedure_id'], ['dental_procedures.id'],
                                name='fk_dental_attach_procedure', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['case_study_id'], ['case_studies.id'],
                                name='fk_dental_attach_case_study', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'],
                                name='fk_dental_attach_uploader'),
        sa.ForeignKeyConstraint(
            ['patient_mobile_number', 'patient_first_name'],
            ['patients.mobile_number', 'patients.first_name'],
            name='fk_dental_attach_patient'
        ),

        # Check Constraint: Exactly one reference must be set
        sa.CheckConstraint(
            """
            (
                (observation_id IS NOT NULL AND procedure_id IS NULL AND case_study_id IS NULL) OR
                (observation_id IS NULL AND procedure_id IS NOT NULL AND case_study_id IS NULL) OR
                (observation_id IS NULL AND procedure_id IS NULL AND case_study_id IS NOT NULL)
            )
            """,
            name='check_dental_attach_single_reference'
        )
    )

    # Create indexes for performance
    op.create_index('idx_dental_attach_observation', 'dental_attachments', ['observation_id'])
    op.create_index('idx_dental_attach_procedure', 'dental_attachments', ['procedure_id'])
    op.create_index('idx_dental_attach_case_study', 'dental_attachments', ['case_study_id'])
    op.create_index('idx_dental_attach_patient', 'dental_attachments', ['patient_mobile_number', 'patient_first_name'])
    op.create_index('idx_dental_attach_file_type', 'dental_attachments', ['file_type'])
    op.create_index('idx_dental_attach_created', 'dental_attachments', [sa.text('created_at DESC')])
    op.create_index('idx_dental_attach_active', 'dental_attachments', ['is_active'])

    # Add observation_ids column to case_studies table
    op.add_column('case_studies', sa.Column('observation_ids', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove observation_ids column from case_studies
    op.drop_column('case_studies', 'observation_ids')

    # Drop indexes
    op.drop_index('idx_dental_attach_active', table_name='dental_attachments')
    op.drop_index('idx_dental_attach_created', table_name='dental_attachments')
    op.drop_index('idx_dental_attach_file_type', table_name='dental_attachments')
    op.drop_index('idx_dental_attach_patient', table_name='dental_attachments')
    op.drop_index('idx_dental_attach_case_study', table_name='dental_attachments')
    op.drop_index('idx_dental_attach_procedure', table_name='dental_attachments')
    op.drop_index('idx_dental_attach_observation', table_name='dental_attachments')

    # Drop table
    op.drop_table('dental_attachments')
