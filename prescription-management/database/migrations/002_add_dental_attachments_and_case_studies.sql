-- Migration: Add dental_attachments and case_studies tables
-- Date: 2025-12-23
-- Description: Phase 2 - File Upload & AI Case Study Features

-- ================================================
-- 1. CREATE CASE_STUDIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS case_studies (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Unique Identifier
    case_study_number VARCHAR(100) UNIQUE NOT NULL,

    -- Patient Reference (Composite Key)
    patient_mobile_number VARCHAR(15) NOT NULL,
    patient_first_name VARCHAR(100) NOT NULL,
    patient_uuid UUID NOT NULL REFERENCES patients(id),

    -- Doctor Reference
    doctor_id UUID NOT NULL REFERENCES doctors(id),

    -- Related Entities (JSON arrays stored as text)
    appointment_ids TEXT,
    prescription_ids TEXT,
    procedure_ids TEXT,
    observation_ids TEXT,

    -- Case Study Content
    title VARCHAR(500) NOT NULL,
    chief_complaint TEXT NOT NULL,

    -- AI-Generated Sections
    pre_treatment_summary TEXT,
    initial_diagnosis TEXT,
    treatment_goals TEXT,
    treatment_summary TEXT,
    procedures_performed TEXT,
    outcome_summary TEXT,
    success_metrics TEXT,
    patient_feedback TEXT,
    full_narrative TEXT,

    -- Generation Metadata
    generation_prompt TEXT,
    generation_model VARCHAR(100),

    -- Timeline
    treatment_start_date DATE,
    treatment_end_date DATE,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    -- Export
    is_exported BOOLEAN NOT NULL DEFAULT FALSE,
    exported_format VARCHAR(20),
    exported_at TIMESTAMP,

    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for case_studies
CREATE INDEX IF NOT EXISTS idx_case_studies_number ON case_studies(case_study_number);
CREATE INDEX IF NOT EXISTS idx_case_studies_patient ON case_studies(patient_mobile_number, patient_first_name);
CREATE INDEX IF NOT EXISTS idx_case_studies_doctor ON case_studies(doctor_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status);
CREATE INDEX IF NOT EXISTS idx_case_studies_created ON case_studies(created_at);

-- ================================================
-- 2. CREATE DENTAL_ATTACHMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS dental_attachments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys (exactly one must be set)
    observation_id UUID REFERENCES dental_observations(id) ON DELETE CASCADE,
    procedure_id UUID REFERENCES dental_procedures(id) ON DELETE CASCADE,
    case_study_id UUID REFERENCES case_studies(id) ON DELETE CASCADE,

    -- Patient Composite Key
    patient_mobile_number VARCHAR(20) NOT NULL,
    patient_first_name VARCHAR(100) NOT NULL,

    -- File Information
    file_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,

    -- Metadata
    caption TEXT,
    taken_date DATE,

    -- Audit Fields
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Constraint: exactly one FK must be set
    CONSTRAINT check_dental_attach_single_reference CHECK (
        (CASE WHEN observation_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN procedure_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN case_study_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Create indexes for dental_attachments
CREATE INDEX IF NOT EXISTS idx_dental_attach_observation ON dental_attachments(observation_id);
CREATE INDEX IF NOT EXISTS idx_dental_attach_procedure ON dental_attachments(procedure_id);
CREATE INDEX IF NOT EXISTS idx_dental_attach_case_study ON dental_attachments(case_study_id);
CREATE INDEX IF NOT EXISTS idx_dental_attach_patient ON dental_attachments(patient_mobile_number, patient_first_name);
CREATE INDEX IF NOT EXISTS idx_dental_attach_file_type ON dental_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_dental_attach_created ON dental_attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_dental_attach_active ON dental_attachments(is_active);

-- ================================================
-- 3. VERIFICATION QUERIES
-- ================================================
-- Run these to verify tables were created:
-- SELECT COUNT(*) FROM case_studies;
-- SELECT COUNT(*) FROM dental_attachments;
-- \dt dental* case*

-- ================================================
-- Migration Complete
-- ================================================
