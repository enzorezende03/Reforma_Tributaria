-- Adicionar coluna must_change_password na tabela clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

-- Criar função para hash de senha usando extensions.crypt e extensions.gen_salt
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT extensions.crypt(password, extensions.gen_salt('bf', 10));
$$;

-- Atualizar função verify_client_login para verificar hash e retornar must_change_password
CREATE OR REPLACE FUNCTION public.verify_client_login(p_cnpj TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
BEGIN
  -- Buscar cliente pelo CNPJ
  SELECT id, cnpj, company_name, password_hash, is_active, must_change_password
  INTO v_client
  FROM public.clients
  WHERE cnpj = p_cnpj;
  
  -- Se não encontrou
  IF v_client IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'CNPJ não encontrado');
  END IF;
  
  -- Se conta inativa
  IF NOT v_client.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Conta desativada');
  END IF;
  
  -- Verificar senha com bcrypt
  IF NOT extensions.crypt(p_password, v_client.password_hash) = v_client.password_hash THEN
    RETURN json_build_object('success', false, 'error', 'Senha incorreta');
  END IF;
  
  -- Login bem sucedido
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

-- Criar função para cliente alterar sua própria senha
CREATE OR REPLACE FUNCTION public.change_client_password(p_client_id UUID, p_current_password TEXT, p_new_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
BEGIN
  -- Buscar cliente
  SELECT id, password_hash
  INTO v_client
  FROM public.clients
  WHERE id = p_client_id;
  
  IF v_client IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Cliente não encontrado');
  END IF;
  
  -- Verificar senha atual
  IF NOT extensions.crypt(p_current_password, v_client.password_hash) = v_client.password_hash THEN
    RETURN json_build_object('success', false, 'error', 'Senha atual incorreta');
  END IF;
  
  -- Atualizar senha com hash
  UPDATE public.clients
  SET 
    password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
    must_change_password = false
  WHERE id = p_client_id;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Criar função para admin resetar senha do cliente
CREATE OR REPLACE FUNCTION public.admin_reset_client_password(p_client_id UUID, p_new_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  
  -- Atualizar senha com hash e forçar troca no próximo login
  UPDATE public.clients
  SET 
    password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
    must_change_password = true
  WHERE id = p_client_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cliente não encontrado');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Atualizar senhas existentes para hash (IMPORTANTE: todos devem trocar senha)
UPDATE public.clients
SET 
  password_hash = extensions.crypt(password_hash, extensions.gen_salt('bf', 10)),
  must_change_password = true
WHERE password_hash NOT LIKE '$2%';