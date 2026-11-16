import ExcelJS from "exceljs";
import type { CSTRecord } from "./taxBase";
import { normalizeText } from "./fuzzySearch";

const headerAliases: Record<keyof Omit<CSTRecord, "id" | "ncmCodes" | "requisitosLegais">, string[]> = {
  cstCode: ["cst", "codigocst", "cstcode"],
  cstDescription: ["descricaocst", "cstdescription", "descricaodocst"],
  cClassTrib: ["cclasstrib", "codigocclasstrib", "codigoclassificacaotributaria"],
  cClassTribName: ["nomecclasstrib", "cclasstribname", "nomeclassificacaotributaria"],
  cClassTribDescription: ["descricaocclasstrib", "cclasstribdescription", "descricaodaclassificacaotributaria"],
  lcArticle: ["artigo", "artigolc", "lcarticle", "fundamentacaolegal", "lc2142025"],
  aliquotaType: ["tipoaliquota", "aliquotatype", "tipotributacao"],
  pRedIBS: ["predibs", "reducaoibs", "reducaoibspct", "percentualreducaoibs"],
  pRedCBS: ["predcbs", "reducaocbs", "reducaocbspct", "percentualreducaocbs"],
  dIniVig: ["dinivig", "datainiciovigencia", "iniciovigencia", "vigencia"],
  link: ["link", "url", "linklc", "linklegislacao"],
};

const cellText = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("text" in value) return String(value.text);
    if ("result" in value && value.result !== undefined) return cellText(value.result as ExcelJS.CellValue);
    if ("formula" in value) return "";
  }
  return String(value).trim();
};

const percentage = (value: string): number => {
  const parsed = Number(value.replace("%", "").replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parseCClassTribWorkbook = async (file: File): Promise<CSTRecord[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("A planilha não contém abas.");

  let headerRowNumber = 0;
  let columns = new Map<string, number>();
  worksheet.eachRow((row, rowNumber) => {
    if (headerRowNumber || rowNumber > 10) return;
    const candidate = new Map<string, number>();
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const header = normalizeText(cellText(cell.value)).replace(/\s/g, "");
      for (const [field, aliases] of Object.entries(headerAliases)) {
        if (aliases.includes(header)) candidate.set(field, columnNumber);
      }
    });
    if (candidate.has("cClassTrib") && candidate.has("cstCode")) {
      headerRowNumber = rowNumber;
      columns = candidate;
    }
  });

  if (!headerRowNumber) {
    throw new Error("Não encontrei as colunas CST e cClassTrib no cabeçalho.");
  }

  const records: CSTRecord[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;
    const get = (field: keyof typeof headerAliases) => {
      const column = columns.get(field);
      return column ? cellText(row.getCell(column).value) : "";
    };
    const cClassTrib = get("cClassTrib").replace(/\D/g, "");
    if (!cClassTrib) return;
    const cstCode = get("cstCode").replace(/\D/g, "").padStart(3, "0");
    if (!/^\d{6}$/.test(cClassTrib) || !/^\d{3}$/.test(cstCode)) {
      errors.push(`Linha ${rowNumber}: CST ou cClassTrib inválido.`);
      return;
    }
    if (seen.has(cClassTrib)) {
      errors.push(`Linha ${rowNumber}: cClassTrib ${cClassTrib} duplicado.`);
      return;
    }
    seen.add(cClassTrib);
    records.push({
      cstCode,
      cstDescription: get("cstDescription"),
      cClassTrib,
      cClassTribName: get("cClassTribName"),
      cClassTribDescription: get("cClassTribDescription"),
      lcArticle: get("lcArticle"),
      aliquotaType: get("aliquotaType"),
      pRedIBS: percentage(get("pRedIBS")),
      pRedCBS: percentage(get("pRedCBS")),
      dIniVig: get("dIniVig"),
      link: get("link"),
      ncmCodes: [],
      requisitosLegais: [],
    });
  });

  if (errors.length) throw new Error(errors.slice(0, 8).join("\n"));
  if (!records.length) throw new Error("Nenhum registro válido encontrado.");
  return records;
};
