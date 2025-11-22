"""
Migration script to create dental tables
Run this script to add dental_observations and dental_procedures tables
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base
from app.models import DentalObservation, DentalProcedure

def create_dental_tables():
    """Create dental tables in the database"""
    engine = create_engine(settings.DATABASE_URL)

    # Create tables
    print("Creating dental tables...")
    Base.metadata.create_all(bind=engine, tables=[
        DentalObservation.__table__,
        DentalProcedure.__table__
    ])

    # Create indexes
    print("Creating indexes...")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_obs_prescription
            ON dental_observations(prescription_id);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_obs_appointment
            ON dental_observations(appointment_id);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_obs_tooth
            ON dental_observations(tooth_number);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_obs_patient
            ON dental_observations(patient_mobile_number, patient_first_name);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_obs_condition
            ON dental_observations(condition_type);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_proc_prescription
            ON dental_procedures(prescription_id);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_proc_appointment
            ON dental_procedures(appointment_id);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_proc_observation
            ON dental_procedures(observation_id);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_proc_status
            ON dental_procedures(status);
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_dental_proc_code
            ON dental_procedures(procedure_code);
        """))

        conn.commit()

    print("✅ Dental tables created successfully!")
    print("   - dental_observations")
    print("   - dental_procedures")
    print("   - All indexes created")

if __name__ == "__main__":
    try:
        create_dental_tables()
    except Exception as e:
        print(f"❌ Error creating dental tables: {e}")
        sys.exit(1)
