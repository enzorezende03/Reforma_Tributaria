-- Trigger para criar role de admin automaticamente quando um usuário é criado via auth.users
-- e possui um convite de admin válido

CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se existe um admin com o mesmo email
  IF EXISTS (SELECT 1 FROM public.admins WHERE email = NEW.email) THEN
    -- Adiciona a role de admin se ainda não existir
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger que dispara após inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_add_admin_role ON auth.users;
CREATE TRIGGER on_auth_user_created_add_admin_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();