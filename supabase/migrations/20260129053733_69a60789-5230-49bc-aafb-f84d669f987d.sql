-- Phase 1A: Schema columns only

-- Add parent_company_id to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add company_type to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'standard';

-- Create index for parent_company_id
CREATE INDEX IF NOT EXISTS idx_companies_parent ON companies(parent_company_id);

-- Create index for company_type
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(company_type);