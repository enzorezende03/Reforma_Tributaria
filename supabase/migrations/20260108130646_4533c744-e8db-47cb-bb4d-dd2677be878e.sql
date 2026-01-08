-- 1. Criar tabela de convites para administradores
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  used BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca por token
CREATE INDEX idx_admin_invites_token ON public.admin_invites(token);
CREATE INDEX idx_admin_invites_email ON public.admin_invites(email);

-- Habilitar RLS
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver convites
CREATE POLICY "Admins can view invites"
ON public.admin_invites FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política: Apenas admins podem criar convites
CREATE POLICY "Admins can create invites"
ON public.admin_invites FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política: Apenas admins podem deletar convites
CREATE POLICY "Admins can delete invites"
ON public.admin_invites FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política: Permitir atualizar para marcar como usado (via token válido)
CREATE POLICY "Anyone can use valid invite"
ON public.admin_invites FOR UPDATE TO authenticated
USING (
  token IS NOT NULL 
  AND used = false 
  AND expires_at > now()
)
WITH CHECK (used = true);

-- 2. Remover política antiga que permite auto-atribuição de roles
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- 3. Criar nova política: apenas admins podem atribuir roles OU primeiro usuário quando não existem admins
CREATE POLICY "Admins can insert roles or first admin bootstrap"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
);

-- 4. Adicionar políticas de UPDATE e DELETE para user_roles (defesa em profundidade)
CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Função para validar convite
CREATE OR REPLACE FUNCTION public.validate_admin_invite(p_token TEXT, p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT id, email, expires_at, used
  INTO v_invite
  FROM public.admin_invites
  WHERE token = p_token AND used = false;
  
  IF v_invite IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Convite inválido ou já utilizado');
  END IF;
  
  IF v_invite.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Convite expirado');
  END IF;
  
  IF lower(v_invite.email) != lower(p_email) THEN
    RETURN json_build_object('valid', false, 'error', 'Email não corresponde ao convite');
  END IF;
  
  RETURN json_build_object('valid', true, 'invite_id', v_invite.id);
END;
$$;

-- 6. Função para marcar convite como usado
CREATE OR REPLACE FUNCTION public.use_admin_invite(p_invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_invites
  SET used = true
  WHERE id = p_invite_id AND used = false;
  
  RETURN FOUND;
END;
$$;