-- Ensure RLS is enabled on the table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources'
  ) THEN
    RAISE NOTICE 'Table public.catalog_revenue_sources not found. Skipping RLS and policies.';
  ELSE
    -- Enable Row Level Security
    EXECUTE 'ALTER TABLE public.catalog_revenue_sources ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Insert policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources' 
        AND polname = 'Users can insert their own revenue sources'
    ) THEN
      CREATE POLICY "Users can insert their own revenue sources"
      ON public.catalog_revenue_sources
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- Update policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources' 
        AND polname = 'Users can update their own revenue sources'
    ) THEN
      CREATE POLICY "Users can update their own revenue sources"
      ON public.catalog_revenue_sources
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- Select policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources' 
        AND polname = 'Users can select their own revenue sources'
    ) THEN
      CREATE POLICY "Users can select their own revenue sources"
      ON public.catalog_revenue_sources
      FOR SELECT
      USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- Delete policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources' 
        AND polname = 'Users can delete their own revenue sources'
    ) THEN
      CREATE POLICY "Users can delete their own revenue sources"
      ON public.catalog_revenue_sources
      FOR DELETE
      USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- Ensure updated_at trigger exists and is attached
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'catalog_revenue_sources'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_catalog_revenue_sources_updated_at'
    ) THEN
      CREATE TRIGGER update_catalog_revenue_sources_updated_at
      BEFORE UPDATE ON public.catalog_revenue_sources
      FOR EACH ROW
      EXECUTE FUNCTION public.update_catalog_revenue_sources_updated_at();
    END IF;
  END IF;
END $$;