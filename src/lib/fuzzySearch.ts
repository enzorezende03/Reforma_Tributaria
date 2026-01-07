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
  // === CESTA BÁSICA NACIONAL DE ALIMENTOS (CST 200 - Anexo I) ===
  // Massas e cereais
  "massas": ["cesta basica", "alimentacao humana", "alimentos", "macarrao", "espaguete"],
  "macarrao": ["cesta basica", "alimentacao humana", "alimentos", "massas"],
  "espaguete": ["cesta basica", "alimentacao humana", "alimentos", "massas", "macarrao"],
  "arroz": ["cesta basica", "alimentacao humana", "alimentos", "cereais"],
  "feijao": ["cesta basica", "alimentacao humana", "alimentos", "leguminosas"],
  "trigo": ["cesta basica", "alimentacao humana", "alimentos", "farinha", "cereais"],
  "farinha": ["cesta basica", "alimentacao humana", "alimentos", "trigo"],
  "aveia": ["cesta basica", "alimentacao humana", "alimentos", "cereais"],
  "milho": ["cesta basica", "alimentacao humana", "alimentos", "cereais"],
  "fuba": ["cesta basica", "alimentacao humana", "alimentos", "milho"],
  "cereais": ["cesta basica", "alimentacao humana", "alimentos"],
  
  // Carnes e proteínas
  "carne": ["cesta basica", "alimentacao humana", "alimentos", "carnes", "proteina"],
  "carnes": ["cesta basica", "alimentacao humana", "alimentos", "carne", "proteina"],
  "frango": ["cesta basica", "alimentacao humana", "alimentos", "carne", "aves"],
  "peixe": ["cesta basica", "alimentacao humana", "alimentos", "pescado", "proteina"],
  "pescado": ["cesta basica", "alimentacao humana", "alimentos", "peixe"],
  "bovino": ["cesta basica", "alimentacao humana", "alimentos", "carne"],
  "suino": ["cesta basica", "alimentacao humana", "alimentos", "carne", "porco"],
  "porco": ["cesta basica", "alimentacao humana", "alimentos", "carne", "suino"],
  "aves": ["cesta basica", "alimentacao humana", "alimentos", "frango"],
  "linguica": ["cesta basica", "alimentacao humana", "alimentos", "embutidos"],
  "salsicha": ["cesta basica", "alimentacao humana", "alimentos", "embutidos"],
  "embutidos": ["cesta basica", "alimentacao humana", "alimentos"],
  
  // Laticínios
  "leite": ["cesta basica", "alimentacao humana", "alimentos", "laticinios"],
  "laticinios": ["cesta basica", "alimentacao humana", "alimentos", "leite"],
  "queijo": ["cesta basica", "alimentacao humana", "alimentos", "laticinios"],
  "iogurte": ["cesta basica", "alimentacao humana", "alimentos", "laticinios"],
  "manteiga": ["cesta basica", "alimentacao humana", "alimentos", "laticinios"],
  "margarina": ["cesta basica", "alimentacao humana", "alimentos"],
  
  // Óleos e gorduras
  "oleo": ["cesta basica", "alimentacao humana", "alimentos", "oleos"],
  "oleos": ["cesta basica", "alimentacao humana", "alimentos"],
  "azeite": ["cesta basica", "alimentacao humana", "alimentos", "oleos"],
  
  // Açúcar e doces
  "acucar": ["cesta basica", "alimentacao humana", "alimentos"],
  "cafe": ["cesta basica", "alimentacao humana", "alimentos", "bebidas"],
  "sal": ["cesta basica", "alimentacao humana", "alimentos", "temperos"],
  
  // Pães e derivados
  "pao": ["cesta basica", "alimentacao humana", "alimentos", "paes", "panificacao"],
  "paes": ["cesta basica", "alimentacao humana", "alimentos", "pao", "panificacao"],
  "biscoito": ["cesta basica", "alimentacao humana", "alimentos", "bolachas"],
  "bolachas": ["cesta basica", "alimentacao humana", "alimentos", "biscoito"],
  "panificacao": ["cesta basica", "alimentacao humana", "alimentos"],
  
  // Conservas e enlatados
  "conserva": ["cesta basica", "alimentacao humana", "alimentos", "enlatados"],
  "enlatados": ["cesta basica", "alimentacao humana", "alimentos", "conserva"],
  "sardinha": ["cesta basica", "alimentacao humana", "alimentos", "peixe", "enlatados"],
  "atum": ["cesta basica", "alimentacao humana", "alimentos", "peixe", "enlatados"],
  
  // Alimentos gerais
  "alimento": ["alimentos", "alimenticio", "alimentacao humana", "cesta basica"],
  "alimentos": ["alimento", "alimenticio", "alimentacao humana", "cesta basica"],
  "alimentacao humana": ["alimentos", "cesta basica"],
  "cesta basica": ["alimentacao humana", "alimentos"],
  "generos alimenticios": ["alimentos", "cesta basica", "alimentacao humana"],
  
  // === PRODUTOS HORTÍCOLAS, FRUTAS E OVOS (CST 200 - Anexo XV) ===
  "horticola": ["horticolas", "frutas", "ovos", "legumes", "verduras"],
  "horticolas": ["horticola", "frutas", "ovos", "legumes", "verduras"],
  "frutas": ["horticolas", "ovos", "fruticula"],
  "fruta": ["frutas", "horticolas"],
  "ovos": ["horticolas", "frutas", "ovo"],
  "ovo": ["ovos", "horticolas"],
  "legumes": ["horticolas", "verduras", "vegetais"],
  "verduras": ["horticolas", "legumes", "vegetais"],
  "vegetais": ["horticolas", "legumes", "verduras"],
  "tomate": ["horticolas", "legumes", "verduras"],
  "batata": ["horticolas", "legumes", "tuberculos"],
  "cebola": ["horticolas", "legumes", "verduras"],
  "alface": ["horticolas", "verduras", "folhosos"],
  "cenoura": ["horticolas", "legumes", "raizes"],
  "banana": ["frutas", "horticolas"],
  "laranja": ["frutas", "horticolas", "citricos"],
  "maca": ["frutas", "horticolas"],
  "uva": ["frutas", "horticolas"],
  
  // === MEDICAMENTOS E SAÚDE (CST 200) ===
  "medicamento": ["medicamentos", "remedio", "remedios", "farmaceutico", "saude"],
  "medicamentos": ["medicamento", "remedio", "remedios", "farmaceutico", "saude"],
  "remedio": ["remedios", "medicamento", "medicamentos"],
  "remedios": ["remedio", "medicamento", "medicamentos"],
  "farmaceutico": ["medicamentos", "farmacia", "saude"],
  "farmacia": ["medicamentos", "farmaceutico"],
  
  // === SERVIÇOS DE SAÚDE HUMANA (CST 200 - Anexo III) ===
  "saude": ["saude humana", "servicos de saude", "medico", "hospital", "clinica"],
  "saude humana": ["saude", "servicos de saude", "medico", "hospital"],
  "servicos de saude": ["saude humana", "saude", "hospital", "clinica"],
  "cirurgico": ["cirurgicos", "cirurgia", "saude humana", "hospital", "servicos de saude"],
  "cirurgicos": ["cirurgico", "cirurgia", "saude humana", "hospital", "servicos de saude"],
  "cirurgia": ["cirurgico", "cirurgicos", "saude humana", "hospital", "servicos de saude"],
  "hospital": ["hospitalar", "saude humana", "servicos de saude", "internacao"],
  "hospitalar": ["hospital", "saude humana", "servicos de saude"],
  "internacao": ["hospital", "hospitalar", "saude humana"],
  "clinica": ["clinico", "saude humana", "servicos de saude", "consulta"],
  "clinico": ["clinica", "saude humana", "servicos de saude"],
  "consulta": ["consulta medica", "saude humana", "medico", "clinica"],
  "consulta medica": ["consulta", "saude humana", "medico"],
  "exame": ["exames", "diagnostico", "saude humana", "laboratorio"],
  "exames": ["exame", "diagnostico", "saude humana", "laboratorio"],
  "diagnostico": ["exame", "exames", "saude humana"],
  "laboratorio": ["exame", "exames", "saude humana", "analises clinicas"],
  "fisioterapia": ["saude humana", "reabilitacao", "servicos de saude"],
  "fonoaudiologia": ["saude humana", "servicos de saude"],
  "nutricao": ["saude humana", "nutricionista", "servicos de saude"],
  "nutricionista": ["nutricao", "saude humana"],
  "odontologia": ["odontologico", "dentista", "saude humana", "servicos de saude"],
  "odontologico": ["odontologia", "dentista", "saude humana"],
  "dentista": ["odontologia", "odontologico", "saude humana"],
  "enfermagem": ["enfermeiro", "saude humana", "hospital"],
  "enfermeiro": ["enfermagem", "saude humana"],
  "ambulancia": ["transporte de pacientes", "saude humana", "emergencia"],
  "emergencia": ["urgencia", "pronto socorro", "saude humana"],
  "urgencia": ["emergencia", "pronto socorro", "saude humana"],
  "pronto socorro": ["emergencia", "urgencia", "saude humana"],
  
  // === DISPOSITIVOS MÉDICOS (CST 200) ===
  "dispositivo medico": ["dispositivos medicos", "equipamento medico"],
  "dispositivos medicos": ["dispositivo medico", "equipamento medico"],
  "equipamento medico": ["dispositivos medicos"],
  
  // === EDUCAÇÃO (CST 200) ===
  "educacao": ["educacional", "ensino", "escola", "curso"],
  "ensino": ["educacao", "educacional", "escola"],
  "escola": ["educacao", "ensino"],
  "curso": ["educacao", "ensino", "treinamento"],
  "universidade": ["educacao", "ensino", "prouni"],
  "faculdade": ["educacao", "ensino", "prouni"],
  
  // === SERVIÇOS ===
  "servico": ["servicos"],
  "servicos": ["servico"],
  
  // === TERMOS TRIBUTÁRIOS ===
  "isento": ["isencao", "isentos"],
  "isencao": ["isento", "isentos"],
  "tributado": ["tributavel", "tributacao"],
  "reducao": ["reduzida", "reduzido"],
  "reduzida": ["reducao", "reduzido"],
  "reduzido": ["reducao", "reduzida"],
  
  // === INSUMOS AGROPECUÁRIOS (CST 200) ===
  "insumo": ["insumos", "insumos agropecuarios"],
  "insumos": ["insumo", "insumos agropecuarios"],
  "insumos agropecuarios": ["insumos", "agropecuaria", "agricultura"],
  "agropecuaria": ["insumos agropecuarios", "agricultura", "pecuaria"],
  "agricultura": ["agropecuaria", "insumos agropecuarios"],
  "pecuaria": ["agropecuaria", "criacao"],
  "fertilizante": ["insumos agropecuarios", "adubo"],
  "adubo": ["insumos agropecuarios", "fertilizante"],
  "semente": ["insumos agropecuarios", "sementes"],
  "sementes": ["insumos agropecuarios", "semente"],
  "racao": ["insumos agropecuarios", "alimentacao animal"],
  
  // === TRANSPORTE (CST 200) ===
  "transporte": ["transportes", "transporte publico"],
  "transportes": ["transporte"],
  "transporte publico": ["transporte", "onibus", "metro"],
  "onibus": ["transporte publico", "transporte"],
  "metro": ["transporte publico", "transporte"],
  
  // === PROFISSÕES INTELECTUAIS (CST 200) ===
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
  
  // === OPERAÇÕES COM BENS IMÓVEIS (CST 200) ===
  "locacao": ["bens imoveis", "imoveis", "aluguel", "arrendamento"],
  "locacao de imoveis": ["bens imoveis", "operacoes imoveis", "aluguel"],
  "aluguel": ["bens imoveis", "locacao", "imoveis", "arrendamento"],
  "aluguel de imoveis": ["bens imoveis", "locacao", "operacoes imoveis"],
  "imovel": ["bens imoveis", "imoveis", "imobiliario"],
  "imoveis": ["bens imoveis", "imovel", "imobiliario", "locacao"],
  "imobiliario": ["bens imoveis", "imoveis", "imovel"],
  "imobiliaria": ["bens imoveis", "imoveis", "imobiliario"],
  "arrendamento": ["bens imoveis", "locacao", "aluguel"],
  "bens imoveis": ["imoveis", "imovel", "locacao", "aluguel", "imobiliario"],
  "operacoes imoveis": ["bens imoveis", "imoveis", "locacao"],
  
  // === HIGIENE (CST 200) ===
  "absorvente": ["tampoes higienicos", "higiene", "absorventes"],
  "absorventes": ["tampoes higienicos", "higiene", "absorvente"],
  "tampoes higienicos": ["absorventes", "higiene"],
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
