// @ts-ignore - executado com bun test
import { describe, expect, test } from "bun:test";
import { diffTaxRecords, findNcmMapping, type CSTRecord } from "./taxBase";

const record = (code: string, name = "Original"): CSTRecord => ({
  cstCode: "200", cstDescription: "Alíquota reduzida", cClassTrib: code,
  cClassTribName: name, cClassTribDescription: "Descrição", lcArticle: "Art. 1",
  aliquotaType: "Padrão", pRedIBS: 60, pRedCBS: 60, dIniVig: "01/01/2026", link: "",
});

describe("base tributária", () => {
  test("comparativo identifica inclusão, alteração e remoção pelo cClassTrib", () => {
    const diffs = diffTaxRecords([record("200001"), record("200002")], [record("200001", "Alterado"), record("200003")]);
    expect(diffs.find((d) => d.incoming.cClassTrib === "200001")?.type).toBe("changed");
    expect(diffs.find((d) => d.incoming.cClassTrib === "200002")?.type).toBe("removed");
    expect(diffs.find((d) => d.incoming.cClassTrib === "200003")?.type).toBe("included");
  });

  test("busca de NCM usa o prefixo mais específico", () => {
    const mappings = {
      "1006": { cClassTrib: "200003", description: "Arroz", anexo: "Anexo I" },
      "100620": { cClassTrib: "200003", description: "Arroz descascado", anexo: "Anexo I" },
    };
    expect(findNcmMapping(mappings, "1006.20.00")?.description).toBe("Arroz descascado");
    expect(findNcmMapping(mappings, "9999")).toBeNull();
  });
});
