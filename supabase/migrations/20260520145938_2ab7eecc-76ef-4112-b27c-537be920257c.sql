
-- 1. Adicionar coluna email
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique_idx
  ON public.clients (lower(email)) WHERE email IS NOT NULL;

-- 2. Email do cliente existente
UPDATE public.clients
SET email = 'adm2m@2mgrupo.com.br'
WHERE cnpj = '08633136000140' AND email IS NULL;

-- 3. Login por email (mesmo rate limit/lockout do CNPJ)
CREATE OR REPLACE FUNCTION public.verify_client_login_by_email(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
  v_recent_failures INT;
  v_hourly_failures INT;
  v_id TEXT := lower(trim(p_email));
BEGIN
  SELECT COUNT(*) INTO v_recent_failures
  FROM public.login_attempts
  WHERE identifier = v_id
    AND success = false
    AND attempt_time > now() - interval '15 minutes';
  IF v_recent_failures >= 5 THEN
    RETURN json_build_object('success', false,
      'error', 'Conta temporariamente bloqueada. Tente novamente em 15 minutos.');
  END IF;

  SELECT COUNT(*) INTO v_hourly_failures
  FROM public.login_attempts
  WHERE identifier = v_id
    AND success = false
    AND attempt_time > now() - interval '1 hour';
  IF v_hourly_failures >= 10 THEN
    RETURN json_build_object('success', false,
      'error', 'Conta bloqueada por múltiplas tentativas. Entre em contato com o suporte.');
  END IF;

  SELECT id, cnpj, company_name, email, password_hash, is_active, must_change_password
  INTO v_client
  FROM public.clients
  WHERE lower(email) = v_id;

  IF v_client IS NULL THEN
    INSERT INTO public.login_attempts (identifier, success) VALUES (v_id, false);
    RETURN json_build_object('success', false, 'error', 'Email não encontrado');
  END IF;

  IF NOT v_client.is_active THEN
    INSERT INTO public.login_attempts (identifier, success) VALUES (v_id, false);
    RETURN json_build_object('success', false, 'error', 'Conta desativada');
  END IF;

  IF NOT extensions.crypt(p_password, v_client.password_hash) = v_client.password_hash THEN
    INSERT INTO public.login_attempts (identifier, success) VALUES (v_id, false);
    RETURN json_build_object('success', false, 'error', 'Senha incorreta');
  END IF;

  INSERT INTO public.login_attempts (identifier, success) VALUES (v_id, true);

  RETURN json_build_object(
    'success', true,
    'client', json_build_object(
      'id', v_client.id,
      'cnpj', v_client.cnpj,
      'company_name', v_client.company_name,
      'email', v_client.email,
      'must_change_password', v_client.must_change_password
    )
  );
END;
$$;

-- 4. Reset de senha por email
CREATE OR REPLACE FUNCTION public.reset_client_password_by_email(p_email text, p_new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id
  FROM public.clients
  WHERE lower(email) = lower(trim(p_email)) AND is_active = true;

  IF v_client_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Email não encontrado ou conta inativa');
  END IF;

  UPDATE public.clients
  SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      must_change_password = false,
      updated_at = now()
  WHERE id = v_client_id;

  RETURN json_build_object('success', true, 'message', 'Senha redefinida com sucesso');
END;
$$;

-- 5. Lookup por email para fluxo de SSO (autenticado)
CREATE OR REPLACE FUNCTION public.get_client_by_email_for_sso(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  SELECT id, cnpj, company_name, email, must_change_password, is_active
  INTO v_client
  FROM public.clients
  WHERE lower(email) = lower(trim(p_email));

  IF v_client IS NULL OR NOT v_client.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Cliente não encontrado ou inativo');
  END IF;

  RETURN json_build_object(
    'success', true,
    'client', json_build_object(
      'id', v_client.id,
      'cnpj', v_client.cnpj,
      'company_name', v_client.company_name,
      'email', v_client.email,
      'must_change_password', v_client.must_change_password
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_client_login_by_email(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_client_password_by_email(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_by_email_for_sso(text) TO authenticated;
