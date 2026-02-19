
-- Create company_messages table for real-time chat
CREATE TABLE public.company_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_email text NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  is_encore_admin boolean NOT NULL DEFAULT false,
  read_by jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_messages_company_id ON public.company_messages(company_id);
CREATE INDEX idx_company_messages_created_at ON public.company_messages(created_at);

ALTER TABLE public.company_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid ambiguity with is_operations_team_member overloads
CREATE OR REPLACE FUNCTION public.is_encore_team()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

CREATE POLICY "Users can read messages for their company"
ON public.company_messages FOR SELECT
USING (
  public.is_encore_team()
  OR public.user_belongs_to_company(auth.uid(), company_id)
);

CREATE POLICY "Users can send messages to their company"
ON public.company_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    public.is_encore_team()
    OR public.user_belongs_to_company(auth.uid(), company_id)
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.company_messages;
