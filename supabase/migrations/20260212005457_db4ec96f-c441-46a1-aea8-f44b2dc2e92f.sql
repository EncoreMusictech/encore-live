CREATE POLICY "Users can delete own import batches"
ON public.catalog_import_batches
FOR DELETE
USING (auth.uid() = user_id);