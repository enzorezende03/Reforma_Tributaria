ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;
ALTER TABLE public.clients ALTER COLUMN password_hash DROP NOT NULL;
COMMENT ON COLUMN public.clients.password_hash IS 'DEPRECATED: clients sign in with email OTP';

DROP VIEW IF EXISTS public.clients_safe;
CREATE VIEW public.clients_safe WITH (security_invoker = true) AS
  SELECT id, cnpj, company_name, email, user_id, is_active, must_change_password, created_at, updated_at FROM public.clients;
GRANT SELECT ON public.clients_safe TO authenticated;

CREATE POLICY "Clients read own record" ON public.clients FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP FUNCTION IF EXISTS public.verify_client_login(text,text);
DROP FUNCTION IF EXISTS public.verify_client_login_by_email(text,text);
DROP FUNCTION IF EXISTS public.reset_client_password_by_cnpj(text,text);
DROP FUNCTION IF EXISTS public.reset_client_password_by_email(text,text);
DROP FUNCTION IF EXISTS public.change_client_password(uuid,text,text);
DROP FUNCTION IF EXISTS public.admin_reset_client_password(uuid,text);
DROP FUNCTION IF EXISTS public.create_password_reset_token(text);
DROP FUNCTION IF EXISTS public.verify_reset_code_and_change_password(text,text,text);
DROP FUNCTION IF EXISTS public.cleanup_expired_reset_tokens();
DROP FUNCTION IF EXISTS public.get_client_by_cnpj_for_sso(text);
DROP FUNCTION IF EXISTS public.get_client_by_email_for_sso(text);
COMMENT ON TABLE public.password_reset_tokens IS 'DEPRECATED: client passwords removed';

CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admins WHERE email = NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  IF EXISTS (SELECT 1 FROM public.clients WHERE lower(email) = lower(NEW.email)) THEN
    UPDATE public.clients SET user_id = NEW.id WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

UPDATE public.clients c SET user_id = u.id FROM auth.users u WHERE c.user_id IS NULL AND c.email IS NOT NULL AND lower(u.email) = lower(c.email);
INSERT INTO public.user_roles (user_id, role) SELECT user_id, 'user' FROM public.clients WHERE user_id IS NOT NULL ON CONFLICT (user_id, role) DO NOTHING;