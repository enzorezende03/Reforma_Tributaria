export interface AnexoItem {
  produto: string;
  ncm: string;
  observacao?: string;
}

export interface Anexo {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  reducao: string;
  artigo: string;
  itens: AnexoItem[];
}

export const anexosData: Record<string, Anexo> = {
  "1": {
    id: "1",
    numero: "Anexo I",
    titulo: "Cesta Básica Nacional de Alimentos",
    descricao: "Produtos destinados à alimentação humana com alíquota zero de IBS e CBS",
    reducao: "100% (Alíquota Zero)",
    artigo: "Art. 125",
    itens: [
      { produto: "Arroz", ncm: "1006.20, 1006.30, 1006.40.00", observacao: "Descascado, polido, parboilizado" },
      { produto: "Leite fluido pasteurizado ou esterilizado", ncm: "0401.10, 0401.20, 0401.40, 0401.50", observacao: "Para consumo direto" },
      { produto: "Leite em pó", ncm: "0402.10, 0402.21, 0402.29", observacao: "Integral ou desnatado" },
      { produto: "Fórmulas infantis", ncm: "1901.10.10, 1901.10.20, 2106.90.90", observacao: "Definidas por previsão legal específica" },
      { produto: "Manteiga", ncm: "0405.10.00" },
      { produto: "Margarina", ncm: "1517.10.00" },
      { produto: "Feijões", ncm: "0713.31, 0713.32, 0713.33, 0713.34, 0713.35, 0713.39", observacao: "Secos, inclusive descascados" },
      { produto: "Café torrado e moído", ncm: "0901.21, 0901.22" },
      { produto: "Café solúvel", ncm: "2101.11, 2101.12" },
      { produto: "Óleo de babaçu", ncm: "1513.21.20" },
      { produto: "Farinha de mandioca", ncm: "1106.20.00" },
      { produto: "Tapioca e seus sucedâneos", ncm: "1903.00.00" },
      { produto: "Farinha de milho", ncm: "1102.20.00" },
      { produto: "Grumos e sêmolas de milho", ncm: "1103.13.00" },
      { produto: "Grãos de milho esmagados ou em flocos", ncm: "1104.19.00, 1104.23.00" },
      { produto: "Farinha de trigo", ncm: "1101.00.10" },
      { produto: "Açúcar cristal", ncm: "1701.14.00" },
      { produto: "Outros açúcares de cana", ncm: "1701.99.00" },
      { produto: "Massas alimentícias", ncm: "1902.11, 1902.19", observacao: "Não cozidas, nem recheadas ou preparadas" },
      { produto: "Pão francês", ncm: "1905.90.90", observacao: "Sal, farinha de trigo, água e fermento" },
      { produto: "Pré-misturas de pão francês", ncm: "1901.20.10, 1901.20.90" },
      { produto: "Grãos de aveia", ncm: "1104.12.00, 1104.22.00" },
      { produto: "Farinha de aveia", ncm: "1102.90.00" },
      { produto: "Carnes bovina, suína, ovina, caprina e de aves", ncm: "0201, 0202, 0203, 0204, 0206, 0207", observacao: "Frescas, refrigeradas ou congeladas" },
      { produto: "Miudezas comestíveis", ncm: "0206, 0207.14" },
      { produto: "Peixes (exceto salmão, bacalhau, atum e hadoque)", ncm: "0302, 0303, 0304", observacao: "Frescos, refrigerados ou congelados" },
      { produto: "Queijo tipo mussarela", ncm: "0406.10.10" },
      { produto: "Queijo tipo minas", ncm: "0406.10.90" },
      { produto: "Queijo tipo prato", ncm: "0406.90.20" },
      { produto: "Queijo tipo provolone", ncm: "0406.90.40" },
      { produto: "Queijo tipo coalho", ncm: "0406.90.90" },
      { produto: "Ricota", ncm: "0406.10.90" },
      { produto: "Requeijão", ncm: "0406.30.00" },
      { produto: "Sal iodado", ncm: "2501.00.20" },
      { produto: "Erva-mate", ncm: "0903.00" },
      { produto: "Mate (cuia ou chimarrão)", ncm: "0903.00" },
      { produto: "Farinha com baixo teor de proteína", ncm: "1901.90.90", observacao: "Para pessoas com erros inatos do metabolismo" },
      { produto: "Massas para dietas específicas", ncm: "1902.19.00", observacao: "Para pessoas com erros inatos do metabolismo" },
      { produto: "Fórmulas dietoterápicas", ncm: "2106.90.90", observacao: "Para erros inatos do metabolismo" },
    ]
  },
  "2": {
    id: "2",
    numero: "Anexo II",
    titulo: "Serviços de Educação",
    descricao: "Serviços de educação com redução de 60% nas alíquotas de IBS e CBS",
    reducao: "60%",
    artigo: "Art. 129",
    itens: [
      { produto: "Educação infantil (creche e pré-escola)", ncm: "NBS 1.2201.10.00" },
      { produto: "Educação fundamental", ncm: "NBS 1.2201.21.00" },
      { produto: "Educação médio", ncm: "NBS 1.2201.22.00" },
      { produto: "Educação superior (graduação)", ncm: "NBS 1.2201.31" },
      { produto: "Educação superior (pós-graduação)", ncm: "NBS 1.2201.32" },
      { produto: "Educação profissional técnica", ncm: "NBS 1.2201.40" },
      { produto: "Educação especial", ncm: "NBS 1.2201.50.00" },
      { produto: "Educação de jovens e adultos", ncm: "NBS 1.2201.60.00" },
      { produto: "Ensino de idiomas", ncm: "NBS 1.2205.11.00" },
      { produto: "Cursos preparatórios para exames", ncm: "NBS 1.2205.20.00" },
    ]
  },
  "3": {
    id: "3",
    numero: "Anexo III",
    titulo: "Serviços de Saúde Humana",
    descricao: "Serviços de saúde com redução de 60% nas alíquotas de IBS e CBS",
    reducao: "60%",
    artigo: "Art. 130",
    itens: [
      { produto: "Consultas médicas", ncm: "NBS 1.2301.11" },
      { produto: "Serviços odontológicos", ncm: "NBS 1.2301.12" },
      { produto: "Fisioterapia", ncm: "NBS 1.2301.13.10" },
      { produto: "Terapia ocupacional", ncm: "NBS 1.2301.13.20" },
      { produto: "Fonoaudiologia", ncm: "NBS 1.2301.13.30" },
      { produto: "Psicologia", ncm: "NBS 1.2301.13.40" },
      { produto: "Nutrição", ncm: "NBS 1.2301.13.50" },
      { produto: "Enfermagem", ncm: "NBS 1.2301.14" },
      { produto: "Exames laboratoriais", ncm: "NBS 1.2301.21" },
      { produto: "Exames de imagem", ncm: "NBS 1.2301.22" },
      { produto: "Serviços de diagnóstico", ncm: "NBS 1.2301.20" },
      { produto: "Serviços hospitalares", ncm: "NBS 1.2302" },
      { produto: "Transporte de pacientes", ncm: "NBS 1.2303.11.00" },
    ]
  },
  "4": {
    id: "4",
    numero: "Anexo IV",
    titulo: "Dispositivos Médicos",
    descricao: "Dispositivos médicos com redução de 60% nas alíquotas (ou zero para administração pública)",
    reducao: "60% (ou zero para gov.)",
    artigo: "Art. 131, 144",
    itens: [
      { produto: "Seringas, agulhas, cateteres, cânulas", ncm: "9018.31, 9018.32, 9018.39" },
      { produto: "Instrumentos e aparelhos de oftalmologia", ncm: "9018.50" },
      { produto: "Aparelhos de eletrodiagnóstico", ncm: "9018.11, 9018.12, 9018.13, 9018.14, 9018.19" },
      { produto: "Aparelhos de raios X", ncm: "9022.12, 9022.13, 9022.14" },
      { produto: "Aparelhos de ultrassom", ncm: "9018.12.10" },
      { produto: "Aparelhos de ressonância magnética", ncm: "9018.13.00" },
      { produto: "Tomógrafos", ncm: "9022.12.00" },
      { produto: "Desfibriladores", ncm: "9018.90.40" },
      { produto: "Monitores de sinais vitais", ncm: "9018.19.80" },
      { produto: "Ventiladores pulmonares", ncm: "9019.20.10" },
      { produto: "Oxímetros", ncm: "9018.19.80" },
      { produto: "Equipamentos de hemodiálise", ncm: "9018.90.95" },
      { produto: "Próteses articulares", ncm: "9021.31" },
      { produto: "Próteses dentárias", ncm: "9021.21" },
      { produto: "Marca-passos cardíacos", ncm: "9021.50.00" },
      { produto: "Aparelhos ortopédicos", ncm: "9021.10" },
      { produto: "Aparelhos auditivos", ncm: "9021.40.00" },
    ]
  },
  "5": {
    id: "5",
    numero: "Anexo V",
    titulo: "Dispositivos de Acessibilidade para PCD",
    descricao: "Dispositivos de acessibilidade para pessoas com deficiência com redução de 60%",
    reducao: "60% (ou zero para gov.)",
    artigo: "Art. 132, 145",
    itens: [
      { produto: "Cadeiras de rodas", ncm: "8713.10.00, 8713.90.00" },
      { produto: "Muletas", ncm: "9021.10.10" },
      { produto: "Bengalas para cegos", ncm: "6602.00.00" },
      { produto: "Aparelhos auditivos", ncm: "9021.40.00" },
      { produto: "Implantes cocleares", ncm: "9021.90.19" },
      { produto: "Próteses oculares", ncm: "9021.39.80" },
      { produto: "Órteses e próteses", ncm: "9021.10, 9021.31, 9021.39" },
      { produto: "Andadores", ncm: "9021.10.20" },
      { produto: "Softwares de acessibilidade", ncm: "NBS 1.1201" },
      { produto: "Leitores de tela", ncm: "NBS 1.1201" },
      { produto: "Teclados adaptados", ncm: "8471.60.52" },
      { produto: "Mouses adaptados", ncm: "8471.60.53" },
      { produto: "Lupas eletrônicas", ncm: "9013.80.10" },
    ]
  },
  "6": {
    id: "6",
    numero: "Anexo VI",
    titulo: "Composições para Nutrição e Erros Inatos do Metabolismo",
    descricao: "Composições para nutrição enteral/parenteral e fórmulas para erros inatos do metabolismo",
    reducao: "60% (ou zero para gov.)",
    artigo: "Art. 133, 146",
    itens: [
      { produto: "Nutrição enteral", ncm: "2106.90.30" },
      { produto: "Nutrição parenteral", ncm: "3004.50.00" },
      { produto: "Fórmulas para fenilcetonúria", ncm: "2106.90.90" },
      { produto: "Fórmulas para galactosemia", ncm: "2106.90.90" },
      { produto: "Fórmulas para doenças metabólicas", ncm: "2106.90.90" },
      { produto: "Suplementos alimentares especiais", ncm: "2106.90" },
      { produto: "Composições especiais com vitaminas", ncm: "2106.90.30" },
      { produto: "Composições especiais com minerais", ncm: "2106.90.30" },
    ]
  },
  "7": {
    id: "7",
    numero: "Anexo VII",
    titulo: "Alimentos para Consumo Humano",
    descricao: "Alimentos destinados ao consumo humano com redução de 60%",
    reducao: "60%",
    artigo: "Art. 135",
    itens: [
      { produto: "Carnes e miudezas processadas", ncm: "0210, 1601, 1602" },
      { produto: "Peixes processados", ncm: "0305, 1604" },
      { produto: "Produtos lácteos", ncm: "0403, 0404, 0405, 0406" },
      { produto: "Cereais e derivados", ncm: "1101 a 1109" },
      { produto: "Óleos vegetais", ncm: "1507 a 1516" },
      { produto: "Preparações alimentícias", ncm: "1901, 1902, 1904, 1905" },
      { produto: "Sucos de frutas", ncm: "2009" },
      { produto: "Extratos de café e chá", ncm: "2101" },
      { produto: "Temperos e condimentos", ncm: "2103" },
      { produto: "Sopas e caldos", ncm: "2104" },
      { produto: "Sorvetes", ncm: "2105.00.10" },
      { produto: "Preparações alimentícias diversas", ncm: "2106" },
    ]
  },
  "8": {
    id: "8",
    numero: "Anexo VIII",
    titulo: "Produtos de Higiene Pessoal e Limpeza",
    descricao: "Produtos de higiene pessoal e limpeza com redução de 60%",
    reducao: "60%",
    artigo: "Art. 136",
    itens: [
      { produto: "Sabões e sabonetes", ncm: "3401" },
      { produto: "Detergentes", ncm: "3402" },
      { produto: "Pasta de dentes", ncm: "3306.10.00" },
      { produto: "Fio dental", ncm: "3306.20.00" },
      { produto: "Papel higiênico", ncm: "4818.10.00" },
      { produto: "Absorventes higiênicos", ncm: "9619.00.00" },
      { produto: "Fraldas descartáveis", ncm: "9619.00.00" },
      { produto: "Escovas de dentes", ncm: "9603.21.00" },
      { produto: "Água sanitária", ncm: "2828.90.11" },
      { produto: "Desinfetantes", ncm: "3808.94" },
    ]
  },
  "9": {
    id: "9",
    numero: "Anexo IX",
    titulo: "Insumos Agropecuários e Aquícolas",
    descricao: "Insumos agropecuários e aquícolas com redução de 60%",
    reducao: "60%",
    artigo: "Art. 138",
    itens: [
      { produto: "Sementes para semeadura", ncm: "1201 a 1214" },
      { produto: "Adubos e fertilizantes", ncm: "3101 a 3105" },
      { produto: "Defensivos agrícolas", ncm: "3808" },
      { produto: "Rações para animais", ncm: "2309" },
      { produto: "Medicamentos veterinários", ncm: "3004" },
      { produto: "Vacinas veterinárias", ncm: "3002" },
      { produto: "Sêmen bovino", ncm: "0511.10.00" },
      { produto: "Embriões", ncm: "0511.99.10" },
      { produto: "Mudas de plantas", ncm: "0602" },
      { produto: "Tratores agrícolas", ncm: "8701" },
      { produto: "Máquinas de colheita", ncm: "8433" },
      { produto: "Implementos agrícolas", ncm: "8432, 8436" },
    ]
  },
  "12": {
    id: "12",
    numero: "Anexo XII",
    titulo: "Dispositivos Médicos - Alíquota Zero",
    descricao: "Dispositivos médicos com alíquota zero de IBS e CBS",
    reducao: "100% (Alíquota Zero)",
    artigo: "Art. 144",
    itens: [
      { produto: "Produtos para ostomia", ncm: "3006.91.00" },
      { produto: "Dispositivos para incontinência", ncm: "9619.00.00" },
      { produto: "Cateteres", ncm: "9018.39.22, 9018.39.23" },
      { produto: "Bolsas coletoras", ncm: "3926.90.40" },
      { produto: "Equipamentos para diabetes", ncm: "9027.80.99" },
      { produto: "Lancetas", ncm: "9018.32.12" },
      { produto: "Tiras reagentes para glicose", ncm: "3822.00.90" },
      { produto: "Seringas de insulina", ncm: "9018.31.11" },
      { produto: "Canetas aplicadoras de insulina", ncm: "9018.31.19" },
      { produto: "Bombas de insulina", ncm: "9018.90.10" },
    ]
  },
  "13": {
    id: "13",
    numero: "Anexo XIII",
    titulo: "Dispositivos de Acessibilidade - Alíquota Zero",
    descricao: "Dispositivos de acessibilidade para PCD com alíquota zero",
    reducao: "100% (Alíquota Zero)",
    artigo: "Art. 145",
    itens: [
      { produto: "Cadeiras de rodas motorizadas", ncm: "8713.90.00" },
      { produto: "Veículos adaptados para PCD", ncm: "8703" },
      { produto: "Próteses de membros", ncm: "9021.31, 9021.39" },
      { produto: "Implantes cocleares", ncm: "9021.90.19" },
      { produto: "Aparelhos de amplificação sonora", ncm: "9021.40.00" },
      { produto: "Sintetizadores de voz", ncm: "8471.90.19" },
      { produto: "Softwares de comunicação aumentativa", ncm: "NBS 1.1201" },
    ]
  },
  "14": {
    id: "14",
    numero: "Anexo XIV",
    titulo: "Medicamentos - Alíquota Zero",
    descricao: "Medicamentos com alíquota zero de IBS e CBS",
    reducao: "100% (Alíquota Zero)",
    artigo: "Art. 146",
    itens: [
      { produto: "Insulinas", ncm: "3004.31, 3004.32" },
      { produto: "Medicamentos para câncer", ncm: "3004.90" },
      { produto: "Medicamentos para HIV/AIDS", ncm: "3004.90" },
      { produto: "Vacinas para uso humano", ncm: "3002.20" },
      { produto: "Imunoglobulinas", ncm: "3002.13" },
      { produto: "Soros e hemoderivados", ncm: "3002.10, 3002.90" },
      { produto: "Medicamentos para doenças raras", ncm: "3004.90" },
      { produto: "Medicamentos para transplantes", ncm: "3004.90" },
      { produto: "Medicamentos para hepatites", ncm: "3004.90" },
      { produto: "Medicamentos para tuberculose", ncm: "3004.90" },
    ]
  },
  "15": {
    id: "15",
    numero: "Anexo XV",
    titulo: "Produtos Hortícolas, Frutas e Ovos",
    descricao: "Produtos hortícolas, frutas e ovos não cozidos com alíquota zero",
    reducao: "100% (Alíquota Zero)",
    artigo: "Art. 148",
    itens: [
      { produto: "Batatas", ncm: "0701" },
      { produto: "Tomates", ncm: "0702" },
      { produto: "Cebolas, alhos, alhos-porros", ncm: "0703" },
      { produto: "Couves, repolhos, brócolis, couve-flor", ncm: "0704" },
      { produto: "Alfaces e chicórias", ncm: "0705" },
      { produto: "Cenouras, nabos, beterrabas, rabanetes", ncm: "0706" },
      { produto: "Pepinos e pepininhos", ncm: "0707" },
      { produto: "Legumes de vagem", ncm: "0708" },
      { produto: "Outros legumes frescos", ncm: "0709" },
      { produto: "Bananas", ncm: "0803" },
      { produto: "Tâmaras, figos, abacaxis, abacates", ncm: "0804" },
      { produto: "Laranjas, tangerinas, limões", ncm: "0805" },
      { produto: "Uvas", ncm: "0806" },
      { produto: "Melões e melancias", ncm: "0807" },
      { produto: "Maçãs, peras, marmelos", ncm: "0808" },
      { produto: "Damascos, cerejas, pêssegos, ameixas", ncm: "0809" },
      { produto: "Outras frutas frescas", ncm: "0810" },
      { produto: "Ovos de galinha", ncm: "0407.21.00, 0407.29.00" },
      { produto: "Ovos de outras aves", ncm: "0407.90" },
    ]
  }
};

export const getAnexoById = (id: string): Anexo | undefined => {
  return anexosData[id];
};

export const extractAnexoNumber = (text: string): string | null => {
  const match = text.match(/Anexo\s+([IVXLCDM]+|\d+)/i);
  if (match) {
    const romanToArabic: Record<string, string> = {
      'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
      'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
      'XI': '11', 'XII': '12', 'XIII': '13', 'XIV': '14', 'XV': '15'
    };
    return romanToArabic[match[1].toUpperCase()] || match[1];
  }
  return null;
};
