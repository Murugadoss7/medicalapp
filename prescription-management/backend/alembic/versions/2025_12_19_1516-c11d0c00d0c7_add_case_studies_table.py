"""add_case_studies_table

Revision ID: c11d0c00d0c7
Revises: 53cebb2ea904
Create Date: 2025-12-19 15:16:53.291271+00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c11d0c00d0c7'
down_revision = '53cebb2ea904'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create case_studies table
    op.create_table(
        'case_studies',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),

        # Case Study Identifier
        sa.Column('case_study_number', sa.String(length=100), nullable=False),

        # Patient Reference (Composite Key)
        sa.Column('patient_mobile_number', sa.String(length=15), nullable=False),
        sa.Column('patient_first_name', sa.String(length=100), nullable=False),
        sa.Column('patient_uuid', sa.UUID(), nullable=False),

        # Doctor Reference
        sa.Column('doctor_id', sa.UUID(), nullable=False),

        # Related Entities (Treatment Journey) - JSON arrays
        sa.Column('appointment_ids', sa.Text(), nullable=True),  # JSON array of UUIDs
        sa.Column('prescription_ids', sa.Text(), nullable=True),  # JSON array of UUIDs
        sa.Column('procedure_ids', sa.Text(), nullable=True),  # JSON array of UUIDs

        # Case Study Content
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('chief_complaint', sa.Text(), nullable=False),

        # Pre-Treatment Assessment (AI-Generated)
        sa.Column('pre_treatment_summary', sa.Text(), nullable=True),
        sa.Column('initial_diagnosis', sa.Text(), nullable=True),
        sa.Column('treatment_goals', sa.Text(), nullable=True),

        # Treatment Timeline (AI-Generated)
        sa.Column('treatment_summary', sa.Text(), nullable=True),
        sa.Column('procedures_performed', sa.Text(), nullable=True),

        # Post-Treatment Outcome (AI-Generated)
        sa.Column('outcome_summary', sa.Text(), nullable=True),
        sa.Column('success_metrics', sa.Text(), nullable=True),
        sa.Column('patient_feedback', sa.Text(), nullable=True),

        # Full Case Study Narrative (AI-Generated)
        sa.Column('full_narrative', sa.Text(), nullable=True),

        # Metadata
        sa.Column('generation_prompt', sa.Text(), nullable=True),
        sa.Column('generation_model', sa.String(length=100), nullable=True),

        # Timeline
        sa.Column('treatment_start_date', sa.Date(), nullable=True),
        sa.Column('treatment_end_date', sa.Date(), nullable=True),

        # Status
        sa.Column('status', sa.String(length=20), server_default='draft', nullable=False),

        # Export/Presentation
        sa.Column('is_exported', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('exported_format', sa.String(length=20), nullable=True),
        sa.Column('exported_at', sa.TIMESTAMP(), nullable=True),

        # Audit Fields
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),

        # Primary Key
        sa.PrimaryKeyConstraint('id'),

        # Unique Constraints
        sa.UniqueConstraint('case_study_number', name='uq_case_study_number'),

        # Foreign Keys
        sa.ForeignKeyConstraint(['patient_uuid'], ['patients.id'], name='fk_case_studies_patient_uuid'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], name='fk_case_studies_doctor'),
        sa.ForeignKeyConstraint(
            ['patient_mobile_number', 'patient_first_name'],
            ['patients.mobile_number', 'patients.first_name'],
            name='fk_case_studies_patient_composite'
        )
    )

    # Create indexes for performance
    op.create_index('idx_case_studies_patient', 'case_studies', ['patient_mobile_number', 'patient_first_name'])
    op.create_index('idx_case_studies_doctor', 'case_studies', ['doctor_id'])
    op.create_index('idx_case_studies_status', 'case_studies', ['status'])
    op.create_index('idx_case_studies_created_at', 'case_studies', [sa.text('created_at DESC')])
    op.create_index('idx_case_studies_is_active', 'case_studies', ['is_active'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_case_studies_is_active', table_name='case_studies')
    op.drop_index('idx_case_studies_created_at', table_name='case_studies')
    op.drop_index('idx_case_studies_status', table_name='case_studies')
    op.drop_index('idx_case_studies_doctor', table_name='case_studies')
    op.drop_index('idx_case_studies_patient', table_name='case_studies')

    # Drop table
    op.drop_table('case_studies')