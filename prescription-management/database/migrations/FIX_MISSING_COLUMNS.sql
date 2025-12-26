-- ============================================================
-- FIX ALL MISSING COLUMNS IN DENTAL TABLES
-- ============================================================
-- Run this in Neon DB to add any missing columns
-- ============================================================

-- ========================================
-- 1. DENTAL_OBSERVATIONS - Add missing columns
-- ========================================

-- Add selected_template_ids
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_observations' AND column_name = 'selected_template_ids') THEN
        ALTER TABLE dental_observations ADD COLUMN selected_template_ids TEXT;
    END IF;
END $$;

-- Add custom_notes
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_observations' AND column_name = 'custom_notes') THEN
        ALTER TABLE dental_observations ADD COLUMN custom_notes TEXT;
    END IF;
END $$;

-- Add observation_notes (if missing)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_observations' AND column_name = 'observation_notes') THEN
        ALTER TABLE dental_observations ADD COLUMN observation_notes TEXT;
    END IF;
END $$;

-- Add treatment_required
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_observations' AND column_name = 'treatment_required') THEN
        ALTER TABLE dental_observations ADD COLUMN treatment_required BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add treatment_done
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_observations' AND column_name = 'treatment_done') THEN
        ALTER TABLE dental_observations ADD COLUMN treatment_done BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add treatment_date
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_observations' AND column_name = 'treatment_date') THEN
        ALTER TABLE dental_observations ADD COLUMN treatment_date DATE;
    END IF;
END $$;

-- Add tooth_surface
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_observations' AND column_name = 'tooth_surface') THEN
        ALTER TABLE dental_observations ADD COLUMN tooth_surface VARCHAR(10);
    END IF;
END $$;

-- Add severity
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_observations' AND column_name = 'severity') THEN
        ALTER TABLE dental_observations ADD COLUMN severity VARCHAR(20);
    END IF;
END $$;

-- ========================================
-- 2. DENTAL_PROCEDURES - Add missing columns
-- ========================================

-- Add procedure_date
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'procedure_date') THEN
        ALTER TABLE dental_procedures ADD COLUMN procedure_date DATE;
    END IF;
END $$;

-- Add completed_date
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'completed_date') THEN
        ALTER TABLE dental_procedures ADD COLUMN completed_date DATE;
    END IF;
END $$;

-- Add procedure_notes
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'procedure_notes') THEN
        ALTER TABLE dental_procedures ADD COLUMN procedure_notes TEXT;
    END IF;
END $$;

-- Add complications
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'complications') THEN
        ALTER TABLE dental_procedures ADD COLUMN complications TEXT;
    END IF;
END $$;

-- Add duration_minutes
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'duration_minutes') THEN
        ALTER TABLE dental_procedures ADD COLUMN duration_minutes INTEGER;
    END IF;
END $$;

-- Add estimated_cost
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'estimated_cost') THEN
        ALTER TABLE dental_procedures ADD COLUMN estimated_cost DECIMAL(10,2);
    END IF;
END $$;

-- Add actual_cost
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'actual_cost') THEN
        ALTER TABLE dental_procedures ADD COLUMN actual_cost DECIMAL(10,2);
    END IF;
END $$;

-- Add tooth_numbers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'tooth_numbers') THEN
        ALTER TABLE dental_procedures ADD COLUMN tooth_numbers TEXT;
    END IF;
END $$;

-- Add description
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'description') THEN
        ALTER TABLE dental_procedures ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add observation_id FK
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_procedures' AND column_name = 'observation_id') THEN
        ALTER TABLE dental_procedures ADD COLUMN observation_id UUID REFERENCES dental_observations(id);
    END IF;
END $$;

-- ========================================
-- 3. VERIFY COLUMNS - Run these queries
-- ========================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dental_observations' ORDER BY column_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dental_procedures' ORDER BY column_name;

-- ========================================
-- DONE
-- ========================================
