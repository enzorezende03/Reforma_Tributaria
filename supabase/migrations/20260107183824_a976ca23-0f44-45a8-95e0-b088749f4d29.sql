-- Remover política permissiva de registro de admin
DROP POLICY IF EXISTS "Authenticated users can register as admin" ON public.admins;

-- Criar política mais restrita: apenas o primeiro admin pode ser criado (quando tabela está vazia)
-- ou admins existentes podem adicionar outros
CREATE OR REPLACE FUNCTION public.can_register_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Permitir se não existem admins ainda (primeiro registro)
    NOT EXISTS (SELECT 1 FROM public.admins LIMIT 1)
    OR 
    -- Ou se o usuário atual já é admin
    public.has_role(auth.uid(), 'admin')
$$;

CREATE POLICY "First admin or existing admins can create admins"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (public.can_register_admin());

-- Remover política pública de leitura de clients e criar uma mais segura
DROP POLICY IF EXISTS "Allow public read for login verification" ON public.clients;

-- Criar função para verificar login de cliente (sem expor dados)
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
  SELECT id, cnpj, company_name, password_hash, is_active
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
  
  -- Verificar senha
  IF v_client.password_hash != p_password THEN
    RETURN json_build_object('success', false, 'error', 'Senha incorreta');
  END IF;
  
  -- Login bem sucedido
  RETURN json_build_object(
    'success', true,
    'client', json_build_object(
      'id', v_client.id,
      'cnpj', v_client.cnpj,
      'company_name', v_client.company_name
    )
  );
END;
$$;

-- Política restrita para clients: apenas admins podem ver
CREATE POLICY "Only admins can read clients"
ON public.clients
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));