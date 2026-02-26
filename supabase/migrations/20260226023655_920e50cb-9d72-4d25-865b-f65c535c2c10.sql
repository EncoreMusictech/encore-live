-- Enable RLS on ascap_catalogue
ALTER TABLE public.ascap_catalogue ENABLE ROW LEVEL SECURITY;

-- Allow only authenticated users to read
CREATE POLICY "Authenticated users can view ASCAP catalogue"
  ON public.ascap_catalogue
  FOR SELECT
  TO authenticated
  USING (true);
