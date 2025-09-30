-- Fix RLS policies to use (select auth.uid()) for better performance

-- user_module_access table
DROP POLICY IF EXISTS "Users can view their own module access" ON public.user_module_access;
CREATE POLICY "Users can view their own module access" 
ON public.user_module_access 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own module access" ON public.user_module_access;
CREATE POLICY "Users can update their own module access" 
ON public.user_module_access 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own module access" ON public.user_module_access;
CREATE POLICY "Users can delete their own module access" 
ON public.user_module_access 
FOR DELETE 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Operations team can manage module access" ON public.user_module_access;
CREATE POLICY "Operations team can manage module access" 
ON public.user_module_access 
FOR ALL 
USING (is_operations_team_member((select auth.uid())));

-- valuation_tiers table
DROP POLICY IF EXISTS "Users can view their own tier" ON public.valuation_tiers;
CREATE POLICY "Users can view their own tier" 
ON public.valuation_tiers 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own tier" ON public.valuation_tiers;
CREATE POLICY "Users can create their own tier" 
ON public.valuation_tiers 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own tier" ON public.valuation_tiers;
CREATE POLICY "Users can update their own tier" 
ON public.valuation_tiers 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- sub_accounts_upload_jobs table
DROP POLICY IF EXISTS "Admins can manage upload jobs" ON public.sub_accounts_upload_jobs;
CREATE POLICY "Admins can manage upload jobs" 
ON public.sub_accounts_upload_jobs 
FOR ALL 
USING ((select auth.email()) = 'info@encoremusic.tech');

-- contract_templates table
DROP POLICY IF EXISTS "Users can view their own templates and public templates" ON public.contract_templates;
CREATE POLICY "Users can view their own templates and public templates" 
ON public.contract_templates 
FOR SELECT 
USING (((select auth.uid()) = user_id) OR (is_public = true));

DROP POLICY IF EXISTS "Users can create their own templates" ON public.contract_templates;
CREATE POLICY "Users can create their own templates" 
ON public.contract_templates 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.contract_templates;
CREATE POLICY "Users can update their own templates" 
ON public.contract_templates 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.contract_templates;
CREATE POLICY "Users can delete their own templates" 
ON public.contract_templates 
FOR DELETE 
USING ((select auth.uid()) = user_id);

-- contract_royalty_connections table
DROP POLICY IF EXISTS "Users can view royalty connections for their contracts" ON public.contract_royalty_connections;
CREATE POLICY "Users can view royalty connections for their contracts" 
ON public.contract_royalty_connections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_royalty_connections.contract_id 
  AND contracts.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Users can create royalty connections for their contracts" ON public.contract_royalty_connections;
CREATE POLICY "Users can create royalty connections for their contracts" 
ON public.contract_royalty_connections 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_royalty_connections.contract_id 
  AND contracts.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Users can update royalty connections for their contracts" ON public.contract_royalty_connections;
CREATE POLICY "Users can update royalty connections for their contracts" 
ON public.contract_royalty_connections 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_royalty_connections.contract_id 
  AND contracts.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Users can delete royalty connections for their contracts" ON public.contract_royalty_connections;
CREATE POLICY "Users can delete royalty connections for their contracts" 
ON public.contract_royalty_connections 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_royalty_connections.contract_id 
  AND contracts.user_id = (select auth.uid())
));

-- contract_change_logs table
DROP POLICY IF EXISTS "Users can view change logs for their contracts" ON public.contract_change_logs;
CREATE POLICY "Users can view change logs for their contracts" 
ON public.contract_change_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_change_logs.contract_id 
  AND contracts.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Users can create change logs for their contracts" ON public.contract_change_logs;
CREATE POLICY "Users can create change logs for their contracts" 
ON public.contract_change_logs 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM contracts 
  WHERE contracts.id = contract_change_logs.contract_id 
  AND contracts.user_id = (select auth.uid())
));

-- sub_accounts_staging table
DROP POLICY IF EXISTS "Admins can manage staging data" ON public.sub_accounts_staging;
CREATE POLICY "Admins can manage staging data" 
ON public.sub_accounts_staging 
FOR ALL 
USING ((select auth.email()) = 'info@encoremusic.tech');

-- user_subscriptions table
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- user_usage_tracking table
DROP POLICY IF EXISTS "Users can view their own usage" ON public.user_usage_tracking;
CREATE POLICY "Users can view their own usage" 
ON public.user_usage_tracking 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.user_usage_tracking;
CREATE POLICY "Users can insert their own usage" 
ON public.user_usage_tracking 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON public.user_usage_tracking;
CREATE POLICY "Users can update their own usage" 
ON public.user_usage_tracking 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- user_addon_subscriptions table
DROP POLICY IF EXISTS "Users can view their own addon subscriptions" ON public.user_addon_subscriptions;
CREATE POLICY "Users can view their own addon subscriptions" 
ON public.user_addon_subscriptions 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own addon subscriptions" ON public.user_addon_subscriptions;
CREATE POLICY "Users can insert their own addon subscriptions" 
ON public.user_addon_subscriptions 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own addon subscriptions" ON public.user_addon_subscriptions;
CREATE POLICY "Users can update their own addon subscriptions" 
ON public.user_addon_subscriptions 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- sub_accounts_field_mappings table
DROP POLICY IF EXISTS "Admins can manage field mappings" ON public.sub_accounts_field_mappings;
CREATE POLICY "Admins can manage field mappings" 
ON public.sub_accounts_field_mappings 
FOR ALL 
USING ((select auth.email()) = 'info@encoremusic.tech');

-- copyright_writers table
DROP POLICY IF EXISTS "Users can manage writers for their copyrights" ON public.copyright_writers;
CREATE POLICY "Users can manage writers for their copyrights" 
ON public.copyright_writers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM copyrights 
  WHERE copyrights.id = copyright_writers.copyright_id 
  AND copyrights.user_id = (select auth.uid())
));

-- copyright_publishers table
DROP POLICY IF EXISTS "Users can manage publishers for their copyrights" ON public.copyright_publishers;
CREATE POLICY "Users can manage publishers for their copyrights" 
ON public.copyright_publishers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM copyrights 
  WHERE copyrights.id = copyright_publishers.copyright_id 
  AND copyrights.user_id = (select auth.uid())
));

-- copyright_recordings table
DROP POLICY IF EXISTS "Users can manage recordings for their copyrights" ON public.copyright_recordings;
CREATE POLICY "Users can manage recordings for their copyrights" 
ON public.copyright_recordings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM copyrights 
  WHERE copyrights.id = copyright_recordings.copyright_id 
  AND copyrights.user_id = (select auth.uid())
));

-- copyright_exports table
DROP POLICY IF EXISTS "Users can view their own exports" ON public.copyright_exports;
CREATE POLICY "Users can view their own exports" 
ON public.copyright_exports 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own exports" ON public.copyright_exports;
CREATE POLICY "Users can create their own exports" 
ON public.copyright_exports 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

-- sync_license_comments table
DROP POLICY IF EXISTS "Users can view comments for their sync licenses" ON public.sync_license_comments;
CREATE POLICY "Users can view comments for their sync licenses" 
ON public.sync_license_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM sync_licenses 
  WHERE sync_licenses.id = sync_license_comments.sync_license_id 
  AND sync_licenses.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Users can create comments for their sync licenses" ON public.sync_license_comments;
CREATE POLICY "Users can create comments for their sync licenses" 
ON public.sync_license_comments 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM sync_licenses 
  WHERE sync_licenses.id = sync_license_comments.sync_license_id 
  AND sync_licenses.user_id = (select auth.uid())
));

-- copyright_activity_logs table
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.copyright_activity_logs;
CREATE POLICY "Users can view their own activity logs" 
ON public.copyright_activity_logs 
FOR SELECT 
USING ((select auth.uid()) = user_id);

-- reconciliation_batches table
DROP POLICY IF EXISTS "Users can manage their own reconciliation batches" ON public.reconciliation_batches;
CREATE POLICY "Users can manage their own reconciliation batches" 
ON public.reconciliation_batches 
FOR ALL 
USING ((select auth.uid()) = user_id);

-- royalty_allocations table
DROP POLICY IF EXISTS "Users can manage their own royalty allocations" ON public.royalty_allocations;
CREATE POLICY "Users can manage their own royalty allocations" 
ON public.royalty_allocations 
FOR ALL 
USING ((select auth.uid()) = user_id);

-- royalty_writers table
DROP POLICY IF EXISTS "Users can manage writers for their royalty allocations" ON public.royalty_writers;
CREATE POLICY "Users can manage writers for their royalty allocations" 
ON public.royalty_writers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM royalty_allocations 
  WHERE royalty_allocations.id = royalty_writers.royalty_id 
  AND royalty_allocations.user_id = (select auth.uid())
));

-- payouts table
DROP POLICY IF EXISTS "Users can manage their own payouts" ON public.payouts;
CREATE POLICY "Users can manage their own payouts" 
ON public.payouts 
FOR ALL 
USING ((select auth.uid()) = user_id);

-- payout_royalties table
DROP POLICY IF EXISTS "Users can manage payout royalties for their payouts" ON public.payout_royalties;
CREATE POLICY "Users can manage payout royalties for their payouts" 
ON public.payout_royalties 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM payouts 
  WHERE payouts.id = payout_royalties.payout_id 
  AND payouts.user_id = (select auth.uid())
));

-- royalties_import_staging table
DROP POLICY IF EXISTS "Users can manage their own import staging records" ON public.royalties_import_staging;
CREATE POLICY "Users can manage their own import staging records" 
ON public.royalties_import_staging 
FOR ALL 
USING ((select auth.uid()) = user_id);