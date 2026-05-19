CREATE OR REPLACE FUNCTION public.get_client_by_cnpj_for_sso(p_cnpj text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  SELECT id, cnpj, company_name, must_change_password, is_active
  INTO v_client
  FROM public.clients
  WHERE cnpj = regexp_replace(p_cnpj, '\D', '', 'g');

  IF v_client IS NULL OR NOT v_client.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Cliente não encontrado ou inativo');
  END IF;

  RETURN json_build_object(
    'success', true,
    'client', json_build_object(
      'id', v_client.id,
      'cnpj', v_client.cnpj,
      'company_name', v_client.company_name,
      'must_change_password', v_client.must_change_password
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_by_cnpj_for_sso(text) TO authenticated;