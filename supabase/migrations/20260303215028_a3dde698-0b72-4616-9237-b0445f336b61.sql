ALTER TABLE public.contract_interested_parties
  ADD COLUMN merged_into_id UUID REFERENCES public.contract_interested_parties(id) ON DELETE SET NULL,
  ADD COLUMN merged_at TIMESTAMPTZ;