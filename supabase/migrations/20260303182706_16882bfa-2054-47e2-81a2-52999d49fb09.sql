
ALTER TABLE public.contracts 
ALTER COLUMN agreement_id SET DEFAULT ('AGR-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(floor(extract(epoch from clock_timestamp()) * 1000000)::bigint::text, 16, '0'));
