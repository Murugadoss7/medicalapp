-- Migration: Add dental_observation_templates table and new observation columns
-- Date: 2025-12-25
-- Description: Phase 2b - Observation Templates (Note Shortcuts) & Enhanced Notes

-- ================================================
-- 1. CREATE DENTAL_OBSERVATION_TEMPLATES TABLE
-- ================================================
-- Pre-defined observation note templates for dental conditions
-- Doctors can quickly select templates based on condition/surface/severity
-- NULL values act as wildcards (match all)

CREATE TABLE IF NOT EXISTS dental_observation_templates (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Matching criteria (NULL = wildcard, matches all)
    condition_type VARCHAR(50),       -- e.g., "Cavity", NULL = all conditions
    tooth_surface VARCHAR(10),        -- e.g., "Occlusal", NULL = all surfaces
    severity VARCHAR(20),             -- e.g., "Moderate", NULL = all severities

    -- Template content
    template_text TEXT NOT NULL,      -- The pre-defined note text
    short_code VARCHAR(20),           -- Optional quick code like "CAV01"

    -- Metadata
    display_order INTEGER DEFAULT 0,   -- Sort order for display
    is_global BOOLEAN DEFAULT FALSE,   -- Available to all doctors with same specialization
    specialization VARCHAR(200),       -- Filter by doctor specialty (e.g., "Dental")

    -- Ownership
    created_by_doctor UUID REFERENCES doctors(id),

    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for dental_observation_templates
CREATE INDEX IF NOT EXISTS idx_dental_template_condition ON dental_observation_templates(condition_type);
CREATE INDEX IF NOT EXISTS idx_dental_template_surface ON dental_observation_templates(tooth_surface);
CREATE INDEX IF NOT EXISTS idx_dental_template_severity ON dental_observation_templates(severity);
CREATE INDEX IF NOT EXISTS idx_dental_template_specialization ON dental_observation_templates(specialization);
CREATE INDEX IF NOT EXISTS idx_dental_template_global ON dental_observation_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_dental_template_creator ON dental_observation_templates(created_by_doctor);
CREATE INDEX IF NOT EXISTS idx_dental_template_short_code ON dental_observation_templates(short_code);

-- ================================================
-- 2. ADD NEW COLUMNS TO DENTAL_OBSERVATIONS TABLE
-- ================================================
-- Add template notes support columns

-- Add selected_template_ids column (comma-separated UUIDs of selected templates)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dental_observations' AND column_name = 'selected_template_ids'
    ) THEN
        ALTER TABLE dental_observations ADD COLUMN selected_template_ids TEXT;
    END IF;
END $$;

-- Add custom_notes column (doctor's additional custom notes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dental_observations' AND column_name = 'custom_notes'
    ) THEN
        ALTER TABLE dental_observations ADD COLUMN custom_notes TEXT;
    END IF;
END $$;

-- ================================================
-- 3. INSERT DEFAULT DENTAL TEMPLATES
-- ================================================
-- Common dental observation templates for quick note entry

INSERT INTO dental_observation_templates (
    condition_type, tooth_surface, severity, template_text, short_code, display_order, is_global, specialization
) VALUES
-- Cavity Templates
('Cavity', 'Occlusal', 'Mild', 'Small occlusal cavity detected. Minimal enamel involvement. Recommend composite restoration.', 'CAV-O-M', 1, true, 'Dental'),
('Cavity', 'Occlusal', 'Moderate', 'Moderate occlusal cavity with dentin involvement. Requires excavation and composite/amalgam restoration.', 'CAV-O-MD', 2, true, 'Dental'),
('Cavity', 'Occlusal', 'Severe', 'Deep occlusal cavity approaching pulp. Consider pulp vitality test. May require RCT if symptomatic.', 'CAV-O-S', 3, true, 'Dental'),
('Cavity', 'Mesial', NULL, 'Proximal cavity on mesial surface. Class II restoration indicated.', 'CAV-M', 4, true, 'Dental'),
('Cavity', 'Distal', NULL, 'Proximal cavity on distal surface. Class II restoration indicated.', 'CAV-D', 5, true, 'Dental'),

-- Decay Templates
('Decay', NULL, 'Mild', 'Early demineralization observed. Recommend fluoride treatment and monitoring.', 'DEC-M', 10, true, 'Dental'),
('Decay', NULL, 'Moderate', 'Active decay present. Requires excavation and restoration.', 'DEC-MD', 11, true, 'Dental'),
('Decay', NULL, 'Severe', 'Extensive decay with significant tooth structure loss. Evaluate for crown or extraction.', 'DEC-S', 12, true, 'Dental'),

-- Fracture Templates
('Fracture', NULL, 'Mild', 'Minor enamel chip/fracture. Smooth edges and monitor.', 'FRAC-M', 20, true, 'Dental'),
('Fracture', NULL, 'Moderate', 'Fracture involving enamel and dentin. Restoration required.', 'FRAC-MD', 21, true, 'Dental'),
('Fracture', NULL, 'Severe', 'Crown fracture with pulp exposure. Emergency treatment required.', 'FRAC-S', 22, true, 'Dental'),

-- Sensitivity Templates
('Sensitivity', NULL, NULL, 'Patient reports sensitivity to cold/hot. Check for recession, cracks, or decay.', 'SENS', 30, true, 'Dental'),

-- Gum Disease Templates
('Gum Disease', NULL, 'Mild', 'Mild gingivitis observed. Recommend improved oral hygiene and professional cleaning.', 'GUM-M', 40, true, 'Dental'),
('Gum Disease', NULL, 'Moderate', 'Moderate periodontitis. Pocket depths 4-5mm. Scaling and root planing indicated.', 'GUM-MD', 41, true, 'Dental'),
('Gum Disease', NULL, 'Severe', 'Advanced periodontitis with bone loss. Refer to periodontist for evaluation.', 'GUM-S', 42, true, 'Dental'),

-- Root Exposure Templates
('Root Exposure', NULL, NULL, 'Cervical root exposure due to gingival recession. Monitor and consider desensitizing treatment.', 'ROOT', 50, true, 'Dental'),

-- Missing Tooth Template
('Missing', NULL, NULL, 'Tooth is missing. Discuss replacement options: implant, bridge, or partial denture.', 'MISS', 60, true, 'Dental'),

-- Impacted Tooth Template
('Impacted', NULL, NULL, 'Impacted tooth detected on radiograph. Evaluate for surgical extraction if symptomatic.', 'IMP', 70, true, 'Dental')

ON CONFLICT DO NOTHING;

-- ================================================
-- 4. VERIFICATION QUERIES
-- ================================================
-- Run these to verify:
-- SELECT COUNT(*) FROM dental_observation_templates;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'dental_observations';
-- \d dental_observation_templates
-- \d dental_observations

-- ================================================
-- Migration Complete
-- ================================================
