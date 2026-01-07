-- Permitir que usuários autenticados insiram seu próprio role durante registro
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários autenticados vejam seu próprio role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir inserção na tabela admins para registro (temporário, depois da inserção só admins podem modificar)
CREATE POLICY "Authenticated users can register as admin"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que admins possam atualizar dados de outros admins
CREATE POLICY "Admins can update admins"
ON public.admins
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Permitir que admins possam deletar outros admins
CREATE POLICY "Admins can delete admins"
ON public.admins
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));