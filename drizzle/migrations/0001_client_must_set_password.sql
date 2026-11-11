ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS must_set_password boolean NOT NULL DEFAULT true;

CREATE OR REPLACE VIEW public.clients_safe WITH (security_invoker = true) AS
  SELECT id, cnpj, company_name, email, user_id, is_active, must_change_password, created_at, updated_at, must_set_password FROM public.clients;

CREATE OR REPLACE FUNCTION public.mark_password_set()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  UPDATE public.clients SET must_set_password = false WHERE user_id = auth.uid();
  RETURN FOUND;
END; $$;
REVOKE EXECUTE ON FUNCTION public.mark_password_set() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_password_set() TO authenticated;