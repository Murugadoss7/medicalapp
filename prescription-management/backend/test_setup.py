#!/usr/bin/env python3
"""
Test script to verify the prescription management system setup
Tests all ERD models and relationships
"""

import asyncio
import sys
import os
from datetime import date, time

# Add app to path
sys.path.append(os.path.dirname(__file__))

from app.core.database import get_db_context, engine, Base
from app.models import *
from app.core.config import settings
from sqlalchemy import text

def test_database_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            print("✅ Database connection successful")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def create_tables():
    """Create all tables based on ERD"""
    print("🏗️ Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Table creation failed: {e}")
        return False

def test_patient_composite_key():
    """Test patient registration with composite key (mobile + first_name)"""
    print("👥 Testing patient composite key functionality...")
    
    with get_db_context() as db:
        try:
            # Test family registration scenario
            family_mobile = "9876543210"
            
            # Primary family member
            primary_patient = Patient(
                mobile_number=family_mobile,
                first_name="John",
                last_name="Doe",
                date_of_birth=date(1980, 1, 15),
                gender="male",
                relationship_to_primary="self"
            )
            db.add(primary_patient)
            
            # Spouse
            spouse_patient = Patient(
                mobile_number=family_mobile,
                first_name="Mary",
                last_name="Doe",
                date_of_birth=date(1982, 5, 20),
                gender="female",
                relationship_to_primary="spouse",
                primary_contact_mobile=family_mobile
            )
            db.add(spouse_patient)
            
            # Child
            child_patient = Patient(
                mobile_number=family_mobile,
                first_name="Sarah",
                last_name="Doe",
                date_of_birth=date(2010, 3, 10),
                gender="female",
                relationship_to_primary="child",
                primary_contact_mobile=family_mobile
            )
            db.add(child_patient)
            
            db.commit()
            
            # Test family retrieval
            family_members = get_family_members(db, family_mobile)
            print(f"✅ Created family with {len(family_members)} members:")
            for member in family_members:
                print(f"   - {member.get_full_name()} ({member.relationship_to_primary})")
            
            return True
            
        except Exception as e:
            print(f"❌ Patient composite key test failed: {e}")
            return False

def test_user_and_doctor():
    """Test user and doctor models"""
    print("👨‍⚕️ Testing user and doctor models...")
    
    with get_db_context() as db:
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
            db.flush()  # Get user ID
            
            # Create doctor profile
            doctor = Doctor(
                user_id=user.id,
                license_number="MED123456",
                specialization="General Medicine",
                qualification="MBBS, MD",
                experience_years=10
            )
            db.add(doctor)
            db.commit()
            
            print(f"✅ Created doctor: {doctor.get_full_name()}")
            print(f"   License: {doctor.license_number}")
            print(f"   Specialization: {doctor.specialization}")
            
            return True
            
        except Exception as e:
            print(f"❌ User/Doctor test failed: {e}")
            return False

def test_medicine_and_short_keys():
    """Test medicine catalog and short keys"""
    print("💊 Testing medicine catalog and short keys...")
    
    with get_db_context() as db:
        try:
            # Create medicines
            paracetamol = Medicine(
                name="Paracetamol",
                generic_name="Acetaminophen",
                composition="Paracetamol 500mg",
                manufacturer="ABC Pharma",
                strength="500mg",
                drug_category="Analgesic"
            )
            db.add(paracetamol)
            
            ibuprofen = Medicine(
                name="Ibuprofen",
                composition="Ibuprofen 400mg",
                manufacturer="XYZ Pharma", 
                strength="400mg",
                drug_category="NSAID"
            )
            db.add(ibuprofen)
            db.flush()
            
            # Get doctor (created in previous test)
            doctor = db.query(Doctor).first()
            if doctor:
                # Create short key
                flu_treatment = ShortKey(
                    code="FLU",
                    name="Common Flu Treatment",
                    description="Standard flu treatment protocol",
                    created_by=doctor.user_id,
                    is_global=True
                )
                db.add(flu_treatment)
                db.flush()
                
                # Add medicines to short key
                skm1 = ShortKeyMedicine(
                    short_key_id=flu_treatment.id,
                    medicine_id=paracetamol.id,
                    default_dosage="500mg",
                    default_frequency="Three times daily",
                    default_duration="5 days",
                    sequence_order=1
                )
                db.add(skm1)
                
                skm2 = ShortKeyMedicine(
                    short_key_id=flu_treatment.id,
                    medicine_id=ibuprofen.id,
                    default_dosage="400mg", 
                    default_frequency="Twice daily",
                    default_duration="3 days",
                    sequence_order=2
                )
                db.add(skm2)
                
            db.commit()
            
            print("✅ Created medicine catalog:")
            medicines = db.query(Medicine).all()
            for med in medicines:
                print(f"   - {med.get_display_name()}")
            
            short_keys = db.query(ShortKey).all()
            for sk in short_keys:
                print(f"✅ Created short key: {sk.code} - {sk.name}")
                medicines_in_sk = sk.medicines.count()
                print(f"   Contains {medicines_in_sk} medicines")
            
            return True
            
        except Exception as e:
            print(f"❌ Medicine/ShortKey test failed: {e}")
            return False

def test_prescription_workflow():
    """Test prescription creation with composite key patient reference"""
    print("📝 Testing prescription workflow...")
    
    with get_db_context() as db:
        try:
            # Get patient (from first test)
            patient = db.query(Patient).filter(
                Patient.mobile_number == "9876543210",
                Patient.first_name == "John"
            ).first()
            
            # Get doctor
            doctor = db.query(Doctor).first()
            
            # Get medicines
            paracetamol = db.query(Medicine).filter(Medicine.name == "Paracetamol").first()
            
            if patient and doctor and paracetamol:
                # Create prescription
                prescription = Prescription(
                    prescription_number=generate_prescription_number(db),
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
                prescription_item = PrescriptionItem(
                    prescription_id=prescription.id,
                    medicine_id=paracetamol.id,
                    dosage="500mg",
                    frequency="Three times daily",
                    duration="5 days",
                    instructions="Take with food",
                    quantity=15,
                    sequence_order=1
                )
                db.add(prescription_item)
                db.commit()
                
                print(f"✅ Created prescription: {prescription.prescription_number}")
                print(f"   Patient: {prescription.patient_mobile_number} - {prescription.patient_first_name}")
                print(f"   Doctor: {prescription.doctor.get_full_name()}")
                print(f"   Medicines: {prescription.items.count()}")
                
                return True
            else:
                print("❌ Missing required data for prescription test")
                return False
                
        except Exception as e:
            print(f"❌ Prescription test failed: {e}")
            return False

def test_appointment_scheduling():
    """Test appointment scheduling"""
    print("📅 Testing appointment scheduling...")
    
    with get_db_context() as db:
        try:
            # Get patient and doctor
            patient = db.query(Patient).filter(
                Patient.mobile_number == "9876543210",
                Patient.first_name == "Mary"  # Spouse
            ).first()
            doctor = db.query(Doctor).first()
            
            if patient and doctor:
                appointment = Appointment(
                    appointment_number=generate_appointment_number(db),
                    patient_mobile_number=patient.mobile_number,
                    patient_first_name=patient.first_name,
                    patient_uuid=patient.id,
                    doctor_id=doctor.id,
                    appointment_date=date.today(),
                    appointment_time=time(14, 30),  # 2:30 PM
                    reason_for_visit="Regular checkup",
                    duration_minutes=30
                )
                db.add(appointment)
                db.commit()
                
                print(f"✅ Created appointment: {appointment.appointment_number}")
                print(f"   Patient: {appointment.get_patient_composite_key()}")
                print(f"   Date/Time: {appointment.appointment_date} {appointment.appointment_time}")
                
                return True
            else:
                print("❌ Missing required data for appointment test")
                return False
                
        except Exception as e:
            print(f"❌ Appointment test failed: {e}")
            return False

def test_audit_logging():
    """Test audit logging functionality"""
    print("📋 Testing audit logging...")
    
    with get_db_context() as db:
        try:
            # Get user for audit
            user = db.query(User).first()
            
            if user:
                # Create audit log
                audit_log = create_audit_log(
                    db=db,
                    table_name="patients",
                    record_id="test-record-123",
                    action="INSERT",
                    performed_by=user.id,
                    new_values={"mobile_number": "9876543210", "first_name": "John"},
                    ip_address="127.0.0.1",
                    user_agent="Test Agent"
                )
                
                print(f"✅ Created audit log: {audit_log.get_changes_summary()}")
                print(f"   Performed by: {audit_log.get_user_display()}")
                print(f"   Sensitive operation: {audit_log.is_sensitive_operation()}")
                
                return True
            else:
                print("❌ No user found for audit test")
                return False
                
        except Exception as e:
            print(f"❌ Audit logging test failed: {e}")
            return False

def main():
    """Run all tests"""
    print("🧪 Starting Prescription Management System Tests")
    print("=" * 60)
    
    tests = [
        test_database_connection,
        create_tables,
        test_patient_composite_key,
        test_user_and_doctor,
        test_medicine_and_short_keys,
        test_prescription_workflow,
        test_appointment_scheduling,
        test_audit_logging
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            failed += 1
        print()
    
    print("=" * 60)
    print(f"🧪 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed! ERD implementation is working correctly.")
        print("✅ Ready to proceed with API endpoints and frontend.")
    else:
        print("⚠️ Some tests failed. Please check the implementation.")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)