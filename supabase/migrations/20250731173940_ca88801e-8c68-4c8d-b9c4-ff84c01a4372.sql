-- Fix RLS policies for invoice_templates table
DROP POLICY IF EXISTS "Users can manage their own invoice templates" ON public.invoice_templates;

CREATE POLICY "Users can manage their own invoice templates" 
ON public.invoice_templates
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure the user_id is set automatically
CREATE OR REPLACE FUNCTION public.set_user_id_for_invoice_templates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_user_id_trigger_invoice_templates
    BEFORE INSERT ON public.invoice_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_id_for_invoice_templates();