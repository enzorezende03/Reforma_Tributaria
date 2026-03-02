
CREATE OR REPLACE FUNCTION public.reset_client_password_by_cnpj(
  p_cnpj TEXT,
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_company_name TEXT;
BEGIN
  -- Find client by CNPJ
  SELECT id, company_name INTO v_client_id, v_company_name
  FROM public.clients
  WHERE cnpj = p_cnpj AND is_active = true;

  IF v_client_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'CNPJ não encontrado ou conta inativa');
  END IF;

  -- Update password
  UPDATE public.clients
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      must_change_password = false,
      updated_at = now()
  WHERE id = v_client_id;

  RETURN json_build_object('success', true, 'message', 'Senha redefinida com sucesso');
END;
$$;
