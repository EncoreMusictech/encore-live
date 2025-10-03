-- Trigger recalculation for Janishia Jones payout by updating it
-- This will cause the calculate_payout_fields trigger to run and update royalties_to_date

UPDATE payouts
SET updated_at = now()
WHERE id = 'ec273dba-205d-4e54-9517-c370565aba75';
