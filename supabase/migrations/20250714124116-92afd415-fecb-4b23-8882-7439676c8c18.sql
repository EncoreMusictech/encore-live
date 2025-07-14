-- Create a table to store catalog valuations
CREATE TABLE public.catalog_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  artist_name TEXT NOT NULL,
  total_streams BIGINT,
  monthly_listeners BIGINT,
  top_tracks JSONB,
  valuation_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.catalog_valuations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own valuations" 
ON public.catalog_valuations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own valuations" 
ON public.catalog_valuations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own valuations" 
ON public.catalog_valuations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own valuations" 
ON public.catalog_valuations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_catalog_valuations_updated_at
BEFORE UPDATE ON public.catalog_valuations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();