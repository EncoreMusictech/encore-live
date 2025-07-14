-- Create table for deal scenarios
CREATE TABLE public.deal_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  selected_tracks JSONB NOT NULL, -- Array of track/album objects
  deal_terms JSONB NOT NULL, -- Deal structure (advance, royalty %, term length, etc.)
  projections JSONB NOT NULL, -- 5-year earnings projections
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for artist discography cache
CREATE TABLE public.artist_discography (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id TEXT NOT NULL UNIQUE,
  artist_name TEXT NOT NULL,
  albums JSONB NOT NULL,
  singles JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.deal_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_discography ENABLE ROW LEVEL SECURITY;

-- Create policies for deal_scenarios
CREATE POLICY "Users can view their own deal scenarios" 
ON public.deal_scenarios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deal scenarios" 
ON public.deal_scenarios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deal scenarios" 
ON public.deal_scenarios 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deal scenarios" 
ON public.deal_scenarios 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for artist_discography (public read for caching)
CREATE POLICY "Anyone can view artist discography" 
ON public.artist_discography 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage artist discography" 
ON public.artist_discography 
FOR ALL 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_deal_scenarios_updated_at
BEFORE UPDATE ON public.deal_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_deal_scenarios_user_id ON public.deal_scenarios(user_id);
CREATE INDEX idx_deal_scenarios_artist_id ON public.deal_scenarios(artist_id);
CREATE INDEX idx_artist_discography_artist_id ON public.artist_discography(artist_id);
CREATE INDEX idx_artist_discography_last_updated ON public.artist_discography(last_updated);