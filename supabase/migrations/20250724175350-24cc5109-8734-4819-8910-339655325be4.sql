-- Fix security warnings by adding proper search paths to new functions

-- Update has_active_trial function
CREATE OR REPLACE FUNCTION public.has_active_trial(p_user_id UUID, p_modules TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update start_free_trial function
CREATE OR REPLACE FUNCTION public.start_free_trial(
  p_user_id UUID,
  p_trial_type TEXT,
  p_trial_identifier TEXT,
  p_trial_modules TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update expire_trials function
CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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