-- Adicionar coluna de permissões à tabela admins (para colaboradores com permissões restritas)
-- Permissões: view_clients, manage_clients, view_news, manage_news, manage_team
ALTER TABLE public.admins 
ADD COLUMN permissions text[] DEFAULT '{}'::text[];

-- Admins completos têm todas as permissões
-- Colaboradores têm permissões específicas definidas no cadastro

-- Atualizar admins existentes para terem permissões completas
UPDATE public.admins 
SET permissions = ARRAY['view_clients', 'manage_clients', 'view_news', 'manage_news', 'manage_team']
WHERE permissions = '{}' OR permissions IS NULL;

-- Atualizar view admins_safe para incluir permissões
DROP VIEW IF EXISTS public.admins_safe;
CREATE VIEW public.admins_safe AS
SELECT 
  id,
  email,
  name,
  is_active,
  must_change_password,
  permissions,
  created_at
FROM public.admins;