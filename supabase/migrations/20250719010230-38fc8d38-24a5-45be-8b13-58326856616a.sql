-- Create writer_allocations table for sync licensing
CREATE TABLE public.writer_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_license_id UUID NOT NULL,
  copyright_id UUID NOT NULL,
  writer_id UUID NOT NULL,
  writer_name TEXT NOT NULL,
  ownership_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  allocated_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  allocation_type TEXT NOT NULL DEFAULT 'both' CHECK (allocation_type IN ('publishing', 'master', 'both')),
  payment_priority INTEGER NOT NULL DEFAULT 1,
  recoupment_applicable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.writer_allocations ENABLE ROW LEVEL SECURITY;

-- Create policies for writer allocations
CREATE POLICY "Users can view writer allocations for their sync licenses" 
ON public.writer_allocations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sync_licenses 
  WHERE sync_licenses.id = writer_allocations.sync_license_id 
  AND sync_licenses.user_id = auth.uid()
));

CREATE POLICY "Users can create writer allocations for their sync licenses" 
ON public.writer_allocations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sync_licenses 
  WHERE sync_licenses.id = writer_allocations.sync_license_id 
  AND sync_licenses.user_id = auth.uid()
));

CREATE POLICY "Users can update writer allocations for their sync licenses" 
ON public.writer_allocations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.sync_licenses 
  WHERE sync_licenses.id = writer_allocations.sync_license_id 
  AND sync_licenses.user_id = auth.uid()
));

CREATE POLICY "Users can delete writer allocations for their sync licenses" 
ON public.writer_allocations 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.sync_licenses 
  WHERE sync_licenses.id = writer_allocations.sync_license_id 
  AND sync_licenses.user_id = auth.uid()
));

-- Add foreign key constraints
ALTER TABLE public.writer_allocations 
ADD CONSTRAINT fk_writer_allocations_sync_license 
FOREIGN KEY (sync_license_id) REFERENCES public.sync_licenses(id) ON DELETE CASCADE;

ALTER TABLE public.writer_allocations 
ADD CONSTRAINT fk_writer_allocations_copyright 
FOREIGN KEY (copyright_id) REFERENCES public.copyrights(id) ON DELETE CASCADE;

ALTER TABLE public.writer_allocations 
ADD CONSTRAINT fk_writer_allocations_writer 
FOREIGN KEY (writer_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Create trigger for updated_at
CREATE TRIGGER update_writer_allocations_updated_at
BEFORE UPDATE ON public.writer_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();