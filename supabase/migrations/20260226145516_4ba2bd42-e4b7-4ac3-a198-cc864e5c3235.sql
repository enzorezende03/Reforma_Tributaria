-- Create clients_safe view excluding password_hash
CREATE OR REPLACE VIEW public.clients_safe WITH (security_invoker = true) AS
SELECT id, cnpj, company_name, is_active, must_change_password, created_at, updated_at
FROM public.clients;