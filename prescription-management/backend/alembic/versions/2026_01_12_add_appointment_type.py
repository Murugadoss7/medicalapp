"""Add appointment_type column to appointments table

Revision ID: add_appointment_type
Revises: 2026_01_06_1420
Create Date: 2026-01-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_appointment_type'
down_revision = '2026_01_06_1420'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the appointment_type enum if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_type') THEN
                CREATE TYPE appointment_type AS ENUM ('scheduled', 'walk_in');
            END IF;
        END$$;
    """)

    # Add appointment_type column with default value
    op.execute("""
        ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS appointment_type appointment_type NOT NULL DEFAULT 'scheduled';
    """)

    # Add index for filtering by appointment type
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments (appointment_type);
    """)


def downgrade() -> None:
    # Drop the index
    op.execute("DROP INDEX IF EXISTS idx_appointments_type;")

    # Drop the column
    op.execute("ALTER TABLE appointments DROP COLUMN IF EXISTS appointment_type;")

    # Don't drop the enum type as other tables might use it
