-- Remove políticas públicas inseguras da tabela clients
DROP POLICY IF EXISTS "Allow public delete for clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert for clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public update for clients" ON public.clients;

-- Criar tabela de roles para admins usando Supabase Auth
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Política para user_roles: apenas admins podem ver roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Novas políticas seguras para tabela clients
-- SELECT: público para login (mantém funcionamento atual)
-- INSERT, UPDATE, DELETE: apenas admins autenticados

CREATE POLICY "Admins can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Remover política pública insegura de admins e adicionar seguras
DROP POLICY IF EXISTS "Allow public read for admin login verification" ON public.admins;

-- Admins só podem ver seus próprios dados (para login via função segura)
CREATE POLICY "Admins can view own data"
ON public.admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN auth.users u ON ur.user_id = u.id 
    WHERE ur.role = 'admin' AND u.email = admins.email
  )
);