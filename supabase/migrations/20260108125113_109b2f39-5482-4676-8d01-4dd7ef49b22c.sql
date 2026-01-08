-- Adicionar campo para controlar troca de senha obrigatória
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

-- Criar view segura que exclui password_hash para consultas normais
CREATE OR REPLACE VIEW public.admins_safe AS
SELECT 
  id,
  email,
  name,
  is_active,
  must_change_password,
  created_at
FROM public.admins;

-- Conceder permissões na view
GRANT SELECT ON public.admins_safe TO authenticated;

-- Atualizar política para usar a view em vez da tabela direta quando possível
-- A política existente continua, mas agora temos a view para consultas seguras

-- Marcar admins existentes como precisando trocar senha (exceto quem acabou de criar)
UPDATE public.admins SET must_change_password = true WHERE must_change_password IS NULL;