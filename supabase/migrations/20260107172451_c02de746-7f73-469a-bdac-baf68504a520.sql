-- Tabela de administradores
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Política para permitir verificação de login (leitura pública para autenticação)
CREATE POLICY "Allow public read for admin login verification" 
ON public.admins 
FOR SELECT 
USING (true);

-- Criar índice no email para buscas rápidas
CREATE INDEX idx_admins_email ON public.admins (email);

-- Adicionar políticas de INSERT, UPDATE, DELETE para clients (apenas via admin)
-- Nota: Como não temos auth.uid() do Supabase Auth, permitimos operações públicas
-- Em produção, use Edge Functions com autenticação
CREATE POLICY "Allow public insert for clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for clients" 
ON public.clients 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete for clients" 
ON public.clients 
FOR DELETE 
USING (true);