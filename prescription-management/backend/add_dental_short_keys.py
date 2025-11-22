"""
Script to add dental-specific short keys to the database
Common dental prescriptions for quick access
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import ShortKey, ShortKeyMedicine, Medicine
from uuid import uuid4

def add_dental_short_keys():
    """Add dental-specific short keys"""
    engine = create_engine(settings.DATABASE_URL)
    db = Session(engine)

    try:
        # Find common dental medicines (you'll need to adjust these based on your medicine database)
        print("📋 Adding dental short keys...")

        # Dental short keys to add
        dental_keys = [
            {
                'code': 'DENTAL1',
                'name': 'Basic Dental Pain Relief',
                'description': 'Standard pain management for dental procedures',
                'category': 'dental',
                'medicines': [
                    {'name': 'Paracetamol', 'dosage': '500mg', 'frequency': 'TDS', 'duration': '3 days', 'quantity': 9},
                    {'name': 'Ibuprofen', 'dosage': '400mg', 'frequency': 'TDS', 'duration': '3 days', 'quantity': 9},
                ]
            },
            {
                'code': 'DENTAL2',
                'name': 'Post-Extraction Care',
                'description': 'Medication for post-tooth extraction',
                'category': 'dental',
                'medicines': [
                    {'name': 'Amoxicillin', 'dosage': '500mg', 'frequency': 'TDS', 'duration': '5 days', 'quantity': 15},
                    {'name': 'Paracetamol', 'dosage': '650mg', 'frequency': 'TDS', 'duration': '3 days', 'quantity': 9},
                    {'name': 'Metronidazole', 'dosage': '400mg', 'frequency': 'TDS', 'duration': '5 days', 'quantity': 15},
                ]
            },
            {
                'code': 'DENTAL3',
                'name': 'Root Canal Treatment',
                'description': 'Pain and infection management for RCT',
                'category': 'dental',
                'medicines': [
                    {'name': 'Amoxicillin', 'dosage': '500mg', 'frequency': 'TDS', 'duration': '5 days', 'quantity': 15},
                    {'name': 'Diclofenac', 'dosage': '50mg', 'frequency': 'TDS', 'duration': '3 days', 'quantity': 9},
                    {'name': 'Pantoprazole', 'dosage': '40mg', 'frequency': 'OD', 'duration': '5 days', 'quantity': 5},
                ]
            },
            {
                'code': 'DENTAL4',
                'name': 'Gum Infection Treatment',
                'description': 'Antibiotics for periodontal infections',
                'category': 'dental',
                'medicines': [
                    {'name': 'Azithromycin', 'dosage': '500mg', 'frequency': 'OD', 'duration': '3 days', 'quantity': 3},
                    {'name': 'Metronidazole', 'dosage': '400mg', 'frequency': 'TDS', 'duration': '5 days', 'quantity': 15},
                    {'name': 'Chlorhexidine Mouthwash', 'dosage': '10ml', 'frequency': 'BD', 'duration': '7 days', 'quantity': 1},
                ]
            },
            {
                'code': 'DENTAL5',
                'name': 'Wisdom Tooth Extraction',
                'description': 'Post-operative care for wisdom tooth removal',
                'category': 'dental',
                'medicines': [
                    {'name': 'Amoxicillin', 'dosage': '500mg', 'frequency': 'TDS', 'duration': '7 days', 'quantity': 21},
                    {'name': 'Metronidazole', 'dosage': '400mg', 'frequency': 'TDS', 'duration': '5 days', 'quantity': 15},
                    {'name': 'Ibuprofen', 'dosage': '400mg', 'frequency': 'TDS', 'duration': '5 days', 'quantity': 15},
                    {'name': 'Chlorhexidine Mouthwash', 'dosage': '10ml', 'frequency': 'BD', 'duration': '7 days', 'quantity': 1},
                ]
            },
            {
                'code': 'DENTALAB',
                'name': 'Dental Antibiotic Course',
                'description': 'Standard antibiotic regimen for dental infections',
                'category': 'dental',
                'medicines': [
                    {'name': 'Amoxicillin', 'dosage': '500mg', 'frequency': 'TDS', 'duration': '5 days', 'quantity': 15},
                    {'name': 'Metronidazole', 'dosage': '400mg', 'frequency': 'TDS', 'duration': '5 days', 'quantity': 15},
                ]
            },
        ]

        # Get the first user as creator (you may want to change this to admin user)
        from app.models import User
        admin_user = db.query(User).filter(User.role == 'admin').first()
        if not admin_user:
            print("⚠️  No admin user found. Please create an admin user first.")
            return

        created_count = 0
        skipped_count = 0

        for key_data in dental_keys:
            # Check if short key already exists
            existing = db.query(ShortKey).filter(ShortKey.code == key_data['code']).first()
            if existing:
                print(f"⏭️  Skipping {key_data['code']} - already exists")
                skipped_count += 1
                continue

            # Create short key
            short_key = ShortKey(
                id=uuid4(),
                code=key_data['code'],
                name=key_data['name'],
                description=key_data['description'],
                category=key_data['category'],
                is_global=True,
                is_active=True,
                created_by=admin_user.id
            )
            db.add(short_key)
            db.flush()

            # Add medicines to short key
            for idx, med_data in enumerate(key_data['medicines']):
                # Try to find medicine by name (case-insensitive)
                medicine = db.query(Medicine).filter(
                    Medicine.name.ilike(f"%{med_data['name']}%")
                ).first()

                if medicine:
                    sk_medicine = ShortKeyMedicine(
                        id=uuid4(),
                        short_key_id=short_key.id,
                        medicine_id=medicine.id,
                        default_dosage=med_data['dosage'],
                        default_frequency=med_data['frequency'],
                        default_duration=med_data['duration'],
                        default_quantity=med_data['quantity'],
                        sequence_order=idx + 1,
                        is_active=True,
                        created_by=admin_user.id
                    )
                    db.add(sk_medicine)
                else:
                    print(f"   ⚠️  Medicine not found: {med_data['name']} - skipping")

            db.commit()
            print(f"✅ Created: {key_data['code']} - {key_data['name']}")
            created_count += 1

        print(f"\n📊 Summary:")
        print(f"   ✅ Created: {created_count} dental short keys")
        print(f"   ⏭️  Skipped: {skipped_count} existing keys")
        print(f"\n🎉 Dental short keys setup complete!")

    except Exception as e:
        print(f"❌ Error adding dental short keys: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    try:
        add_dental_short_keys()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)
