
-- Create table to store contract parsing results
CREATE TABLE public.contract_parsing_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  original_text TEXT,
  parsed_data JSONB NOT NULL DEFAULT '{}',
  parsing_status TEXT NOT NULL DEFAULT 'pending',
  parsing_confidence NUMERIC(3,2) DEFAULT 0,
  extracted_entities JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.contract_parsing_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own parsing results" 
  ON public.contract_parsing_results 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_contract_parsing_results_contract_id ON public.contract_parsing_results(contract_id);
CREATE INDEX idx_contract_parsing_results_user_id ON public.contract_parsing_results(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_contract_parsing_results_updated_at
  BEFORE UPDATE ON public.contract_parsing_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
