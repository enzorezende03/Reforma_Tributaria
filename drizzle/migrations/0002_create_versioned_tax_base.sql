CREATE TABLE public.tax_base_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  versao text NOT NULL UNIQUE,
  data_vigencia date NOT NULL,
  fonte text NOT NULL,
  observacao text,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicada', 'arquivada')),
  publicado_em timestamptz,
  publicado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_base_versions TO authenticated;
GRANT ALL ON public.tax_base_versions TO service_role;

CREATE TABLE public.tax_cst_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.tax_base_versions(id) ON DELETE CASCADE,
  cst_code text NOT NULL,
  cst_description text NOT NULL,
  cclass_trib text NOT NULL,
  cclass_trib_name text NOT NULL,
  cclass_trib_description text NOT NULL,
  lc_article text NOT NULL DEFAULT '',
  aliquota_type text NOT NULL DEFAULT '',
  p_red_ibs numeric(5,2) NOT NULL DEFAULT 0,
  p_red_cbs numeric(5,2) NOT NULL DEFAULT 0,
  d_ini_vig text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  ncm_codes text[] NOT NULL DEFAULT '{}',
  requisitos_legais jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id, cclass_trib)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_cst_records TO authenticated;
GRANT ALL ON public.tax_cst_records TO service_role;

CREATE TABLE public.tax_ncm_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.tax_base_versions(id) ON DELETE CASCADE,
  ncm text NOT NULL,
  cclass_trib text NOT NULL,
  description text NOT NULL,
  anexo text NOT NULL DEFAULT '',
  UNIQUE (version_id, ncm)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_ncm_mappings TO authenticated;
GRANT ALL ON public.tax_ncm_mappings TO service_role;

CREATE TABLE public.tax_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.tax_base_versions(id) ON DELETE CASCADE,
  anexo_key text NOT NULL,
  numero text NOT NULL,
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  reducao text NOT NULL DEFAULT '',
  artigo text NOT NULL DEFAULT '',
  UNIQUE (version_id, anexo_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_anexos TO authenticated;
GRANT ALL ON public.tax_anexos TO service_role;

CREATE TABLE public.tax_anexo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anexo_id uuid NOT NULL REFERENCES public.tax_anexos(id) ON DELETE CASCADE,
  item text NOT NULL,
  produto text NOT NULL,
  ncm text NOT NULL DEFAULT '',
  observacao text,
  ordem integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_anexo_items TO authenticated;
GRANT ALL ON public.tax_anexo_items TO service_role;

CREATE TABLE public.tax_indop_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.tax_base_versions(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  artigo text NOT NULL DEFAULT '',
  tipo_operacao text NOT NULL,
  local_operacao text NOT NULL DEFAULT '',
  caracteristica_fornecimento text NOT NULL DEFAULT '',
  local_fornecimento_dfe text NOT NULL DEFAULT '',
  UNIQUE (version_id, codigo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_indop_records TO authenticated;
GRANT ALL ON public.tax_indop_records TO service_role;

CREATE TABLE public.tax_indop_service_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.tax_base_versions(id) ON DELETE CASCADE,
  termo text NOT NULL,
  codigos text[] NOT NULL DEFAULT '{}',
  UNIQUE (version_id, termo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_indop_service_mappings TO authenticated;
GRANT ALL ON public.tax_indop_service_mappings TO service_role;

CREATE UNIQUE INDEX tax_base_single_published_idx ON public.tax_base_versions (status) WHERE status = 'publicada';
CREATE INDEX tax_cst_records_version_idx ON public.tax_cst_records (version_id);
CREATE INDEX tax_ncm_mappings_version_idx ON public.tax_ncm_mappings (version_id);
CREATE INDEX tax_anexos_version_idx ON public.tax_anexos (version_id);
CREATE INDEX tax_indop_records_version_idx ON public.tax_indop_records (version_id);

CREATE OR REPLACE FUNCTION public.can_read_tax_base()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.user_id = auth.uid() AND c.is_active = true
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_tax_base()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin') AND EXISTS (
    SELECT 1 FROM public.admins a
    WHERE lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      AND a.is_active = true
      AND COALESCE(a.permissions, '{}'::text[]) @> ARRAY['manage_tax_base']::text[]
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_tax_base() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_tax_base() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_tax_base() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_tax_base() TO authenticated;

ALTER TABLE public.tax_base_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_cst_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_ncm_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_anexo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_indop_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_indop_service_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes e admins leem base tributaria" ON public.tax_base_versions
FOR SELECT TO authenticated USING (
  (status = 'publicada' AND public.can_read_tax_base()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Gestores criam rascunhos da base" ON public.tax_base_versions
FOR INSERT TO authenticated WITH CHECK (public.can_manage_tax_base() AND status = 'rascunho' AND publicado_em IS NULL);
CREATE POLICY "Gestores editam rascunhos da base" ON public.tax_base_versions
FOR UPDATE TO authenticated USING (public.can_manage_tax_base() AND status = 'rascunho') WITH CHECK (public.can_manage_tax_base() AND status = 'rascunho');
CREATE POLICY "Gestores excluem rascunhos da base" ON public.tax_base_versions
FOR DELETE TO authenticated USING (public.can_manage_tax_base() AND status = 'rascunho');

CREATE POLICY "Leitura dos CSTs da base" ON public.tax_cst_records FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND ((v.status = 'publicada' AND public.can_read_tax_base()) OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Gestores inserem CSTs em rascunho" ON public.tax_cst_records FOR INSERT TO authenticated WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores editam CSTs em rascunho" ON public.tax_cst_records FOR UPDATE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
) WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores excluem CSTs em rascunho" ON public.tax_cst_records FOR DELETE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);

CREATE POLICY "Leitura dos NCMs da base" ON public.tax_ncm_mappings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND ((v.status = 'publicada' AND public.can_read_tax_base()) OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Gestores inserem NCMs em rascunho" ON public.tax_ncm_mappings FOR INSERT TO authenticated WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores editam NCMs em rascunho" ON public.tax_ncm_mappings FOR UPDATE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
) WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores excluem NCMs em rascunho" ON public.tax_ncm_mappings FOR DELETE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);

CREATE POLICY "Leitura dos anexos da base" ON public.tax_anexos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND ((v.status = 'publicada' AND public.can_read_tax_base()) OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Gestores inserem anexos em rascunho" ON public.tax_anexos FOR INSERT TO authenticated WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores editam anexos em rascunho" ON public.tax_anexos FOR UPDATE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
) WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores excluem anexos em rascunho" ON public.tax_anexos FOR DELETE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);

CREATE POLICY "Leitura dos itens de anexos" ON public.tax_anexo_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tax_anexos a JOIN public.tax_base_versions v ON v.id = a.version_id WHERE a.id = anexo_id AND ((v.status = 'publicada' AND public.can_read_tax_base()) OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Gestores inserem itens de anexos" ON public.tax_anexo_items FOR INSERT TO authenticated WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_anexos a JOIN public.tax_base_versions v ON v.id = a.version_id WHERE a.id = anexo_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores editam itens de anexos" ON public.tax_anexo_items FOR UPDATE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_anexos a JOIN public.tax_base_versions v ON v.id = a.version_id WHERE a.id = anexo_id AND v.status = 'rascunho')
) WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_anexos a JOIN public.tax_base_versions v ON v.id = a.version_id WHERE a.id = anexo_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores excluem itens de anexos" ON public.tax_anexo_items FOR DELETE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_anexos a JOIN public.tax_base_versions v ON v.id = a.version_id WHERE a.id = anexo_id AND v.status = 'rascunho')
);

CREATE POLICY "Leitura dos indicadores da base" ON public.tax_indop_records FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND ((v.status = 'publicada' AND public.can_read_tax_base()) OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Gestores inserem indicadores em rascunho" ON public.tax_indop_records FOR INSERT TO authenticated WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores editam indicadores em rascunho" ON public.tax_indop_records FOR UPDATE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
) WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores excluem indicadores em rascunho" ON public.tax_indop_records FOR DELETE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);

CREATE POLICY "Leitura dos mapeamentos de servicos" ON public.tax_indop_service_mappings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND ((v.status = 'publicada' AND public.can_read_tax_base()) OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Gestores inserem mapeamentos em rascunho" ON public.tax_indop_service_mappings FOR INSERT TO authenticated WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores editam mapeamentos em rascunho" ON public.tax_indop_service_mappings FOR UPDATE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
) WITH CHECK (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);
CREATE POLICY "Gestores excluem mapeamentos em rascunho" ON public.tax_indop_service_mappings FOR DELETE TO authenticated USING (
  public.can_manage_tax_base() AND EXISTS (SELECT 1 FROM public.tax_base_versions v WHERE v.id = version_id AND v.status = 'rascunho')
);

CREATE OR REPLACE FUNCTION public.create_tax_base_draft(
  p_versao text,
  p_data_vigencia date,
  p_fonte text,
  p_observacao text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_id uuid;
  v_draft_id uuid;
BEGIN
  IF NOT public.can_manage_tax_base() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF length(trim(p_versao)) = 0 OR length(trim(p_fonte)) = 0 THEN RAISE EXCEPTION 'Versão e fonte são obrigatórias'; END IF;
  SELECT id INTO v_source_id FROM public.tax_base_versions WHERE status = 'publicada' LIMIT 1;
  IF v_source_id IS NULL THEN RAISE EXCEPTION 'Nenhuma versão publicada encontrada'; END IF;

  INSERT INTO public.tax_base_versions (versao, data_vigencia, fonte, observacao)
  VALUES (trim(p_versao), p_data_vigencia, trim(p_fonte), nullif(trim(p_observacao), ''))
  RETURNING id INTO v_draft_id;

  INSERT INTO public.tax_cst_records (version_id, cst_code, cst_description, cclass_trib, cclass_trib_name, cclass_trib_description, lc_article, aliquota_type, p_red_ibs, p_red_cbs, d_ini_vig, link, ncm_codes, requisitos_legais)
  SELECT v_draft_id, cst_code, cst_description, cclass_trib, cclass_trib_name, cclass_trib_description, lc_article, aliquota_type, p_red_ibs, p_red_cbs, d_ini_vig, link, ncm_codes, requisitos_legais FROM public.tax_cst_records WHERE version_id = v_source_id;

  INSERT INTO public.tax_ncm_mappings (version_id, ncm, cclass_trib, description, anexo)
  SELECT v_draft_id, ncm, cclass_trib, description, anexo FROM public.tax_ncm_mappings WHERE version_id = v_source_id;

  INSERT INTO public.tax_anexos (version_id, anexo_key, numero, titulo, descricao, reducao, artigo)
  SELECT v_draft_id, anexo_key, numero, titulo, descricao, reducao, artigo FROM public.tax_anexos WHERE version_id = v_source_id;

  INSERT INTO public.tax_anexo_items (anexo_id, item, produto, ncm, observacao, ordem)
  SELECT na.id, i.item, i.produto, i.ncm, i.observacao, i.ordem
  FROM public.tax_anexo_items i
  JOIN public.tax_anexos oa ON oa.id = i.anexo_id
  JOIN public.tax_anexos na ON na.version_id = v_draft_id AND na.anexo_key = oa.anexo_key
  WHERE oa.version_id = v_source_id;

  INSERT INTO public.tax_indop_records (version_id, codigo, artigo, tipo_operacao, local_operacao, caracteristica_fornecimento, local_fornecimento_dfe)
  SELECT v_draft_id, codigo, artigo, tipo_operacao, local_operacao, caracteristica_fornecimento, local_fornecimento_dfe FROM public.tax_indop_records WHERE version_id = v_source_id;

  INSERT INTO public.tax_indop_service_mappings (version_id, termo, codigos)
  SELECT v_draft_id, termo, codigos FROM public.tax_indop_service_mappings WHERE version_id = v_source_id;

  RETURN v_draft_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_tax_base_version(p_version_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_manage_tax_base() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tax_base_versions WHERE id = p_version_id AND status = 'rascunho') THEN RAISE EXCEPTION 'Rascunho não encontrado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tax_cst_records WHERE version_id = p_version_id) THEN RAISE EXCEPTION 'A versão precisa ter ao menos um registro cClassTrib'; END IF;
  UPDATE public.tax_base_versions SET status = 'arquivada' WHERE status = 'publicada';
  UPDATE public.tax_base_versions SET status = 'publicada', publicado_em = now(), publicado_por = auth.uid() WHERE id = p_version_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_tax_base_draft(text, date, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_tax_base_version(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_tax_base_draft(text, date, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_tax_base_version(uuid) TO authenticated;

CREATE TRIGGER update_tax_cst_records_updated_at BEFORE UPDATE ON public.tax_cst_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();