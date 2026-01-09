-- Create table for tracking PRO registration submissions
CREATE TABLE public.pro_registration_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_name TEXT NOT NULL,  -- 'ASCAP', 'BMI', 'SOCAN', 'SESAC', 'MLC'
  export_id UUID REFERENCES copyright_exports(id) ON DELETE SET NULL,
  cwr_file_name TEXT NOT NULL,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  expected_ack_date TIMESTAMPTZ,
  ack_received BOOLEAN DEFAULT FALSE,
  ack_file_name TEXT,
  ack_received_at TIMESTAMPTZ,
  works_submitted INTEGER DEFAULT 0,
  works_accepted INTEGER DEFAULT 0,
  works_rejected INTEGER DEFAULT 0,
  works_pending INTEGER DEFAULT 0,
  status TEXT DEFAULT 'submitted',  -- submitted, processing, acknowledged, partial, failed, cancelled
  error_message TEXT,
  submission_metadata JSONB DEFAULT '{}',
  ack_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for linking submitted works to registrations
CREATE TABLE public.pro_registration_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES pro_registration_submissions(id) ON DELETE CASCADE NOT NULL,
  copyright_id UUID REFERENCES copyrights(id) ON DELETE CASCADE NOT NULL,
  work_title TEXT NOT NULL,
  work_id TEXT,
  registration_status TEXT DEFAULT 'pending',  -- pending, accepted, rejected, conflict
  ack_message TEXT,
  pro_work_id TEXT,  -- Work ID assigned by the PRO after acceptance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pro_registration_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_registration_works ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pro_registration_submissions
CREATE POLICY "Users can view their own submissions" 
ON public.pro_registration_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" 
ON public.pro_registration_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
ON public.pro_registration_submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions" 
ON public.pro_registration_submissions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for pro_registration_works
CREATE POLICY "Users can view their own registration works" 
ON public.pro_registration_works 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM pro_registration_submissions s 
  WHERE s.id = submission_id AND s.user_id = auth.uid()
));

CREATE POLICY "Users can create their own registration works" 
ON public.pro_registration_works 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM pro_registration_submissions s 
  WHERE s.id = submission_id AND s.user_id = auth.uid()
));

CREATE POLICY "Users can update their own registration works" 
ON public.pro_registration_works 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM pro_registration_submissions s 
  WHERE s.id = submission_id AND s.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_pro_registration_submissions_user_id ON pro_registration_submissions(user_id);
CREATE INDEX idx_pro_registration_submissions_status ON pro_registration_submissions(status);
CREATE INDEX idx_pro_registration_submissions_pro_name ON pro_registration_submissions(pro_name);
CREATE INDEX idx_pro_registration_works_submission_id ON pro_registration_works(submission_id);
CREATE INDEX idx_pro_registration_works_copyright_id ON pro_registration_works(copyright_id);

-- Create trigger for updated_at
CREATE TRIGGER update_pro_registration_submissions_updated_at
BEFORE UPDATE ON public.pro_registration_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pro_registration_works_updated_at
BEFORE UPDATE ON public.pro_registration_works
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();