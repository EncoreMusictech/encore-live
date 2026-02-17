
INSERT INTO public.company_module_access (company_id, module_id, enabled)
VALUES ('19af11f1-5f9a-468d-9d41-88172fc969a2', 'catalog-management', true)
ON CONFLICT DO NOTHING;
