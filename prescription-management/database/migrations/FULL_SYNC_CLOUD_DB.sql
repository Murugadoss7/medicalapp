-- ============================================================
-- COMPLETE DATABASE SYNC FOR CLOUD (NEON DB)
-- ============================================================
-- Date: 2025-12-25
-- Run this ENTIRE script in Neon DB to sync all missing tables/columns
-- This includes: Phase 2 File Upload, AI Case Study, Observation Templates
-- ============================================================

-- ========================================
-- STEP 1: CASE_STUDIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS case_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_study_number VARCHAR(100) UNIQUE NOT NULL,
    patient_mobile_number VARCHAR(15) NOT NULL,
    patient_first_name VARCHAR(100) NOT NULL,
    patient_uuid UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    appointment_ids TEXT,
    prescription_ids TEXT,
    procedure_ids TEXT,
    observation_ids TEXT,
    title VARCHAR(500) NOT NULL,
    chief_complaint TEXT NOT NULL,
    pre_treatment_summary TEXT,
    initial_diagnosis TEXT,
    treatment_goals TEXT,
    treatment_summary TEXT,
    procedures_performed TEXT,
    outcome_summary TEXT,
    success_metrics TEXT,
    patient_feedback TEXT,
    full_narrative TEXT,
    generation_prompt TEXT,
    generation_model VARCHAR(100),
    treatment_start_date DATE,
    treatment_end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_exported BOOLEAN NOT NULL DEFAULT FALSE,
    exported_format VARCHAR(20),
    exported_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_case_studies_number ON case_studies(case_study_number);
CREATE INDEX IF NOT EXISTS idx_case_studies_patient ON case_studies(patient_mobile_number, patient_first_name);
CREATE INDEX IF NOT EXISTS idx_case_studies_doctor ON case_studies(doctor_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status);
CREATE INDEX IF NOT EXISTS idx_case_studies_created ON case_studies(created_at);

-- ========================================
-- STEP 2: DENTAL_ATTACHMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS dental_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id UUID REFERENCES dental_observations(id) ON DELETE CASCADE,
    procedure_id UUID REFERENCES dental_procedures(id) ON DELETE CASCADE,
    case_study_id UUID REFERENCES case_studies(id) ON DELETE CASCADE,
    patient_mobile_number VARCHAR(20) NOT NULL,
    patient_first_name VARCHAR(100) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    caption TEXT,
    taken_date DATE,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Note: Removing the check constraint as it may cause issues with NULL values
-- The application layer handles validation

CREATE INDEX IF NOT EXISTS idx_dental_attach_observation ON dental_attachments(observation_id);
CREATE INDEX IF NOT EXISTS idx_dental_attach_procedure ON dental_attachments(procedure_id);
CREATE INDEX IF NOT EXISTS idx_dental_attach_case_study ON dental_attachments(case_study_id);
CREATE INDEX IF NOT EXISTS idx_dental_attach_patient ON dental_attachments(patient_mobile_number, patient_first_name);
CREATE INDEX IF NOT EXISTS idx_dental_attach_file_type ON dental_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_dental_attach_created ON dental_attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_dental_attach_active ON dental_attachments(is_active);

-- ========================================
-- STEP 3: DENTAL_OBSERVATION_TEMPLATES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS dental_observation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_type VARCHAR(50),
    tooth_surface VARCHAR(10),
    severity VARCHAR(20),
    template_text TEXT NOT NULL,
    short_code VARCHAR(20),
    display_order INTEGER DEFAULT 0,
    is_global BOOLEAN DEFAULT FALSE,
    specialization VARCHAR(200),
    created_by_doctor UUID REFERENCES doctors(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_dental_template_condition ON dental_observation_templates(condition_type);
CREATE INDEX IF NOT EXISTS idx_dental_template_surface ON dental_observation_templates(tooth_surface);
CREATE INDEX IF NOT EXISTS idx_dental_template_severity ON dental_observation_templates(severity);
CREATE INDEX IF NOT EXISTS idx_dental_template_specialization ON dental_observation_templates(specialization);
CREATE INDEX IF NOT EXISTS idx_dental_template_global ON dental_observation_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_dental_template_creator ON dental_observation_templates(created_by_doctor);
CREATE INDEX IF NOT EXISTS idx_dental_template_short_code ON dental_observation_templates(short_code);

-- ========================================
-- STEP 4: ADD COLUMNS TO DENTAL_OBSERVATIONS
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dental_observations' AND column_name = 'selected_template_ids'
    ) THEN
        ALTER TABLE dental_observations ADD COLUMN selected_template_ids TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dental_observations' AND column_name = 'custom_notes'
    ) THEN
        ALTER TABLE dental_observations ADD COLUMN custom_notes TEXT;
    END IF;
END $$;

-- ========================================
-- STEP 5: INSERT DEFAULT TEMPLATES
-- ========================================
INSERT INTO dental_observation_templates (
    condition_type, tooth_surface, severity, template_text, short_code, display_order, is_global, specialization
) VALUES
('Cavity', 'Occlusal', 'Mild', 'Small occlusal cavity detected. Minimal enamel involvement. Recommend composite restoration.', 'CAV-O-M', 1, true, 'Dental'),
('Cavity', 'Occlusal', 'Moderate', 'Moderate occlusal cavity with dentin involvement. Requires excavation and composite/amalgam restoration.', 'CAV-O-MD', 2, true, 'Dental'),
('Cavity', 'Occlusal', 'Severe', 'Deep occlusal cavity approaching pulp. Consider pulp vitality test. May require RCT if symptomatic.', 'CAV-O-S', 3, true, 'Dental'),
('Cavity', 'Mesial', NULL, 'Proximal cavity on mesial surface. Class II restoration indicated.', 'CAV-M', 4, true, 'Dental'),
('Cavity', 'Distal', NULL, 'Proximal cavity on distal surface. Class II restoration indicated.', 'CAV-D', 5, true, 'Dental'),
('Decay', NULL, 'Mild', 'Early demineralization observed. Recommend fluoride treatment and monitoring.', 'DEC-M', 10, true, 'Dental'),
('Decay', NULL, 'Moderate', 'Active decay present. Requires excavation and restoration.', 'DEC-MD', 11, true, 'Dental'),
('Decay', NULL, 'Severe', 'Extensive decay with significant tooth structure loss. Evaluate for crown or extraction.', 'DEC-S', 12, true, 'Dental'),
('Fracture', NULL, 'Mild', 'Minor enamel chip/fracture. Smooth edges and monitor.', 'FRAC-M', 20, true, 'Dental'),
('Fracture', NULL, 'Moderate', 'Fracture involving enamel and dentin. Restoration required.', 'FRAC-MD', 21, true, 'Dental'),
('Fracture', NULL, 'Severe', 'Crown fracture with pulp exposure. Emergency treatment required.', 'FRAC-S', 22, true, 'Dental'),
('Sensitivity', NULL, NULL, 'Patient reports sensitivity to cold/hot. Check for recession, cracks, or decay.', 'SENS', 30, true, 'Dental'),
('Gum Disease', NULL, 'Mild', 'Mild gingivitis observed. Recommend improved oral hygiene and professional cleaning.', 'GUM-M', 40, true, 'Dental'),
('Gum Disease', NULL, 'Moderate', 'Moderate periodontitis. Pocket depths 4-5mm. Scaling and root planing indicated.', 'GUM-MD', 41, true, 'Dental'),
('Gum Disease', NULL, 'Severe', 'Advanced periodontitis with bone loss. Refer to periodontist for evaluation.', 'GUM-S', 42, true, 'Dental'),
('Root Exposure', NULL, NULL, 'Cervical root exposure due to gingival recession. Monitor and consider desensitizing treatment.', 'ROOT', 50, true, 'Dental'),
('Missing', NULL, NULL, 'Tooth is missing. Discuss replacement options: implant, bridge, or partial denture.', 'MISS', 60, true, 'Dental'),
('Impacted', NULL, NULL, 'Impacted tooth detected on radiograph. Evaluate for surgical extraction if symptomatic.', 'IMP', 70, true, 'Dental')
ON CONFLICT DO NOTHING;

-- ========================================
-- VERIFICATION - RUN THESE AFTER
-- ========================================
-- Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('case_studies', 'dental_attachments', 'dental_observation_templates');

-- Check columns added:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'dental_observations' AND column_name IN ('selected_template_ids', 'custom_notes');

-- Count templates:
-- SELECT COUNT(*) FROM dental_observation_templates;

-- ========================================
-- SYNC COMPLETE
-- ========================================
