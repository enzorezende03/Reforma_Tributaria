// Função para normalizar texto (remover acentos e caracteres especiais)
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "");
};

// Dicionário de sinônimos/termos similares para o contexto tributário
const synonyms: Record<string, string[]> = {
  // Alimentos
  "cesta basica": ["alimentos", "alimentacao", "comida", "mantimentos", "generos alimenticios"],
  "alimentos": ["cesta basica", "comida", "alimentacao", "mantimentos"],
  "comida": ["alimentos", "alimentacao", "cesta basica"],
  "arroz": ["cereal", "graos", "alimentos"],
  "feijao": ["leguminosa", "graos", "alimentos"],
  "carne": ["proteina", "carnes", "bovino", "frango", "suino", "alimentos"],
  "carnes": ["carne", "proteina", "bovino", "frango", "suino"],
  "leite": ["laticinio", "laticinios", "derivados do leite"],
  "laticinios": ["leite", "queijo", "iogurte", "derivados do leite"],
  
  // Saúde
  "medicamento": ["remedio", "farmaco", "medicamentos", "remedios", "farmacia", "saude"],
  "medicamentos": ["remedio", "farmaco", "medicamento", "remedios", "farmacia"],
  "remedio": ["medicamento", "farmaco", "medicamentos", "farmacia"],
  "remedios": ["medicamentos", "farmacos", "medicamento", "farmacia"],
  "saude": ["medicamentos", "hospital", "medico", "tratamento", "higiene"],
  "higiene": ["limpeza", "higiene pessoal", "saude"],
  "hospital": ["saude", "medico", "clinica", "tratamento"],
  
  // Educação
  "educacao": ["ensino", "escola", "aprendizado", "formacao", "curso"],
  "escola": ["educacao", "ensino", "colegio", "instituicao de ensino"],
  "ensino": ["educacao", "escola", "aprendizado", "curso"],
  "livro": ["livros", "material didatico", "educacao", "leitura"],
  "livros": ["livro", "material didatico", "educacao", "leitura"],
  
  // Transporte
  "transporte": ["mobilidade", "locomocao", "veiculo", "onibus", "metro"],
  "onibus": ["transporte", "transporte publico", "coletivo"],
  "metro": ["transporte", "transporte publico", "trem urbano"],
  
  // Tecnologia
  "software": ["programa", "sistema", "aplicativo", "tecnologia", "informatica"],
  "tecnologia": ["informatica", "computador", "software", "digital"],
  "informatica": ["tecnologia", "computador", "software", "ti"],
  
  // Construção
  "construcao": ["obra", "edificacao", "imovel", "reforma"],
  "imovel": ["imobiliario", "propriedade", "construcao", "edificacao"],
  "imobiliario": ["imovel", "propriedade", "construcao"],
  
  // Serviços
  "servico": ["servicos", "prestacao", "atendimento"],
  "servicos": ["servico", "prestacao", "atendimento"],
  
  // Agricultura
  "agricultura": ["agropecuaria", "rural", "fazenda", "produtor rural", "agro"],
  "agropecuaria": ["agricultura", "rural", "pecuaria", "agro"],
  "agro": ["agricultura", "agropecuaria", "rural", "produtor"],
  "insumo": ["insumos", "materia prima", "producao"],
  "insumos": ["insumo", "materia prima", "agricultura"],
  
  // Financeiro
  "financeiro": ["financeira", "banco", "credito", "financiamento"],
  "banco": ["financeiro", "instituicao financeira", "credito"],
  "seguro": ["seguros", "seguradora", "protecao"],
  "seguros": ["seguro", "seguradora", "protecao"],
  
  // Combustíveis
  "combustivel": ["combustiveis", "gasolina", "diesel", "etanol", "energia"],
  "combustiveis": ["combustivel", "gasolina", "diesel", "etanol"],
  "gasolina": ["combustivel", "combustiveis", "posto"],
  "energia": ["eletricidade", "luz", "energetico"],
  
  // Bebidas
  "bebida": ["bebidas", "refrigerante", "suco", "agua"],
  "bebidas": ["bebida", "refrigerante", "suco", "agua"],
  "alcoolica": ["alcoolicas", "cerveja", "vinho", "destilados"],
  "alcoolicas": ["alcoolica", "cerveja", "vinho", "destilados"],
  
  // Termos tributários
  "isento": ["isencao", "isentos", "nao tributado", "aliquota zero"],
  "isencao": ["isento", "isentos", "nao tributado"],
  "tributado": ["tributacao", "imposto", "tributo"],
  "imposto": ["tributado", "tributo", "taxa", "contribuicao"],
  "aliquota": ["percentual", "taxa", "imposto"],
  "reducao": ["reduzido", "desconto", "beneficio fiscal"],
  "reduzido": ["reducao", "menor aliquota", "beneficio"],
  
  // Dispositivos
  "dispositivo": ["dispositivos", "equipamento", "aparelho"],
  "dispositivos": ["dispositivo", "equipamento", "aparelho"],
  "medico": ["medicina", "saude", "hospitalar", "clinico"],
  
  // Outros
  "profissional": ["profissionais", "trabalhador", "autonomo"],
  "autonomo": ["autonomos", "profissional liberal", "mei"],
};

// Função para encontrar sinônimos de um termo
export const findSynonyms = (term: string): string[] => {
  const normalized = normalizeText(term);
  const result: Set<string> = new Set();
  
  // Adicionar o próprio termo
  result.add(normalized);
  
  // Buscar sinônimos diretos
  if (synonyms[normalized]) {
    synonyms[normalized].forEach(syn => result.add(syn));
  }
  
  // Buscar em quais grupos o termo aparece como sinônimo
  Object.entries(synonyms).forEach(([key, values]) => {
    if (values.some(v => normalizeText(v).includes(normalized) || normalized.includes(normalizeText(v)))) {
      result.add(key);
      values.forEach(v => result.add(normalizeText(v)));
    }
  });
  
  return Array.from(result);
};

// Função de busca com termos similares
export const fuzzyMatch = (text: string, query: string, useSimilar: boolean = true): boolean => {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  // Busca direta
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }
  
  // Busca por palavras individuais da query
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  const textWords = normalizedText.split(/\s+/);
  
  const directMatch = queryWords.every(qWord => 
    textWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))
  );
  
  if (directMatch) return true;
  
  // Busca por sinônimos (se habilitado)
  if (useSimilar) {
    const synonymsToCheck = findSynonyms(normalizedQuery);
    
    return synonymsToCheck.some(syn => {
      if (normalizedText.includes(syn)) return true;
      
      const synWords = syn.split(/\s+/).filter(w => w.length > 2);
      return synWords.every(sWord => 
        textWords.some(tWord => tWord.includes(sWord) || sWord.includes(tWord))
      );
    });
  }
  
  return false;
};
