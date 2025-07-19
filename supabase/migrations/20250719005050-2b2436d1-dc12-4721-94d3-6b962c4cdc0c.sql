-- Phase 1: Enhanced Sync Licensing Schema Updates

-- Add licensor/licensee contact information fields
ALTER TABLE public.sync_licenses
ADD COLUMN IF NOT EXISTS licensor_name TEXT,
ADD COLUMN IF NOT EXISTS licensor_email TEXT,
ADD COLUMN IF NOT EXISTS licensor_phone TEXT,
ADD COLUMN IF NOT EXISTS licensor_address TEXT,
ADD COLUMN IF NOT EXISTS licensor_company TEXT,
ADD COLUMN IF NOT EXISTS licensee_name TEXT,
ADD COLUMN IF NOT EXISTS licensee_email TEXT,
ADD COLUMN IF NOT EXISTS licensee_phone TEXT,
ADD COLUMN IF NOT EXISTS licensee_address TEXT,
ADD COLUMN IF NOT EXISTS licensee_company TEXT;

-- Add payment terms fields
ALTER TABLE public.sync_licenses
ADD COLUMN IF NOT EXISTS payment_due_date DATE,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS banking_instructions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS backend_percentage NUMERIC(5,2) DEFAULT 0;

-- Add scene context and detailed usage tracking
ALTER TABLE public.sync_licenses
ADD COLUMN IF NOT EXISTS scene_description TEXT,
ADD COLUMN IF NOT EXISTS scene_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS scene_timestamp TEXT,
ADD COLUMN IF NOT EXISTS music_timing_notes TEXT,
ADD COLUMN IF NOT EXISTS instrumental_vocal TEXT CHECK (instrumental_vocal IN ('instrumental', 'vocal', 'both')),
ADD COLUMN IF NOT EXISTS music_prominence TEXT CHECK (music_prominence IN ('background', 'featured', 'theme')),
ADD COLUMN IF NOT EXISTS audio_mix_level NUMERIC(3,1) CHECK (audio_mix_level >= 0 AND audio_mix_level <= 10);

-- Add contract execution tracking fields
ALTER TABLE public.sync_licenses
ADD COLUMN IF NOT EXISTS contract_execution_status TEXT DEFAULT 'draft' CHECK (contract_execution_status IN ('draft', 'sent', 'signed', 'executed', 'expired')),
ADD COLUMN IF NOT EXISTS contract_sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contract_signed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contract_executed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contract_expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signatory_name TEXT,
ADD COLUMN IF NOT EXISTS signatory_title TEXT,
ADD COLUMN IF NOT EXISTS witness_name TEXT,
ADD COLUMN IF NOT EXISTS notarization_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notarization_date TIMESTAMP WITH TIME ZONE;

-- Add credit language and rights clearance flags
ALTER TABLE public.sync_licenses
ADD COLUMN IF NOT EXISTS credit_language TEXT,
ADD COLUMN IF NOT EXISTS credit_placement TEXT CHECK (credit_placement IN ('end_credits', 'opening_credits', 'none', 'on_screen', 'package_only')),
ADD COLUMN IF NOT EXISTS credit_size TEXT CHECK (credit_size IN ('standard', 'large', 'small', 'equal')),
ADD COLUMN IF NOT EXISTS credit_requirements JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rights_cleared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS clearance_notes TEXT,
ADD COLUMN IF NOT EXISTS master_rights_cleared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS publishing_rights_cleared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS synchronization_rights_cleared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS performance_rights_cleared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mechanical_rights_cleared BOOLEAN DEFAULT false;

-- Add document management fields
ALTER TABLE public.sync_licenses
ADD COLUMN IF NOT EXISTS signed_agreement_url TEXT,
ADD COLUMN IF NOT EXISTS executed_agreement_url TEXT,
ADD COLUMN IF NOT EXISTS amendment_urls TEXT[],
ADD COLUMN IF NOT EXISTS supporting_documents JSONB DEFAULT '[]';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sync_licenses_contract_status ON public.sync_licenses(contract_execution_status);
CREATE INDEX IF NOT EXISTS idx_sync_licenses_payment_status ON public.sync_licenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_sync_licenses_rights_cleared ON public.sync_licenses(rights_cleared);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_sync_license_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sync_licenses_updated_at ON public.sync_licenses;
CREATE TRIGGER update_sync_licenses_updated_at
    BEFORE UPDATE ON public.sync_licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sync_license_updated_at();