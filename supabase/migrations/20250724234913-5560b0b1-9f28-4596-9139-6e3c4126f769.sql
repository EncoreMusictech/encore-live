-- Create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Grant permission to authenticated users to execute the function
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert admin role for info@encoremusic.tech
-- First get the user ID
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID for info@encoremusic.tech from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'info@encoremusic.tech';
    
    -- Insert admin role if user exists
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

-- Add client-portal access for admin user
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID for info@encoremusic.tech from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'info@encoremusic.tech';
    
    -- Insert client-portal module access if user exists
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_module_access (user_id, module_id, access_source)
        VALUES (admin_user_id, 'client-portal', 'admin_grant')
        ON CONFLICT (user_id, module_id) DO NOTHING;
    END IF;
END $$;