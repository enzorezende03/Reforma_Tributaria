-- Criar tabela para tokens de reset de senha de clientes
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  used BOOLEAN NOT NULL DEFAULT false
);

-- Índices para performance
CREATE INDEX idx_password_reset_tokens_client_id ON public.password_reset_tokens(client_id);
CREATE INDEX idx_password_reset_tokens_code ON public.password_reset_tokens(code);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Habilitar RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção via função (sem autenticação necessária)
CREATE POLICY "Allow service role full access"
ON public.password_reset_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Função para criar token de reset
CREATE OR REPLACE FUNCTION public.create_password_reset_token(p_cnpj TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client RECORD;
  v_code TEXT;
  v_existing_token RECORD;
BEGIN
  -- Buscar cliente pelo CNPJ
  SELECT id, cnpj, company_name
  INTO v_client
  FROM public.clients
  WHERE cnpj = p_cnpj AND is_active = true;
  
  IF v_client IS NULL THEN
    -- Retornar sucesso mesmo se não encontrar (segurança)
    RETURN json_build_object('success', true, 'message', 'Se o CNPJ estiver cadastrado, você receberá um código por email.');
  END IF;
  
  -- Verificar se já existe um token válido recente (evitar spam)
  SELECT id INTO v_existing_token
  FROM public.password_reset_tokens
  WHERE client_id = v_client.id
    AND used = false
    AND expires_at > now()
    AND created_at > now() - interval '2 minutes';
  
  IF v_existing_token IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Aguarde 2 minutos antes de solicitar um novo código.');
  END IF;
  
  -- Gerar código de 6 dígitos
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');
  
  -- Invalidar tokens anteriores do mesmo cliente
  UPDATE public.password_reset_tokens
  SET used = true
  WHERE client_id = v_client.id AND used = false;
  
  -- Criar novo token
  INSERT INTO public.password_reset_tokens (client_id, code)
  VALUES (v_client.id, v_code);
  
  -- Retornar dados para envio do email
  RETURN json_build_object(
    'success', true,
    'client_id', v_client.id,
    'code', v_code,
    'company_name', v_client.company_name
  );
END;
$$;

-- Função para verificar código e redefinir senha
CREATE OR REPLACE FUNCTION public.verify_reset_code_and_change_password(p_cnpj TEXT, p_code TEXT, p_new_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client RECORD;
  v_token RECORD;
BEGIN
  -- Buscar cliente pelo CNPJ
  SELECT id
  INTO v_client
  FROM public.clients
  WHERE cnpj = p_cnpj AND is_active = true;
  
  IF v_client IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'CNPJ não encontrado');
  END IF;
  
  -- Buscar token válido
  SELECT id
  INTO v_token
  FROM public.password_reset_tokens
  WHERE client_id = v_client.id
    AND code = p_code
    AND used = false
    AND expires_at > now();
  
  IF v_token IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Código inválido ou expirado');
  END IF;
  
  -- Marcar token como usado
  UPDATE public.password_reset_tokens
  SET used = true
  WHERE id = v_token.id;
  
  -- Atualizar senha
  UPDATE public.clients
  SET 
    password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
    must_change_password = false
  WHERE id = v_client.id;
  
  RETURN json_build_object('success', true, 'message', 'Senha redefinida com sucesso');
END;
$$;

-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() - interval '1 day';
END;
$$;