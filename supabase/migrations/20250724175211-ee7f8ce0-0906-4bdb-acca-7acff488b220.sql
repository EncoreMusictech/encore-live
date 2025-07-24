-- Add user_free_trials table for tracking 14-day free trials
CREATE TABLE public.user_free_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_type TEXT NOT NULL, -- 'module' or 'bundle'
  trial_identifier TEXT NOT NULL, -- module ID or bundle ID or 'custom' for custom packages
  trial_modules TEXT[] NOT NULL DEFAULT '{}', -- Array of module IDs included in trial
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  stripe_subscription_id TEXT, -- Reference to Stripe subscription if trial converts
  trial_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'converted', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one active trial per user per trial type
  UNIQUE(user_id, trial_identifier, trial_status) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS
ALTER TABLE public.user_free_trials ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own free trials"
  ON public.user_free_trials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own free trials"
  ON public.user_free_trials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own free trials"
  ON public.user_free_trials
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check if user has active trial for specific modules
CREATE OR REPLACE FUNCTION public.has_active_trial(p_user_id UUID, p_modules TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_free_trials 
    WHERE user_id = p_user_id 
    AND trial_status = 'active'
    AND trial_end_date > now()
    AND trial_modules && p_modules -- Array overlap operator
  );
END;
$$;

-- Function to start a free trial
CREATE OR REPLACE FUNCTION public.start_free_trial(
  p_user_id UUID,
  p_trial_type TEXT,
  p_trial_identifier TEXT,
  p_trial_modules TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trial_id UUID;
BEGIN
  -- Check if user already has an active trial for this identifier
  IF EXISTS (
    SELECT 1 FROM public.user_free_trials 
    WHERE user_id = p_user_id 
    AND trial_identifier = p_trial_identifier
    AND trial_status = 'active'
    AND trial_end_date > now()
  ) THEN
    RAISE EXCEPTION 'User already has an active trial for this product';
  END IF;
  
  -- Check if user already has an active subscription that covers these modules
  IF EXISTS (
    SELECT 1 FROM public.subscribers 
    WHERE user_id = p_user_id 
    AND subscribed = true
  ) THEN
    RAISE EXCEPTION 'User already has an active subscription';
  END IF;
  
  -- Insert new trial
  INSERT INTO public.user_free_trials (
    user_id,
    trial_type,
    trial_identifier,
    trial_modules,
    trial_start_date,
    trial_end_date
  ) VALUES (
    p_user_id,
    p_trial_type,
    p_trial_identifier,
    p_trial_modules,
    now(),
    now() + interval '14 days'
  ) RETURNING id INTO trial_id;
  
  RETURN trial_id;
END;
$$;

-- Function to expire trials
CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.user_free_trials 
  SET trial_status = 'expired',
      updated_at = now()
  WHERE trial_status = 'active' 
  AND trial_end_date <= now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_user_free_trials_updated_at
  BEFORE UPDATE ON public.user_free_trials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();