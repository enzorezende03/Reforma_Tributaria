-- Recriar view admins_safe com security_invoker = true para usar RLS do usuário que consulta
DROP VIEW IF EXISTS public.admins_safe;
CREATE VIEW public.admins_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  email,
  name,
  is_active,
  must_change_password,
  permissions,
  created_at
FROM public.admins;

-- Adicionar política para admins verem todos os outros admins/colaboradores
-- (necessário para o painel de gerenciamento de equipe)
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
CREATE POLICY "Admins can view all admins"
ON public.admins
FOR SELECT
USING (has_role(auth.uid(), 'admin'));