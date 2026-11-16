import type { Json } from "@/integrations/supabase/types";

export interface RequisitoLegal {
  titulo: string;
  itens: string[];
}

export interface CSTRecord {
  id?: string;
  cstCode: string;
  cstDescription: string;
  cClassTrib: string;
  cClassTribName: string;
  cClassTribDescription: string;
  lcArticle: string;
  aliquotaType: string;
  pRedIBS: number;
  pRedCBS: number;
  dIniVig: string;
  link: string;
  ncmCodes?: string[];
  requisitosLegais?: RequisitoLegal[];
}

export interface NcmMapping {
  cClassTrib: string;
  description: string;
  anexo: string;
}

export interface AnexoItem {
  id?: string;
  item: number | string;
  produto: string;
  ncm: string;
  observacao?: string;
}

export interface Anexo {
  id: string;
  databaseId?: string;
  numero: string;
  titulo: string;
  descricao: string;
  reducao: string;
  artigo: string;
  itens: AnexoItem[];
}

export interface IndOpRecord {
  id?: string;
  codigo: string;
  artigo: string;
  tipoOperacao: string;
  localOperacao: string;
  caracteristicaFornecimento: string;
  localFornecimentoDfe: string;
}

export interface TaxBaseVersion {
  id: string;
  versao: string;
  data_vigencia: string;
  fonte: string;
  observacao: string | null;
  status: "rascunho" | "publicada" | "arquivada";
  publicado_em: string | null;
  publicado_por: string | null;
  criado_em: string;
}

export interface TaxBaseData {
  version: TaxBaseVersion;
  cstData: CSTRecord[];
  ncmToClassTrib: Record<string, NcmMapping>;
  anexosData: Record<string, Anexo>;
  indOpData: IndOpRecord[];
  servicoToIndOp: Record<string, string[]>;
}

export const emptyTaxBase = {
  cstData: [] as CSTRecord[],
  ncmToClassTrib: {} as Record<string, NcmMapping>,
  anexosData: {} as Record<string, Anexo>,
  indOpData: [] as IndOpRecord[],
  servicoToIndOp: {} as Record<string, string[]>,
};

export const extractAnexoNumber = (text: string): string | null => {
  const match = text.match(/Anexo\s+([IVXLCDM]+|\d+)/i);
  if (!match) return null;
  const romanToArabic: Record<string, string> = {
    I: "1", II: "2", III: "3", IV: "4", V: "5", VI: "6", VII: "7", VIII: "8",
    IX: "9", X: "10", XI: "11", XII: "12", XIII: "13", XIV: "14", XV: "15",
    XVI: "16", XVII: "17",
  };
  return romanToArabic[match[1].toUpperCase()] || match[1];
};

export const findNcmMapping = (
  mappings: Record<string, NcmMapping>,
  ncm: string,
): NcmMapping | null => {
  const cleanNcm = ncm.replace(/\D/g, "");
  if (cleanNcm.length < 4) return null;
  for (let length = Math.min(cleanNcm.length, 8); length >= 4; length -= 1) {
    const match = mappings[cleanNcm.substring(0, length)];
    if (match) return match;
  }
  return null;
};

export const findIndOpCodes = (
  mappings: Record<string, string[]>,
  servico: string,
): string[] => {
  const searchTerm = servico.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, codes] of Object.entries(mappings)) {
    const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (searchTerm.includes(normalizedKey) || normalizedKey.includes(searchTerm)) return codes;
  }
  return ["100301", "100401"];
};

export const isServicoRecord = (name: string, description: string): boolean => {
  const searchText = `${name} ${description}`.toLowerCase();
  return [
    "serviço", "servico", "serviços", "servicos", "prestação", "prestacao",
    "consultoria", "advocacia", "contabilidade", "arquitetura", "engenharia",
    "educação", "educacao", "ensino", "curso", "saúde", "saude", "médico",
    "medico", "hospital", "clínica", "clinica", "transporte", "logística",
    "logistica", "profissões intelectuais", "profissoes intelectuais", "locação",
    "locacao", "cessão", "cessao", "intermediação", "intermediacao", "corretagem",
    "manutenção", "manutencao", "reparo", "conserto", "publicidade", "marketing",
    "propaganda", "evento", "feira", "exposição", "exposicao", "congresso",
  ].some((keyword) => searchText.includes(keyword));
};

export type TaxRecordChangeType = "included" | "changed" | "removed";

export interface TaxRecordDiff {
  type: TaxRecordChangeType;
  incoming: CSTRecord;
  current?: CSTRecord;
  changedFields: string[];
}

const comparableFields: (keyof CSTRecord)[] = [
  "cstCode", "cstDescription", "cClassTribName", "cClassTribDescription",
  "lcArticle", "aliquotaType", "pRedIBS", "pRedCBS", "dIniVig", "link",
];

const normalizedValue = (record: CSTRecord, field: keyof CSTRecord) => {
  const value = record[field];
  return typeof value === "string" ? value.trim() : value;
};

export const diffTaxRecords = (current: CSTRecord[], incoming: CSTRecord[]): TaxRecordDiff[] => {
  const currentByCode = new Map(current.map((record) => [record.cClassTrib, record]));
  const incomingCodes = new Set(incoming.map((record) => record.cClassTrib));
  const diffs: TaxRecordDiff[] = [];

  for (const record of incoming) {
    const before = currentByCode.get(record.cClassTrib);
    if (!before) {
      diffs.push({ type: "included", incoming: record, changedFields: [] });
      continue;
    }
    const changedFields = comparableFields.filter(
      (field) => normalizedValue(before, field) !== normalizedValue(record, field),
    );
    if (changedFields.length > 0) {
      diffs.push({ type: "changed", incoming: record, current: before, changedFields });
    }
  }

  for (const record of current) {
    if (!incomingCodes.has(record.cClassTrib)) {
      diffs.push({ type: "removed", incoming: record, current: record, changedFields: [] });
    }
  }
  return diffs;
};

export const toCstPayload = (record: CSTRecord, versionId: string) => ({
  version_id: versionId,
  cst_code: record.cstCode.trim(),
  cst_description: record.cstDescription.trim(),
  cclass_trib: record.cClassTrib.trim(),
  cclass_trib_name: record.cClassTribName.trim(),
  cclass_trib_description: record.cClassTribDescription.trim(),
  lc_article: record.lcArticle.trim(),
  aliquota_type: record.aliquotaType.trim(),
  p_red_ibs: Number(record.pRedIBS) || 0,
  p_red_cbs: Number(record.pRedCBS) || 0,
  d_ini_vig: record.dIniVig.trim(),
  link: record.link.trim(),
  ncm_codes: record.ncmCodes || [],
  requisitos_legais: (record.requisitosLegais || []) as unknown as Json,
});
