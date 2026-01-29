-- Phase 1B: Remaining schema and functions

-- Add constraint for company_type
DO $$ BEGIN
  ALTER TABLE companies 
  ADD CONSTRAINT companies_company_type_check 
  CHECK (company_type IN ('publishing_firm', 'client_label', 'standard'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create company_view_scope table for tracking user view preferences
CREATE TABLE IF NOT EXISTS company_view_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  scoped_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, parent_company_id)
);

-- Enable RLS on company_view_scope
ALTER TABLE company_view_scope ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can manage their own view scope
CREATE POLICY "Users can manage their own view scope"
ON company_view_scope FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Helper function to avoid is_operations_team_member() ambiguity
CREATE OR REPLACE FUNCTION is_ops_team()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email IN ('info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- RLS policy: Operations team can manage all view scopes
CREATE POLICY "Operations team can manage all view scopes"
ON company_view_scope FOR ALL
TO authenticated
USING (is_ops_team());

-- Add inherited_from to company_module_access
ALTER TABLE company_module_access 
ADD COLUMN IF NOT EXISTS inherited_from UUID REFERENCES companies(id);

-- Add client_company_id to key data tables
ALTER TABLE copyrights 
ADD COLUMN IF NOT EXISTS client_company_id UUID REFERENCES companies(id);

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS client_company_id UUID REFERENCES companies(id);

ALTER TABLE payees 
ADD COLUMN IF NOT EXISTS client_company_id UUID REFERENCES companies(id);

ALTER TABLE royalty_allocations 
ADD COLUMN IF NOT EXISTS client_company_id UUID REFERENCES companies(id);

-- Indexes for client segmentation
CREATE INDEX IF NOT EXISTS idx_copyrights_client ON copyrights(client_company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_company_id);
CREATE INDEX IF NOT EXISTS idx_payees_client ON payees(client_company_id);
CREATE INDEX IF NOT EXISTS idx_royalty_allocations_client ON royalty_allocations(client_company_id);

-- Function: Get child companies for a parent
CREATE OR REPLACE FUNCTION get_child_companies(_parent_id UUID)
RETURNS TABLE(company_id UUID, company_name TEXT, display_name TEXT, company_type TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, display_name, company_type
  FROM companies
  WHERE parent_company_id = _parent_id
  ORDER BY name;
$$;

-- Function: Get all user IDs in company hierarchy
CREATE OR REPLACE FUNCTION get_company_hierarchy_user_ids(_company_id UUID)
RETURNS TABLE(user_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cu.user_id FROM company_users cu WHERE cu.company_id = _company_id AND cu.status = 'active'
  UNION
  SELECT cu.user_id 
  FROM company_users cu
  INNER JOIN companies c ON cu.company_id = c.id
  WHERE c.parent_company_id = _company_id AND cu.status = 'active';
$$;

-- Function: Check if user has hierarchy access
CREATE OR REPLACE FUNCTION user_has_hierarchy_access(_user_id UUID, _target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users 
    WHERE user_id = _user_id AND company_id = _target_company_id AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM company_users cu
    INNER JOIN companies c ON c.parent_company_id = cu.company_id
    WHERE cu.user_id = _user_id 
    AND c.id = _target_company_id 
    AND cu.status = 'active'
  ) OR is_ops_team();
$$;

-- Function: Get company with parent info
CREATE OR REPLACE FUNCTION get_company_with_hierarchy(_company_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  display_name TEXT,
  company_type TEXT,
  parent_company_id UUID,
  parent_company_name TEXT,
  child_count BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    c.id,
    c.name,
    c.display_name,
    c.company_type,
    c.parent_company_id,
    p.display_name as parent_company_name,
    (SELECT COUNT(*) FROM companies WHERE parent_company_id = c.id) as child_count
  FROM companies c
  LEFT JOIN companies p ON c.parent_company_id = p.id
  WHERE c.id = _company_id;
$$;

-- Function: Set user's view scope
CREATE OR REPLACE FUNCTION set_user_view_scope(
  _user_id UUID,
  _parent_company_id UUID,
  _scoped_company_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO company_view_scope (user_id, parent_company_id, scoped_company_id, updated_at)
  VALUES (_user_id, _parent_company_id, _scoped_company_id, now())
  ON CONFLICT (user_id, parent_company_id)
  DO UPDATE SET 
    scoped_company_id = _scoped_company_id,
    updated_at = now();
END;
$$;

-- Function: Get user's current view scope
CREATE OR REPLACE FUNCTION get_user_view_scope(_user_id UUID, _parent_company_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT scoped_company_id
  FROM company_view_scope
  WHERE user_id = _user_id AND parent_company_id = _parent_company_id;
$$;