-- Criar função RPC segura para criar convites de admin
-- O token nunca é exposto ao cliente, apenas o link final
CREATE OR REPLACE FUNCTION public.create_admin_invite(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_existing_invite RECORD;
  v_existing_admin RECORD;
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  -- Verificar se já existe um convite pendente para este email
  SELECT id INTO v_existing_invite
  FROM public.admin_invites
  WHERE email = lower(p_email)
    AND used = false
    AND expires_at > now();
  
  IF v_existing_invite IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Já existe um convite pendente para este email');
  END IF;

  -- Verificar se já é admin
  SELECT id INTO v_existing_admin
  FROM public.admins
  WHERE email = lower(p_email);
  
  IF v_existing_admin IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Este email já pertence a um administrador');
  END IF;

  -- Gerar token seguro
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  
  -- Inserir convite
  INSERT INTO public.admin_invites (email, token, created_by)
  VALUES (lower(trim(p_email)), v_token, auth.uid());
  
  -- Retornar apenas o token (o cliente constrói o link)
  RETURN json_build_object(
    'success', true,
    'token', v_token
  );
END;
$$;

-- Atualizar política de SELECT para negar acesso direto à tabela
-- Admins devem usar a view admin_invites_safe para listar convites
DROP POLICY IF EXISTS "Admins can only view invites they created" ON public.admin_invites;

CREATE POLICY "No direct SELECT on admin_invites"
ON public.admin_invites FOR SELECT
USING (false);