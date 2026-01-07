export interface AnexoItem {
  item: number | string;
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
    descricao: "Produtos destinados à alimentação humana submetidos à redução a zero das alíquotas do IBS e da CBS (exclusive produtos hortícolas, frutas e ovos relacionados no Anexo XV)",
    reducao: "100% (Alíquota Zero)",
    artigo: "Art. 125",
    itens: [
      { item: 1, produto: "Arroz", ncm: "1006.20, 1006.30, 1006.40.00", observacao: "Das subposições e código indicados" },
      { item: 2, produto: "Leite fluido", ncm: "0401.10.10, 0401.10.90, 0401.20.10, 0401.20.90, 0401.40.10, 0401.50.10", observacao: "Em conformidade com os requisitos da legislação específica relativos ao consumo direto pela população" },
      { item: 3, produto: "Leite em pó", ncm: "0402.10.10, 0402.10.90, 0402.21.10, 0402.21.20, 0402.29.10, 0402.29.20", observacao: "Em conformidade com os requisitos da legislação específica" },
      { item: 4, produto: "Fórmulas infantis", ncm: "1901.10.10, 1901.10.90, 2106.90.90", observacao: "Em conformidade com os requisitos da legislação específica" },
      { item: 5, produto: "Manteiga", ncm: "0405.10.00" },
      { item: 6, produto: "Margarina", ncm: "1517.10.00" },
      { item: 7, produto: "Feijões", ncm: "0713.33.19, 0713.33.29, 0713.33.99, 0713.35.90" },
      { item: 8, produto: "Café", ncm: "09.01, 2101.1", observacao: "Da posição 09.01 e da subposição 2101.1" },
      { item: 9, produto: "Óleo de babaçu", ncm: "1513.21.20", observacao: "Em conformidade com os requisitos da legislação específica relativos ao consumo como alimento" },
      { item: 10, produto: "Farinha de mandioca e tapioca", ncm: "1106.20.00, 1903.00.00" },
      { item: 11, produto: "Farinha, grumos e sêmolas de milho", ncm: "1102.20.00, 1103.13.00" },
      { item: 12, produto: "Grãos de milho", ncm: "1104.19.00, 1104.23.00" },
      { item: 13, produto: "Farinha de trigo", ncm: "1101.00.10" },
      { item: 14, produto: "Açúcar", ncm: "1701.14.00, 1701.99.00" },
      { item: 15, produto: "Massas alimentícias", ncm: "1902.1", observacao: "Da subposição 1902.1" },
      { item: 16, produto: "Pão francês e pré-mistura", ncm: "1905.90.90, 1901.20.10, 1901.20.90", observacao: "Pão comumente denominado pão francês elaborado a partir da mistura de farinha de trigo, fermento biológico, água, sal, açúcar, aditivos alimentares e produtos de fortificação" },
      { item: 17, produto: "Grãos de aveia", ncm: "1104.12.00, 1104.22.00" },
      { item: 18, produto: "Farinha de aveia", ncm: "1102.90.00" },
      { item: 19, produto: "Carnes bovina, suína, ovina, caprina e de aves", ncm: "02.01, 02.02, 0206.10.00, 0206.2, 0210.20.00, 02.03, 0206.30.00, 0206.4, 0209.10, 0210.1, 02.04, 0210.99.20, 02.07", observacao: "Frescas, refrigeradas ou congeladas, e produtos de origem animal (exceto foies gras)" },
      { item: 20, produto: "Peixes e carnes de peixes", ncm: "03.02, 03.03, 03.04", observacao: "Exceto salmonídeos, atuns, bacalhaus, hadoque, saithe e ovas" },
      { item: 21, produto: "Queijos", ncm: "0406.10.10, 0406.10.90, 0406.20.00, 0406.90.10, 0406.90.20, 0406.90.30", observacao: "Queijos tipo mozarela, minas, prato, coalho, ricota, requeijão, provolone, parmesão, fresco não maturado e do reino" },
      { item: 22, produto: "Sal", ncm: "2501.00.20, 2501.00.90", observacao: "Em conformidade com os requisitos da legislação específica relativos ao teor de iodo" },
      { item: 23, produto: "Mate", ncm: "09.03", observacao: "Da posição 09.03" },
      { item: 24, produto: "Farinha com baixo teor de proteína", ncm: "1901.90.90", observacao: "Para pessoas com aminoacidopatias, acidemias e defeitos do ciclo da uréia" },
      { item: 25, produto: "Massas com baixo teor de proteína", ncm: "1902.19.00", observacao: "Para pessoas com aminoacidopatias, acidemias e defeitos do ciclo da uréia" },
      { item: 26, produto: "Fórmulas Dietoterápicas para Erros Inatos do Metabolismo", ncm: "2106.90.90" },
    ]
  },
  "2": {
    id: "2",
    numero: "Anexo II",
    titulo: "Serviços de Educação",
    descricao: "Serviços de educação submetidos à redução de 60% das alíquotas do IBS e da CBS",
    reducao: "60%",
    artigo: "Art. 129",
    itens: [
      { item: 1, produto: "Ensino Infantil, inclusive creche e pré-escola", ncm: "NBS 1.2201.1" },
      { item: 2, produto: "Ensino Fundamental", ncm: "NBS 1.2201.20.00" },
      { item: 3, produto: "Ensino Médio", ncm: "NBS 1.2201.30.00" },
      { item: 4, produto: "Ensino Técnico de Nível Médio", ncm: "NBS 1.2202.00.00" },
      { item: 5, produto: "Ensino para jovens e adultos", ncm: "NBS 1.2201", observacao: "Destinado àqueles que não tiveram acesso ou continuidade de estudos no ensino fundamental e médio na idade própria" },
      { item: 6, produto: "Ensino Superior", ncm: "NBS 1.2201.3", observacao: "Compreendidos os cursos e programas de graduação, pós-graduação, de extensão e cursos sequenciais" },
      { item: 7, produto: "Ensino de sistemas linguísticos de natureza visomotora e de escrita tátil", ncm: "NBS 1.2205" },
      { item: 8, produto: "Ensino de línguas nativas de povos originários", ncm: "NBS 1.2205" },
      { item: 9, produto: "Educação especial", ncm: "NBS 1.2201", observacao: "Destinada a pessoas com deficiência, transtornos globais do desenvolvimento e altas habilidades ou superdotação" },
    ]
  },
  "3": {
    id: "3",
    numero: "Anexo III",
    titulo: "Serviços de Saúde Humana",
    descricao: "Serviços de saúde submetidos à redução de 60% das alíquotas do IBS e da CBS",
    reducao: "60%",
    artigo: "Art. 130",
    itens: [
      { item: 1, produto: "Serviços cirúrgicos", ncm: "NBS 1.2301" },
      { item: 2, produto: "Serviços obstétricos", ncm: "NBS 1.2301" },
      { item: 3, produto: "Serviços de Unidades de Terapia Intensiva", ncm: "NBS 1.2301" },
      { item: 4, produto: "Serviços de emergência e urgência", ncm: "NBS 1.2301" },
      { item: 5, produto: "Serviços médicos não classificados em subposições anteriores", ncm: "NBS 1.2301" },
      { item: 6, produto: "Serviços de enfermagem e de cuidados", ncm: "NBS 1.2301.14" },
      { item: 7, produto: "Serviços de diagnóstico por imagem", ncm: "NBS 1.2301.2" },
      { item: 8, produto: "Serviços de análise de material biológico humano", ncm: "NBS 1.2301.21" },
      { item: 9, produto: "Serviços de pré-parto, parto e pós-parto", ncm: "NBS 1.2301" },
      { item: 10, produto: "Consultas médicas", ncm: "NBS 1.2301.11" },
      { item: 11, produto: "Serviços odontológicos", ncm: "NBS 1.2301.12" },
      { item: 12, produto: "Fisioterapia", ncm: "NBS 1.2301.13.10" },
      { item: 13, produto: "Terapia ocupacional", ncm: "NBS 1.2301.13.20" },
      { item: 14, produto: "Fonoaudiologia", ncm: "NBS 1.2301.13.30" },
      { item: 15, produto: "Psicologia", ncm: "NBS 1.2301.13.40" },
      { item: 16, produto: "Nutrição", ncm: "NBS 1.2301.13.50" },
      { item: 17, produto: "Exames laboratoriais", ncm: "NBS 1.2301.21" },
      { item: 18, produto: "Exames de imagem", ncm: "NBS 1.2301.22" },
      { item: 19, produto: "Serviços hospitalares", ncm: "NBS 1.2302" },
      { item: 20, produto: "Transporte de pacientes", ncm: "NBS 1.2303.11.00" },
    ]
  },
  "7": {
    id: "7",
    numero: "Anexo VII",
    titulo: "Alimentos para Consumo Humano",
    descricao: "Alimentos destinados ao consumo humano submetidos à redução de 60% das alíquotas do IBS e da CBS",
    reducao: "60%",
    artigo: "Art. 135",
    itens: [
      { item: 1, produto: "Crustáceos (exceto lagostas e lagostim) e moluscos", ncm: "0306.1, 0306.3, 0307", observacao: "Exceto os produtos das subposições e códigos específicos" },
      { item: 2, produto: "Leite fermentado, bebidas e compostos lácteos", ncm: "0403.20.00, 0403.90.00, 2202.99.00", observacao: "Em conformidade com os requisitos da legislação específica" },
      { item: 3, produto: "Mel natural", ncm: "0409.00.00" },
      { item: 4, produto: "Farinhas", ncm: "1101.00, 11.02, 11.05, 11.06, 12.08", observacao: "Ressalvados os produtos relacionados no Anexo I" },
      { item: 5, produto: "Grumos e sêmolas de cereais", ncm: "1103.11.00, 1103.19.00", observacao: "Ressalvados os produtos relacionados no Anexo I" },
      { item: 6, produto: "Grãos de cereais", ncm: "1104.1, 1104.2", observacao: "Ressalvados os produtos relacionados no Anexo I" },
      { item: 7, produto: "Amido de milho", ncm: "1108.12.00" },
      { item: 8, produto: "Óleos vegetais", ncm: "1507.90, 15.08, 15.11, 15.12, 15.13, 15.14, 15.15", observacao: "Em conformidade com os requisitos da legislação específica" },
      { item: 9, produto: "Massas alimentícias", ncm: "1902.20.00, 1902.30.00" },
      { item: 10, produto: "Sucos naturais de fruta ou de produtos hortícolas", ncm: "20.09", observacao: "Sem adição de açúcar ou de outros edulcorantes e sem conservantes" },
      { item: 11, produto: "Polpas de frutas ou de produtos hortícolas", ncm: "20.08", observacao: "Sem adição de açúcar ou de outros edulcorantes e sem conservantes" },
      { item: 12, produto: "Pão de Forma", ncm: "1905.90.10" },
      { item: 13, produto: "Extrato de tomate", ncm: "2002.90.00" },
    ]
  },
  "8": {
    id: "8",
    numero: "Anexo VIII",
    titulo: "Produtos de Higiene Pessoal e Limpeza",
    descricao: "Produtos de higiene pessoal e limpeza majoritariamente consumidos por famílias de baixa renda submetidos à redução de 60% das alíquotas do IBS e da CBS",
    reducao: "60%",
    artigo: "Art. 136",
    itens: [
      { item: 1, produto: "Sabões de toucador", ncm: "3401.11.90" },
      { item: 2, produto: "Dentifrícios", ncm: "3306.10.00" },
      { item: 3, produto: "Escovas de dentes", ncm: "9603.21.00" },
      { item: 4, produto: "Papel higiênico", ncm: "4818.10.00" },
      { item: 5, produto: "Água sanitária", ncm: "3808.94.19" },
      { item: 6, produto: "Sabões em barra", ncm: "3401.19.00" },
      { item: 7, produto: "Fraldas e artigos higiênicos semelhantes", ncm: "9619.00.00" },
    ]
  },
  "12": {
    id: "12",
    numero: "Anexo XII",
    titulo: "Dispositivos Médicos - Alíquota Zero",
    descricao: "Dispositivos médicos submetidos à redução a zero das alíquotas do IBS e da CBS",
    reducao: "100% (Alíquota Zero)",
    artigo: "Art. 144",
    itens: [
      { item: "1.1", produto: "Eletrocardiógrafos", ncm: "9018.11.00" },
      { item: "1.2", produto: "Eletroencefalógrafos", ncm: "9018.19.80" },
      { item: "1.3", produto: "Outros aparelhos de eletrodiagnóstico", ncm: "9018.19.80" },
      { item: 2, produto: "Aparelhos de raios ultravioleta ou infravermelhos", ncm: "9018.20" },
      { item: 3, produto: "Artigos e aparelhos ortopédicos", ncm: "9021.10.10" },
      { item: 4, produto: "Artigos e aparelhos para fraturas", ncm: "9021.10.20" },
      { item: 5, produto: "Artigos e aparelhos de prótese", ncm: "9021.3", observacao: "Exceto os dentários" },
      { item: 6, produto: "Tomógrafo computadorizado", ncm: "9022.12.00" },
      { item: 7, produto: "Aparelhos de raio X móveis", ncm: "9022.14, 9022.19" },
      { item: 8, produto: "Aparelho de radiocobalto (bomba de cobalto)", ncm: "9022.21.10" },
      { item: 9, produto: "Aparelho de crioterapia", ncm: "9018.90.99" },
      { item: 10, produto: "Aparelho de gamaterapia", ncm: "9022.21.20" },
      { item: 13, produto: "Respirador", ncm: "9019.20.40" },
      { item: 14, produto: "Monitor multiparâmetros", ncm: "9018.19.80" },
      { item: 15, produto: "Bomba de infusão", ncm: "9018.90.10" },
      { item: 16, produto: "Aparelhos de diagnóstico por visualização de ressonância magnética", ncm: "9018.13.00" },
      { item: 17, produto: "Aparelhos de ultrassom", ncm: "9018.12" },
    ]
  },
  "13": {
    id: "13",
    numero: "Anexo XIII",
    titulo: "Dispositivos de Acessibilidade para PCD - Alíquota Zero",
    descricao: "Dispositivos de acessibilidade próprios para pessoas com deficiência submetidos à redução a zero das alíquotas do IBS e da CBS",
    reducao: "100% (Alíquota Zero)",
    artigo: "Art. 145",
    itens: [
      { item: 1, produto: "Barra de apoio para pessoa com deficiência física", ncm: "8302.41.00" },
      { item: "2.1", produto: "Cadeiras de rodas sem mecanismo de propulsão", ncm: "8713.10.00" },
      { item: "2.2", produto: "Cadeiras de rodas com motor ou outro mecanismo de propulsão", ncm: "8713.90.00" },
      { item: 3, produto: "Partes e acessórios para cadeiras de rodas", ncm: "8714.20.00" },
    ]
  },
  "15": {
    id: "15",
    numero: "Anexo XV",
    titulo: "Produtos Hortícolas, Frutas e Ovos",
    descricao: "Produtos hortícolas, frutas e ovos submetidos à redução de 100% das alíquotas do IBS e da CBS",
    reducao: "100% (Alíquota Zero)",
    artigo: "Art. 148",
    itens: [
      { item: 1, produto: "Ovos", ncm: "0407.2", observacao: "Da subposição 0407.2" },
      { item: 2, produto: "Produtos hortícolas", ncm: "07.01, 07.02.00.00, 07.03, 07.04, 07.05, 07.06, 0707.00.00, 07.08, 07.09, 07.10", observacao: "Exceto cogumelos e trufas da subposição 0709.5 e código 0710.80.00" },
      { item: 3, produto: "Frutas frescas, refrigeradas ou congeladas", ncm: "08.03, 08.04, 08.05, 08.06, 08.07, 08.08, 08.09, 08.10, 08.11", observacao: "Sem adição de açúcar ou de outros edulcorantes" },
      { item: 4, produto: "Plantas e produtos de floricultura para fins alimentares, ornamentais ou medicinais", ncm: "Capítulo 6" },
      { item: 5, produto: "Raízes e tubérculos", ncm: "07.14" },
      { item: 6, produto: "Cocos", ncm: "0801.1" },
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
      'XI': '11', 'XII': '12', 'XIII': '13', 'XIV': '14', 'XV': '15',
      'XVI': '16', 'XVII': '17'
    };
    return romanToArabic[match[1].toUpperCase()] || match[1];
  }
  return null;
};
