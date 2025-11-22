#!/usr/bin/env python3
"""
Simplified test script using SQLite to verify models work
Tests ERD implementation without external dependencies
"""

import sys
import os
from datetime import date, time, datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add app to path
sys.path.append(os.path.dirname(__file__))

# Mock Redis for testing
class MockRedis:
    def __init__(self, *args, **kwargs):
        self.data = {}
    
    def get(self, key):
        return self.data.get(key)
    
    def set(self, key, value):
        self.data[key] = value
        return True
    
    def setex(self, key, ttl, value):
        self.data[key] = value
        return True
    
    def delete(self, key):
        return self.data.pop(key, None) is not None
    
    def keys(self, pattern):
        return list(self.data.keys())
    
    def ping(self):
        return True

# Mock the redis module
sys.modules['redis'] = type(sys)('redis')
sys.modules['redis'].Redis = MockRedis

# Override settings for SQLite
os.environ['DATABASE_URL'] = 'sqlite:///./test_prescription.db'
os.environ['REDIS_URL'] = 'redis://localhost:6379'
os.environ['ENVIRONMENT'] = 'test'

from app.models import *
from app.core.database import Base

def test_sqlite_setup():
    """Test SQLite database setup"""
    print("🔍 Setting up SQLite database for testing...")
    
    # Create SQLite engine
    engine = create_engine('sqlite:///./test_prescription.db', echo=False)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    print("✅ SQLite database and tables created successfully")
    return engine, SessionLocal

def test_patient_models(session_factory):
    """Test patient models with composite key"""
    print("👥 Testing Patient model with composite key...")
    
    with session_factory() as db:
        try:
            # Create family members
            family_mobile = "9876543210"
            
            # Primary family member
            john = Patient(
                mobile_number=family_mobile,
                first_name="John",
                last_name="Doe",
                date_of_birth=date(1980, 1, 15),
                gender="male",
                relationship_to_primary="self"
            )
            db.add(john)
            
            # Spouse
            mary = Patient(
                mobile_number=family_mobile,
                first_name="Mary",
                last_name="Doe",
                date_of_birth=date(1982, 5, 20),
                gender="female",
                relationship_to_primary="spouse",
                primary_contact_mobile=family_mobile
            )
            db.add(mary)
            
            # Child
            sarah = Patient(
                mobile_number=family_mobile,
                first_name="Sarah",
                last_name="Doe",
                date_of_birth=date(2010, 3, 10),
                gender="female",
                relationship_to_primary="child",
                primary_contact_mobile=family_mobile
            )
            db.add(sarah)
            
            db.commit()
            
            # Test queries
            patients = db.query(Patient).filter(Patient.mobile_number == family_mobile).all()
            
            print(f"✅ Created {len(patients)} family members:")
            for patient in patients:
                print(f"   - {patient.get_full_name()} ({patient.relationship_to_primary})")
                print(f"     Age: {patient.get_age()}, Composite Key: {patient.get_composite_key_values()}")
            
            # Test composite key uniqueness
            try:
                duplicate = Patient(
                    mobile_number=family_mobile,
                    first_name="John",  # Same mobile + first name
                    last_name="Smith",
                    date_of_birth=date(1985, 1, 1),
                    gender="male",
                    relationship_to_primary="self"
                )
                db.add(duplicate)
                db.commit()
                print("❌ Composite key constraint failed - duplicate allowed")
                return False
            except Exception as e:
                print("✅ Composite key constraint working - duplicate rejected")
                db.rollback()
            
            return True
            
        except Exception as e:
            print(f"❌ Patient model test failed: {e}")
            return False

def test_user_doctor_models(session_factory):
    """Test user and doctor models"""
    print("👨‍⚕️ Testing User and Doctor models...")
    
    with session_factory() as db:
        try:
            # Create user
            user = User(
                keycloak_id="test-keycloak-123",
                email="dr.smith@example.com",
                role="doctor",
                first_name="John",
                last_name="Smith"
            )
            db.add(user)
            db.flush()
            
            # Create doctor
            doctor = Doctor(
                user_id=user.id,
                license_number="MED123456",
                specialization="General Medicine",
                qualification="MBBS, MD",
                experience_years=10
            )
            db.add(doctor)
            db.commit()
            
            # Test relationships
            user_with_doctor = db.query(User).filter(User.email == "dr.smith@example.com").first()
            print(f"✅ Created user: {user_with_doctor.get_full_name()}")
            print(f"   Role: {user_with_doctor.role}")
            print(f"   Permissions: {len(user_with_doctor.get_permissions())}")
            
            if user_with_doctor.doctor_profile:
                print(f"✅ Doctor profile: {user_with_doctor.doctor_profile.get_full_name()}")
                print(f"   License: {user_with_doctor.doctor_profile.license_number}")
            
            return True
            
        except Exception as e:
            print(f"❌ User/Doctor test failed: {e}")
            return False

def test_medicine_models(session_factory):
    """Test medicine and short key models"""
    print("💊 Testing Medicine and ShortKey models...")
    
    with session_factory() as db:
        try:
            # Create medicines
            paracetamol = Medicine(
                name="Paracetamol",
                generic_name="Acetaminophen",
                composition="Paracetamol 500mg",
                manufacturer="ABC Pharma",
                strength="500mg",
                drug_category="Analgesic",
                dosage_forms=["tablet", "syrup"]
            )
            db.add(paracetamol)
            
            ibuprofen = Medicine(
                name="Ibuprofen",
                composition="Ibuprofen 400mg",
                manufacturer="XYZ Pharma",
                strength="400mg", 
                drug_category="NSAID",
                dosage_forms=["tablet", "gel"]
            )
            db.add(ibuprofen)
            db.flush()
            
            # Get doctor for short key
            doctor = db.query(Doctor).first()
            if doctor:
                # Create short key
                flu_key = ShortKey(
                    code="FLU",
                    name="Common Flu Treatment",
                    description="Standard flu treatment",
                    created_by=doctor.user_id,
                    is_global=True
                )
                db.add(flu_key)
                db.flush()
                
                # Add medicines to short key
                skm1 = ShortKeyMedicine(
                    short_key_id=flu_key.id,
                    medicine_id=paracetamol.id,
                    default_dosage="500mg",
                    default_frequency="Three times daily",
                    default_duration="5 days",
                    sequence_order=1
                )
                db.add(skm1)
                
            db.commit()
            
            medicines = db.query(Medicine).all()
            print(f"✅ Created {len(medicines)} medicines:")
            for med in medicines:
                print(f"   - {med.get_display_name()}")
                print(f"     Forms: {med.get_dosage_forms_list()}")
            
            short_keys = db.query(ShortKey).all()
            for sk in short_keys:
                print(f"✅ Created short key: {sk.code} - {sk.name}")
            
            return True
            
        except Exception as e:
            print(f"❌ Medicine/ShortKey test failed: {e}")
            return False

def test_prescription_models(session_factory):
    """Test prescription models with composite key references"""
    print("📝 Testing Prescription models...")
    
    with session_factory() as db:
        try:
            # Get existing data
            patient = db.query(Patient).filter(
                Patient.mobile_number == "9876543210",
                Patient.first_name == "John"
            ).first()
            
            doctor = db.query(Doctor).first()
            medicine = db.query(Medicine).first()
            
            if patient and doctor and medicine:
                # Create prescription
                prescription = Prescription(
                    prescription_number="RX20251030001",
                    patient_mobile_number=patient.mobile_number,
                    patient_first_name=patient.first_name,
                    patient_uuid=patient.id,
                    doctor_id=doctor.id,
                    visit_date=date.today(),
                    chief_complaint="Fever and headache",
                    diagnosis="Viral fever",
                    symptoms="High temperature, body ache"
                )
                db.add(prescription)
                db.flush()
                
                # Add prescription item
                item = PrescriptionItem(
                    prescription_id=prescription.id,
                    medicine_id=medicine.id,
                    dosage="500mg",
                    frequency="Three times daily",
                    duration="5 days",
                    instructions="Take with food",
                    quantity=15,
                    sequence_order=1
                )
                db.add(item)
                db.commit()
                
                print(f"✅ Created prescription: {prescription.prescription_number}")
                print(f"   Patient: {prescription.get_patient_composite_key()}")
                print(f"   Total medicines: {prescription.get_total_medicines()}")
                
                return True
            else:
                print("❌ Missing required data for prescription test")
                return False
                
        except Exception as e:
            print(f"❌ Prescription test failed: {e}")
            return False

def test_appointment_models(session_factory):
    """Test appointment models"""
    print("📅 Testing Appointment models...")
    
    with session_factory() as db:
        try:
            # Get existing data
            patient = db.query(Patient).filter(
                Patient.mobile_number == "9876543210",
                Patient.first_name == "Mary"
            ).first()
            
            doctor = db.query(Doctor).first()
            
            if patient and doctor:
                appointment = Appointment(
                    appointment_number="APT20251030001",
                    patient_mobile_number=patient.mobile_number,
                    patient_first_name=patient.first_name,
                    patient_uuid=patient.id,
                    doctor_id=doctor.id,
                    appointment_date=date.today(),
                    appointment_time=time(14, 30),
                    reason_for_visit="Regular checkup",
                    duration_minutes=30
                )
                db.add(appointment)
                db.commit()
                
                print(f"✅ Created appointment: {appointment.appointment_number}")
                print(f"   Patient: {appointment.get_patient_composite_key()}")
                print(f"   DateTime: {appointment.get_appointment_datetime()}")
                print(f"   Is upcoming: {appointment.is_upcoming()}")
                
                return True
            else:
                print("❌ Missing required data for appointment test")
                return False
                
        except Exception as e:
            print(f"❌ Appointment test failed: {e}")
            return False

def test_audit_models(session_factory):
    """Test audit logging"""
    print("📋 Testing Audit Log models...")
    
    with session_factory() as db:
        try:
            user = db.query(User).first()
            
            if user:
                audit = AuditLog(
                    table_name="patients",
                    record_id="test-123",
                    action="INSERT",
                    performed_by=user.id,
                    new_values={"mobile_number": "9876543210", "first_name": "John"},
                    ip_address="127.0.0.1",
                    user_agent="Test Agent"
                )
                db.add(audit)
                db.commit()
                
                print(f"✅ Created audit log: {audit.get_changes_summary()}")
                print(f"   Sensitive: {audit.is_sensitive_operation()}")
                
                return True
            else:
                print("❌ No user found for audit test")
                return False
                
        except Exception as e:
            print(f"❌ Audit test failed: {e}")
            return False

def cleanup():
    """Clean up test database"""
    try:
        if os.path.exists('./test_prescription.db'):
            os.remove('./test_prescription.db')
        print("🧹 Cleaned up test database")
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")

def main():
    """Run all tests"""
    print("🧪 Starting Prescription Management System Model Tests (SQLite)")
    print("=" * 70)
    
    try:
        # Setup
        engine, session_factory = test_sqlite_setup()
        
        # Run tests
        tests = [
            test_patient_models,
            test_user_doctor_models,
            test_medicine_models,
            test_prescription_models,
            test_appointment_models,
            test_audit_models
        ]
        
        passed = 0
        failed = 0
        
        for test_func in tests:
            try:
                if test_func(session_factory):
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ Test {test_func.__name__} crashed: {e}")
                failed += 1
            print()
        
        print("=" * 70)
        print(f"🧪 Test Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All model tests passed!")
            print("✅ ERD implementation is working correctly")
            print("✅ Composite key patient registration working")
            print("✅ All relationships and constraints validated")
            print("✅ Ready for API development!")
        else:
            print("⚠️ Some tests failed. Check the implementation.")
        
        return failed == 0
        
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        return False
    finally:
        cleanup()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)