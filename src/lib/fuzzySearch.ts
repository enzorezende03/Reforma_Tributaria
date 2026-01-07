// Função para normalizar texto (remover acentos e caracteres especiais)
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "");
};

// Dicionário de sinônimos ESTRITO - apenas termos muito próximos
const synonyms: Record<string, string[]> = {
  // Alimentos - termos próximos
  "cesta basica": ["cesta", "basica"],
  "alimento": ["alimentos", "alimenticio"],
  "alimentos": ["alimento", "alimenticio"],
  
  // Saúde - termos próximos
  "medicamento": ["medicamentos", "remedio", "remedios"],
  "medicamentos": ["medicamento", "remedio", "remedios"],
  "remedio": ["remedios", "medicamento", "medicamentos"],
  "remedios": ["remedio", "medicamento", "medicamentos"],
  
  // Educação
  "educacao": ["educacional", "ensino"],
  "ensino": ["educacao", "educacional"],
  
  // Serviços
  "servico": ["servicos"],
  "servicos": ["servico"],
  
  // Dispositivos médicos
  "dispositivo": ["dispositivos"],
  "dispositivos": ["dispositivo"],
  
  // Termos tributários
  "isento": ["isencao", "isentos"],
  "isencao": ["isento", "isentos"],
  "tributado": ["tributavel", "tributacao"],
  "reducao": ["reduzida", "reduzido"],
  "reduzida": ["reducao", "reduzido"],
  "reduzido": ["reducao", "reduzida"],
  
  // Insumos
  "insumo": ["insumos"],
  "insumos": ["insumo"],
  
  // Transporte
  "transporte": ["transportes"],
  "transportes": ["transporte"],
  
  // Profissões intelectuais - CST 200
  "arquitetura": ["profissoes intelectuais", "intelectual", "arquiteto"],
  "arquiteto": ["profissoes intelectuais", "intelectual", "arquitetura"],
  "engenharia": ["profissoes intelectuais", "intelectual", "engenheiro"],
  "engenheiro": ["profissoes intelectuais", "intelectual", "engenharia"],
  "advocacia": ["profissoes intelectuais", "intelectual", "advogado", "juridico"],
  "advogado": ["profissoes intelectuais", "intelectual", "advocacia", "juridico"],
  "contabilidade": ["profissoes intelectuais", "intelectual", "contador", "contabil"],
  "contador": ["profissoes intelectuais", "intelectual", "contabilidade", "contabil"],
  "medicina": ["profissoes intelectuais", "intelectual", "medico"],
  "medico": ["profissoes intelectuais", "intelectual", "medicina", "saude"],
  "psicologia": ["profissoes intelectuais", "intelectual", "psicologo"],
  "psicologo": ["profissoes intelectuais", "intelectual", "psicologia"],
  "consultoria": ["profissoes intelectuais", "intelectual", "consultor"],
  "consultor": ["profissoes intelectuais", "intelectual", "consultoria"],
  "design": ["profissoes intelectuais", "intelectual", "designer"],
  "designer": ["profissoes intelectuais", "intelectual", "design"],
  "publicidade": ["profissoes intelectuais", "intelectual", "publicitario", "marketing"],
  "marketing": ["profissoes intelectuais", "intelectual", "publicidade"],
  "jornalismo": ["profissoes intelectuais", "intelectual", "jornalista"],
  "jornalista": ["profissoes intelectuais", "intelectual", "jornalismo"],
  "intelectual": ["profissoes intelectuais"],
  "profissoes intelectuais": ["intelectual", "arquitetura", "engenharia", "advocacia", "contabilidade", "medicina", "consultoria", "design"],
};

// Função para encontrar sinônimos de um termo (mais restrita)
export const findSynonyms = (term: string): string[] => {
  const normalized = normalizeText(term);
  const result: Set<string> = new Set();
  
  // Adicionar o próprio termo
  result.add(normalized);
  
  // Buscar sinônimos diretos apenas
  if (synonyms[normalized]) {
    synonyms[normalized].forEach(syn => result.add(syn));
  }
  
  return Array.from(result);
};

// Função de busca com termos similares (mais restrita)
export const fuzzyMatch = (text: string, query: string, useSimilar: boolean = true): boolean => {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  // Busca direta - prioridade máxima
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }
  
  // Dividir query em palavras (mínimo 3 caracteres)
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length >= 3);
  
  if (queryWords.length === 0) return false;
  
  // Todas as palavras da query devem estar no texto
  const allWordsMatch = queryWords.every(qWord => normalizedText.includes(qWord));
  if (allWordsMatch) return true;
  
  // Busca por sinônimos (se habilitado) - mais restrita
  if (useSimilar && queryWords.length <= 2) {
    // Para cada palavra da query, verificar se ela ou um sinônimo direto está no texto
    return queryWords.every(qWord => {
      // Primeiro tenta match direto
      if (normalizedText.includes(qWord)) return true;
      
      // Depois tenta sinônimos diretos
      const directSynonyms = synonyms[qWord] || [];
      return directSynonyms.some(syn => normalizedText.includes(syn));
    });
  }
  
  return false;
};
