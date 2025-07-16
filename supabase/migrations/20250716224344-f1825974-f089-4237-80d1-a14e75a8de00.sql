-- Backfill statement_id in existing royalty allocations from their staging records
UPDATE public.royalty_allocations ra
SET contract_terms = jsonb_set(
  COALESCE(ra.contract_terms, '{}'::jsonb),
  '{statement_id}',
  to_jsonb(ris.statement_id)
)
FROM public.royalties_import_staging ris
WHERE ra.batch_id = ris.batch_id
  AND ris.statement_id IS NOT NULL
  AND (ra.contract_terms->>'statement_id' IS NULL OR ra.contract_terms->>'statement_id' = '');