-- Add PRO registration status fields to copyrights table
ALTER TABLE public.copyrights 
ADD COLUMN ascap_status TEXT,
ADD COLUMN bmi_status TEXT, 
ADD COLUMN socan_status TEXT,
ADD COLUMN sesac_status TEXT;