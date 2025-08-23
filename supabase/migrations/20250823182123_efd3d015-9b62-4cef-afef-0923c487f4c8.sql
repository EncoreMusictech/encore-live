-- Fix security warnings for the functions we just created by adding search_path
ALTER FUNCTION public.update_cwr_submissions_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_cwr_acknowledgments_updated_at() SET search_path TO 'public';  
ALTER FUNCTION public.track_registration_status_change() SET search_path TO 'public';