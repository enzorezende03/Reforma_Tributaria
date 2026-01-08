-- Recriar a view sem SECURITY DEFINER (usar SECURITY INVOKER que é o padrão)
DROP VIEW IF EXISTS public.admins_safe;

CREATE VIEW public.admins_safe 
WITH (security_invoker = true) AS
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