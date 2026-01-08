-- Create login attempts tracking table for rate limiting
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  attempt_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for efficient querying
CREATE INDEX idx_login_attempts_identifier_time ON public.login_attempts(identifier, attempt_time DESC);
CREATE INDEX idx_login_attempts_cleanup ON public.login_attempts(attempt_time) WHERE success = false;

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow system (through RPC) to manage attempts - no direct access
CREATE POLICY "No direct access to login attempts"
ON public.login_attempts
FOR ALL
USING (false);

-- Update verify_client_login function with rate limiting
CREATE OR REPLACE FUNCTION public.verify_client_login(p_cnpj TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
  v_recent_failures INT;
  v_hourly_failures INT;
BEGIN
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*) INTO v_recent_failures
  FROM public.login_attempts
  WHERE identifier = p_cnpj
    AND success = false
    AND attempt_time > now() - interval '15 minutes';
  
  -- Temporary lockout after 5 failures in 15 minutes
  IF v_recent_failures >= 5 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Conta temporariamente bloqueada. Tente novamente em 15 minutos.'
    );
  END IF;
  
  -- Count total failed attempts in last hour
  SELECT COUNT(*) INTO v_hourly_failures
  FROM public.login_attempts
  WHERE identifier = p_cnpj
    AND success = false
    AND attempt_time > now() - interval '1 hour';
  
  -- Extended lockout after 10 failures in 1 hour
  IF v_hourly_failures >= 10 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Conta bloqueada por múltiplas tentativas. Entre em contato com o suporte.'
    );
  END IF;
  
  -- Fetch client
  SELECT id, cnpj, company_name, password_hash, is_active, must_change_password
  INTO v_client
  FROM public.clients
  WHERE cnpj = p_cnpj;
  
  -- If not found
  IF v_client IS NULL THEN
    INSERT INTO public.login_attempts (identifier, success) VALUES (p_cnpj, false);
    RETURN json_build_object('success', false, 'error', 'CNPJ não encontrado');
  END IF;
  
  -- If account inactive
  IF NOT v_client.is_active THEN
    INSERT INTO public.login_attempts (identifier, success) VALUES (p_cnpj, false);
    RETURN json_build_object('success', false, 'error', 'Conta desativada');
  END IF;
  
  -- Verify password with bcrypt
  IF NOT extensions.crypt(p_password, v_client.password_hash) = v_client.password_hash THEN
    INSERT INTO public.login_attempts (identifier, success) VALUES (p_cnpj, false);
    RETURN json_build_object('success', false, 'error', 'Senha incorreta');
  END IF;
  
  -- Success - log and return
  INSERT INTO public.login_attempts (identifier, success) VALUES (p_cnpj, true);
  
  RETURN json_build_object(
    'success', true,
    'client', json_build_object(
      'id', v_client.id,
      'cnpj', v_client.cnpj,
      'company_name', v_client.company_name,
      'must_change_password', v_client.must_change_password
    )
  );
END;
$$;

-- Cleanup function for old login attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE attempt_time < now() - interval '7 days';
END;
$$;