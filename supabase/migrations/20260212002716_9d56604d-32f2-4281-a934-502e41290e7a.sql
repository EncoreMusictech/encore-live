
-- =============================================
-- Catalog Import Center: Database Migration
-- =============================================

-- 1. catalog_import_batches
CREATE TABLE public.catalog_import_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID,
  file_name TEXT NOT NULL,
  total_rows INT NOT NULL DEFAULT 0,
  valid_rows INT NOT NULL DEFAULT 0,
  duplicate_rows INT NOT NULL DEFAULT 0,
  error_rows INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import batches"
  ON public.catalog_import_batches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own import batches"
  ON public.catalog_import_batches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own import batches"
  ON public.catalog_import_batches FOR UPDATE USING (auth.uid() = user_id);

-- 2. catalog_import_staging
CREATE TABLE public.catalog_import_staging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_batch_id UUID NOT NULL REFERENCES public.catalog_import_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID,
  source_sheet TEXT,
  work_title TEXT,
  artist_name TEXT,
  isrc TEXT,
  iswc TEXT,
  normalized_title TEXT,
  writers JSONB DEFAULT '[]'::jsonb,
  publishers JSONB DEFAULT '[]'::jsonb,
  canonical_row JSONB DEFAULT '{}'::jsonb,
  identifier_conflicts JSONB DEFAULT '[]'::jsonb,
  validation_status TEXT NOT NULL DEFAULT 'valid',
  validation_errors JSONB DEFAULT '[]'::jsonb,
  promoted BOOLEAN NOT NULL DEFAULT false,
  raw_row_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_import_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own staging rows"
  ON public.catalog_import_staging FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own staging rows"
  ON public.catalog_import_staging FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own staging rows"
  ON public.catalog_import_staging FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own staging rows"
  ON public.catalog_import_staging FOR DELETE USING (auth.uid() = user_id);

-- 3. catalog_works (golden master)
CREATE TABLE public.catalog_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID,
  work_title TEXT NOT NULL,
  normalized_title TEXT,
  iswc TEXT,
  isrc TEXT,
  artist_name TEXT,
  album_title TEXT,
  source TEXT NOT NULL DEFAULT 'import',
  import_batch_id UUID REFERENCES public.catalog_import_batches(id),
  musicbrainz_id TEXT,
  ascap_work_id TEXT,
  bmi_work_id TEXT,
  mlc_work_id TEXT,
  pro_registrations JSONB NOT NULL DEFAULT '[]'::jsonb,
  sync_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view catalog works"
  ON public.catalog_works FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own catalog works"
  ON public.catalog_works FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own catalog works"
  ON public.catalog_works FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own catalog works"
  ON public.catalog_works FOR DELETE USING (auth.uid() = user_id);

-- 4. catalog_contributors
CREATE TABLE public.catalog_contributors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  ipi_number TEXT,
  pro_affiliation TEXT,
  role TEXT NOT NULL DEFAULT 'writer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contributors"
  ON public.catalog_contributors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own contributors"
  ON public.catalog_contributors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contributors"
  ON public.catalog_contributors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contributors"
  ON public.catalog_contributors FOR DELETE USING (auth.uid() = user_id);

-- 5. catalog_work_contributors (join table)
CREATE TABLE public.catalog_work_contributors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_work_id UUID NOT NULL REFERENCES public.catalog_works(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES public.catalog_contributors(id),
  role TEXT NOT NULL DEFAULT 'composer',
  ownership_percentage NUMERIC,
  mechanical_share NUMERIC,
  performance_share NUMERIC,
  sync_share NUMERIC,
  controlled BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.catalog_work_contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view work contributors"
  ON public.catalog_work_contributors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.catalog_works cw WHERE cw.id = catalog_work_id AND auth.role() = 'authenticated'
  ));
CREATE POLICY "Users can insert work contributors for own works"
  ON public.catalog_work_contributors FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.catalog_works cw WHERE cw.id = catalog_work_id AND cw.user_id = auth.uid()
  ));
CREATE POLICY "Users can update work contributors for own works"
  ON public.catalog_work_contributors FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.catalog_works cw WHERE cw.id = catalog_work_id AND cw.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete work contributors for own works"
  ON public.catalog_work_contributors FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.catalog_works cw WHERE cw.id = catalog_work_id AND cw.user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_catalog_works_normalized_title ON public.catalog_works(normalized_title);
CREATE INDEX idx_catalog_works_user_id ON public.catalog_works(user_id);
CREATE INDEX idx_catalog_works_iswc ON public.catalog_works(iswc) WHERE iswc IS NOT NULL;
CREATE INDEX idx_catalog_works_isrc ON public.catalog_works(isrc) WHERE isrc IS NOT NULL;
CREATE INDEX idx_catalog_staging_batch ON public.catalog_import_staging(import_batch_id);
CREATE INDEX idx_catalog_contributors_ipi ON public.catalog_contributors(ipi_number) WHERE ipi_number IS NOT NULL;

-- Updated_at trigger for catalog_works
CREATE TRIGGER update_catalog_works_updated_at
  BEFORE UPDATE ON public.catalog_works
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- promote_staging_batch function
CREATE OR REPLACE FUNCTION public.promote_staging_batch(p_batch_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_work_id UUID;
  v_contributor_id UUID;
  v_writer RECORD;
  v_count INT := 0;
  v_user_id UUID;
BEGIN
  -- Get user_id from batch
  SELECT user_id INTO v_user_id FROM catalog_import_batches WHERE id = p_batch_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;
  -- Verify caller owns the batch
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  FOR v_row IN
    SELECT * FROM catalog_import_staging
    WHERE import_batch_id = p_batch_id
      AND validation_status = 'valid'
      AND promoted = false
  LOOP
    -- Check for existing work by normalized_title + artist
    SELECT id INTO v_work_id FROM catalog_works
    WHERE normalized_title = v_row.normalized_title
      AND user_id = v_user_id
      AND (artist_name = v_row.artist_name OR (artist_name IS NULL AND v_row.artist_name IS NULL))
    LIMIT 1;

    IF v_work_id IS NULL THEN
      INSERT INTO catalog_works (
        user_id, company_id, work_title, normalized_title, iswc, isrc,
        artist_name, source, import_batch_id,
        musicbrainz_id, ascap_work_id, bmi_work_id, mlc_work_id,
        pro_registrations, sync_history, metadata
      ) VALUES (
        v_user_id, v_row.company_id, v_row.work_title, v_row.normalized_title,
        v_row.iswc, v_row.isrc, v_row.artist_name, 'import', p_batch_id,
        (v_row.canonical_row->>'musicbrainz_id'),
        (v_row.canonical_row->>'ascap_work_id'),
        (v_row.canonical_row->>'bmi_work_id'),
        (v_row.canonical_row->>'mlc_work_id'),
        COALESCE(v_row.canonical_row->'pro_registrations', '[]'::jsonb),
        COALESCE(v_row.canonical_row->'sync_history', '[]'::jsonb),
        COALESCE(v_row.canonical_row->'metadata', '{}'::jsonb)
      ) RETURNING id INTO v_work_id;

      -- Insert contributors from writers
      IF v_row.writers IS NOT NULL AND jsonb_array_length(v_row.writers) > 0 THEN
        FOR v_writer IN SELECT * FROM jsonb_to_recordset(v_row.writers) AS x(name text, ipi text, role text, pro text, share numeric)
        LOOP
          -- Upsert contributor
          SELECT id INTO v_contributor_id FROM catalog_contributors
          WHERE user_id = v_user_id AND name = v_writer.name AND role = COALESCE(v_writer.role, 'writer')
          LIMIT 1;

          IF v_contributor_id IS NULL THEN
            INSERT INTO catalog_contributors (user_id, name, ipi_number, pro_affiliation, role)
            VALUES (v_user_id, v_writer.name, v_writer.ipi, v_writer.pro, COALESCE(v_writer.role, 'writer'))
            RETURNING id INTO v_contributor_id;
          END IF;

          INSERT INTO catalog_work_contributors (catalog_work_id, contributor_id, role, ownership_percentage)
          VALUES (v_work_id, v_contributor_id, COALESCE(v_writer.role, 'composer'), v_writer.share);
        END LOOP;
      END IF;

      -- Insert contributors from publishers
      IF v_row.publishers IS NOT NULL AND jsonb_array_length(v_row.publishers) > 0 THEN
        FOR v_writer IN SELECT * FROM jsonb_to_recordset(v_row.publishers) AS x(name text, ipi text, role text, pro text, share numeric)
        LOOP
          SELECT id INTO v_contributor_id FROM catalog_contributors
          WHERE user_id = v_user_id AND name = v_writer.name AND role = 'publisher'
          LIMIT 1;

          IF v_contributor_id IS NULL THEN
            INSERT INTO catalog_contributors (user_id, name, ipi_number, pro_affiliation, role)
            VALUES (v_user_id, v_writer.name, v_writer.ipi, v_writer.pro, 'publisher')
            RETURNING id INTO v_contributor_id;
          END IF;

          INSERT INTO catalog_work_contributors (catalog_work_id, contributor_id, role, ownership_percentage)
          VALUES (v_work_id, v_contributor_id, 'publisher', v_writer.share);
        END LOOP;
      END IF;

      v_count := v_count + 1;
    END IF;

    -- Mark as promoted
    UPDATE catalog_import_staging SET promoted = true WHERE id = v_row.id;
  END LOOP;

  -- Update batch
  UPDATE catalog_import_batches
  SET status = 'committed', valid_rows = v_count
  WHERE id = p_batch_id;

  RETURN v_count;
END;
$$;
