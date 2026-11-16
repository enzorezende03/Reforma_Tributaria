import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useAdminAuth } from "./AdminAuthContext";
import {
  emptyTaxBase,
  type Anexo,
  type AnexoItem,
  type CSTRecord,
  type IndOpRecord,
  type RequisitoLegal,
  type TaxBaseData,
  type TaxBaseVersion,
} from "@/lib/taxBase";

interface TaxBaseContextValue {
  data: typeof emptyTaxBase;
  version: TaxBaseVersion | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const TaxBaseContext = createContext<TaxBaseContextValue | undefined>(undefined);

const fetchPublishedTaxBase = async (): Promise<TaxBaseData> => {
  const { data: version, error: versionError } = await supabase
    .from("tax_base_versions")
    .select("*")
    .eq("status", "publicada")
    .order("publicado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionError) throw versionError;
  if (!version) throw new Error("Nenhuma versão da base tributária foi publicada.");
  const versionId = version.id;

  const [cstResult, ncmResult, anexosResult, indopResult, servicesResult] = await Promise.all([
    supabase.from("tax_cst_records").select("*").eq("version_id", versionId).order("cclass_trib"),
    supabase.from("tax_ncm_mappings").select("*").eq("version_id", versionId).order("ncm"),
    supabase.from("tax_anexos").select("*").eq("version_id", versionId).order("anexo_key"),
    supabase.from("tax_indop_records").select("*").eq("version_id", versionId).order("codigo"),
    supabase.from("tax_indop_service_mappings").select("*").eq("version_id", versionId).order("termo"),
  ]);
  for (const result of [cstResult, ncmResult, anexosResult, indopResult, servicesResult]) {
    if (result.error) throw result.error;
  }

  const anexoRows = anexosResult.data || [];
  const anexoIds = anexoRows.map((anexo) => anexo.id);
  const itemsResult = anexoIds.length
    ? await supabase.from("tax_anexo_items").select("*").in("anexo_id", anexoIds).order("ordem")
    : { data: [], error: null };
  if (itemsResult.error) throw itemsResult.error;

  const itemsByAnexo = new Map<string, AnexoItem[]>();
  for (const item of itemsResult.data || []) {
    const items = itemsByAnexo.get(item.anexo_id) || [];
    items.push({
      id: item.id,
      item: item.item,
      produto: item.produto,
      ncm: item.ncm,
      observacao: item.observacao || undefined,
    });
    itemsByAnexo.set(item.anexo_id, items);
  }

  const anexosData: Record<string, Anexo> = {};
  for (const anexo of anexoRows) {
    anexosData[anexo.anexo_key] = {
      id: anexo.anexo_key,
      databaseId: anexo.id,
      numero: anexo.numero,
      titulo: anexo.titulo,
      descricao: anexo.descricao,
      reducao: anexo.reducao,
      artigo: anexo.artigo,
      itens: itemsByAnexo.get(anexo.id) || [],
    };
  }

  return {
    version: version as TaxBaseVersion,
    cstData: (cstResult.data || []).map((row): CSTRecord => ({
      id: row.id,
      cstCode: row.cst_code,
      cstDescription: row.cst_description,
      cClassTrib: row.cclass_trib,
      cClassTribName: row.cclass_trib_name,
      cClassTribDescription: row.cclass_trib_description,
      lcArticle: row.lc_article,
      aliquotaType: row.aliquota_type,
      pRedIBS: Number(row.p_red_ibs),
      pRedCBS: Number(row.p_red_cbs),
      dIniVig: row.d_ini_vig,
      link: row.link,
      ncmCodes: row.ncm_codes,
      requisitosLegais: Array.isArray(row.requisitos_legais) ? row.requisitos_legais as unknown as RequisitoLegal[] : [],
    })),
    ncmToClassTrib: Object.fromEntries((ncmResult.data || []).map((row) => [row.ncm, {
      cClassTrib: row.cclass_trib,
      description: row.description,
      anexo: row.anexo,
    }])),
    anexosData,
    indOpData: (indopResult.data || []).map((row): IndOpRecord => ({
      id: row.id,
      codigo: row.codigo,
      artigo: row.artigo,
      tipoOperacao: row.tipo_operacao,
      localOperacao: row.local_operacao,
      caracteristicaFornecimento: row.caracteristica_fornecimento,
      localFornecimentoDfe: row.local_fornecimento_dfe,
    })),
    servicoToIndOp: Object.fromEntries((servicesResult.data || []).map((row) => [row.termo, row.codigos])),
  };
};

export const TaxBaseProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated: clientAuthenticated, isLoading: clientLoading } = useAuth();
  const { isAuthenticated: adminAuthenticated, isLoading: adminLoading } = useAdminAuth();
  const enabled = !clientLoading && !adminLoading && (clientAuthenticated || adminAuthenticated);
  const query = useQuery({
    queryKey: ["tax-base", "published"],
    queryFn: fetchPublishedTaxBase,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  return (
    <TaxBaseContext.Provider value={{
      data: query.data || emptyTaxBase,
      version: query.data?.version || null,
      isLoading: enabled && query.isLoading,
      error: query.error instanceof Error ? query.error.message : null,
      refetch: () => { void query.refetch(); },
    }}>
      {children}
    </TaxBaseContext.Provider>
  );
};

export const useTaxBase = () => {
  const context = useContext(TaxBaseContext);
  if (!context) throw new Error("useTaxBase deve ser usado dentro de TaxBaseProvider");
  return context;
};
