// Anexo VII - Indicador de Operação (indOp) para IBS/CBS
// Conforme Art. 11 da LC 214/2025

export interface IndOpRecord {
  codigo: string;
  artigo: string;
  tipoOperacao: string;
  localOperacao: string;
  caracteristicaFornecimento: string;
  localFornecimentoDfe: string;
}

export const indOpData: IndOpRecord[] = [
  // Inc. II - Bens imóveis
  {
    codigo: '020101',
    artigo: 'Inc. II',
    tipoOperacao: 'Operação com bem imóvel, bem imaterial, inclusive direito, relacionada a bem imóvel',
    localOperacao: 'O local onde o imóvel estiver situado',
    caracteristicaFornecimento: 'Execução de operações com bem imóvel, bem imaterial, inclusive direito, relacionado a bem imóvel',
    localFornecimentoDfe: 'Localidade do imóvel'
  },
  {
    codigo: '020201',
    artigo: 'Inc. II',
    tipoOperacao: 'Serviço prestado fisicamente sobre bem imóvel',
    localOperacao: 'O local onde o imóvel estiver situado',
    caracteristicaFornecimento: 'Execução de serviços sobre bem imóvel',
    localFornecimentoDfe: 'Localidade do imóvel'
  },
  {
    codigo: '020301',
    artigo: 'Inc. II',
    tipoOperacao: 'Serviço de administração e intermediação de bem imóvel',
    localOperacao: 'O local onde o imóvel estiver situado',
    caracteristicaFornecimento: 'Execução dos serviços de administração e intermediação de bens imóveis',
    localFornecimentoDfe: 'Localidade do imóvel'
  },
  // Inc. III - Serviços prestados sobre pessoa ou presenciais
  {
    codigo: '030101',
    artigo: 'Inc. III',
    tipoOperacao: 'Serviço prestado fisicamente sobre a pessoa ou fruído presencialmente por pessoa física',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços diversos exclusivamente prestados fisicamente sobre a pessoa ou integralmente fruídos presencialmente por pessoa física',
    localFornecimentoDfe: 'Estabelecimento do fornecedor'
  },
  {
    codigo: '030102',
    artigo: 'Inc. III',
    tipoOperacao: 'Serviço prestado fisicamente sobre a pessoa ou fruído presencialmente por pessoa física',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços diversos exclusivamente prestados fisicamente sobre a pessoa ou integralmente fruídos presencialmente por pessoa física',
    localFornecimentoDfe: 'Endereço do adquirente'
  },
  {
    codigo: '030103',
    artigo: 'Inc. III',
    tipoOperacao: 'Serviço prestado fisicamente sobre a pessoa ou fruído presencialmente por pessoa física',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços diversos exclusivamente prestados fisicamente sobre a pessoa ou integralmente fruídos presencialmente por pessoa física',
    localFornecimentoDfe: 'Endereço do destinatário'
  },
  {
    codigo: '030104',
    artigo: 'Inc. III',
    tipoOperacao: 'Serviço prestado fisicamente sobre a pessoa ou fruído presencialmente por pessoa física',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços diversos exclusivamente prestados fisicamente sobre a pessoa ou integralmente fruídos presencialmente por pessoa física',
    localFornecimentoDfe: 'Endereço diverso do fornecedor, adquirente ou destinatário'
  },
  // Inc. IV - Eventos
  {
    codigo: '040101',
    artigo: 'Inc. IV',
    tipoOperacao: 'Serviço de planejamento, organização e administração de feiras, exposições, congressos, espetáculos, exibições e congêneres',
    localOperacao: 'O local do evento a que se refere o serviço',
    caracteristicaFornecimento: 'Execução de serviços de planejamento, organização e administração de feiras, exposições, congressos, espetáculos, exibições e congêneres',
    localFornecimentoDfe: 'Local do Evento'
  },
  // Inc. V - Serviços sobre bem móvel material
  {
    codigo: '050101',
    artigo: 'Inc. V',
    tipoOperacao: 'Serviço prestado fisicamente sobre bem móvel material',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços diversos fisicamente prestados sobre bem móvel material',
    localFornecimentoDfe: 'Estabelecimento do fornecedor'
  },
  {
    codigo: '050102',
    artigo: 'Inc. V',
    tipoOperacao: 'Serviço prestado fisicamente sobre bem móvel material',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços diversos fisicamente prestados sobre bem móvel material',
    localFornecimentoDfe: 'Endereço do adquirente'
  },
  {
    codigo: '050103',
    artigo: 'Inc. V',
    tipoOperacao: 'Serviço prestado fisicamente sobre bem móvel material',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços diversos fisicamente prestados sobre bem móvel material',
    localFornecimentoDfe: 'Endereço do destinatário'
  },
  {
    codigo: '050104',
    artigo: 'Inc. V',
    tipoOperacao: 'Serviço prestado fisicamente sobre bem móvel material',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços diversos fisicamente prestados sobre bem móvel material',
    localFornecimentoDfe: 'Endereço diverso do fornecedor, adquirente ou destinatário'
  },
  {
    codigo: '050201',
    artigo: 'Inc. V',
    tipoOperacao: 'Serviços portuários',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços portuários',
    localFornecimentoDfe: 'Local da prestação'
  },
  // Inc. VI - Transporte de passageiros
  {
    codigo: '060101',
    artigo: 'Inc. VI',
    tipoOperacao: 'Serviço de transporte de passageiros',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços de transporte de passageiros',
    localFornecimentoDfe: 'Local de início do transporte'
  },
  // Inc. VII - Transporte de carga
  {
    codigo: '070101',
    artigo: 'Inc. VII',
    tipoOperacao: 'Serviço de transporte de carga',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços de transporte de carga',
    localFornecimentoDfe: 'Endereço fornecido para entrega'
  },
  {
    codigo: '070102',
    artigo: 'Inc. VII',
    tipoOperacao: 'Serviço de transporte de carga',
    localOperacao: 'O local da prestação do serviço',
    caracteristicaFornecimento: 'Execução de serviços de transporte de carga',
    localFornecimentoDfe: 'Local da retirada'
  },
  // Inc. VIII - Exploração de via
  {
    codigo: '080101',
    artigo: 'Inc. VIII',
    tipoOperacao: 'Serviço de exploração de via',
    localOperacao: 'O território de cada Município e Estado, ou do Distrito Federal, proporcionalmente à correspondente extensão da via explorada',
    caracteristicaFornecimento: 'Execução de serviços de exploração de via',
    localFornecimentoDfe: 'Local da prestação, correspondente à extensão da via explorada e proporcional ao território dos entes tributantes'
  },
  // Inc. X - Cessão de espaço publicitário e demais serviços
  {
    codigo: '100101',
    artigo: 'Inc. X',
    tipoOperacao: 'Cessão de espaço para prestação de serviços publicitários, em operações onerosas',
    localOperacao: 'O local do domicílio principal do adquirente, nas operações onerosas',
    caracteristicaFornecimento: 'Execução de operações de cessão de espaço para prestação de serviços publicitários',
    localFornecimentoDfe: 'Local do domicílio principal do adquirente'
  },
  {
    codigo: '100102',
    artigo: 'Inc. X',
    tipoOperacao: 'Cessão de espaço para prestação de serviços publicitários, em operações onerosas',
    localOperacao: 'O local do domicílio principal do adquirente, nas operações onerosas',
    caracteristicaFornecimento: 'Execução de operações de cessão de espaço para prestação de serviços publicitários',
    localFornecimentoDfe: 'Local do domicílio do destinatário, nos casos de adquirente residente ou domiciliado no exterior'
  },
  {
    codigo: '100201',
    artigo: 'Inc. X',
    tipoOperacao: 'Cessão de espaço para prestação de serviços publicitários, em operações não onerosas',
    localOperacao: 'O local do domicílio principal do destinatário, nas operações não onerosas',
    caracteristicaFornecimento: 'Execução de operações de cessão de espaço para prestação de serviços publicitários',
    localFornecimentoDfe: 'Local do domicílio principal do destinatário'
  },
  {
    codigo: '100301',
    artigo: 'Inc. X',
    tipoOperacao: 'Demais serviços, em operações onerosas',
    localOperacao: 'O local do domicílio principal do adquirente, nas operações onerosas',
    caracteristicaFornecimento: 'Execução dos demais serviços em operações não especificadas anteriormente ou, nos serviços que sejam, ainda que parcialmente, prestados à distância',
    localFornecimentoDfe: 'Local do domicílio principal do adquirente'
  },
  {
    codigo: '100302',
    artigo: 'Inc. X',
    tipoOperacao: 'Demais serviços, em operações onerosas',
    localOperacao: 'O local do domicílio principal do adquirente, nas operações onerosas',
    caracteristicaFornecimento: 'Execução dos demais serviços em operações não especificadas anteriormente ou, nos serviços que sejam, ainda que parcialmente, prestados à distância',
    localFornecimentoDfe: 'Local do domicílio do destinatário, nos casos de adquirente residente ou domiciliado no exterior'
  },
  {
    codigo: '100401',
    artigo: 'Inc. X',
    tipoOperacao: 'Demais serviços, em operações não onerosas',
    localOperacao: 'O local do domicílio principal do destinatário, nas operações não onerosas',
    caracteristicaFornecimento: 'Execução dos demais serviços em operações não especificadas anteriormente ou, nos serviços que sejam, ainda que parcialmente, prestados à distância',
    localFornecimentoDfe: 'Local do domicílio principal do destinatário'
  },
  {
    codigo: '100501',
    artigo: 'Inc. X',
    tipoOperacao: 'Demais bens móveis imateriais, inclusive direitos, em operações onerosas',
    localOperacao: 'O local do domicílio principal do adquirente, nas operações onerosas',
    caracteristicaFornecimento: 'Execução de demais operações não especificadas anteriormente com bens móveis imateriais, inclusive direitos',
    localFornecimentoDfe: 'Local do domicílio principal do adquirente'
  },
  {
    codigo: '100502',
    artigo: 'Inc. X',
    tipoOperacao: 'Demais bens móveis imateriais, inclusive direitos, em operações onerosas',
    localOperacao: 'O local do domicílio principal do adquirente, nas operações onerosas',
    caracteristicaFornecimento: 'Execução de demais operações não especificadas anteriormente com bens móveis imateriais, inclusive direitos',
    localFornecimentoDfe: 'Local do domicílio do destinatário, nos casos de adquirente residente ou domiciliado no exterior'
  },
  {
    codigo: '100601',
    artigo: 'Inc. X',
    tipoOperacao: 'Demais bens móveis imateriais, inclusive direitos, em operações não onerosas',
    localOperacao: 'O local do domicílio principal do destinatário, nas operações não onerosas',
    caracteristicaFornecimento: 'Execução de demais operações não especificadas anteriormente com bens móveis imateriais, inclusive direitos',
    localFornecimentoDfe: 'Local do domicílio principal do destinatário'
  }
];

// Mapeamento de tipos de serviço para códigos indOp sugeridos
export const servicoToIndOp: Record<string, string[]> = {
  // Serviços sobre imóveis
  'imovel': ['020101', '020201', '020301'],
  'construcao': ['020201'],
  'reforma': ['020201'],
  'arquitetura': ['020201', '100301'],
  'engenharia': ['020201', '100301'],
  'corretagem': ['020301'],
  'administracao de imoveis': ['020301'],
  
  // Serviços sobre pessoa física (saúde, estética, etc.)
  'saude': ['030101', '030102'],
  'saude humana': ['030101', '030102'],
  'medico': ['030101', '030102'],
  'cirurgico': ['030101', '030102'],
  'hospital': ['030101', '030102'],
  'clinica': ['030101', '030102'],
  'odontologia': ['030101', '030102'],
  'fisioterapia': ['030101', '030102'],
  'estetica': ['030101', '030102'],
  'cabeleireiro': ['030101', '030102'],
  'academia': ['030101', '030102'],
  'educacao': ['030101', '030102', '100301'],
  'curso': ['030101', '100301'],
  'treinamento': ['030101', '100301'],
  
  // Eventos
  'eventos': ['040101'],
  'feira': ['040101'],
  'exposicao': ['040101'],
  'congresso': ['040101'],
  'show': ['040101'],
  'espetaculo': ['040101'],
  
  // Serviços sobre bem móvel
  'manutencao': ['050101', '050102'],
  'reparo': ['050101', '050102'],
  'conserto': ['050101', '050102'],
  'oficina': ['050101', '050102'],
  'portuario': ['050201'],
  
  // Transporte
  'transporte passageiros': ['060101'],
  'transporte carga': ['070101', '070102'],
  'frete': ['070101', '070102'],
  'logistica': ['070101', '070102'],
  
  // Exploração de via
  'pedagio': ['080101'],
  'concessao': ['080101'],
  
  // Publicidade e demais serviços
  'publicidade': ['100101', '100102', '100201'],
  'marketing': ['100101', '100301'],
  'consultoria': ['100301', '100401'],
  'advocacia': ['100301'],
  'contabilidade': ['100301'],
  'tecnologia': ['100301'],
  'software': ['100301', '100501'],
  'licenciamento': ['100501', '100601'],
  'direitos autorais': ['100501', '100601'],
  'profissoes intelectuais': ['100301']
};

// Função para buscar códigos indOp por tipo de serviço
export const findIndOpByServico = (servico: string): string[] => {
  const searchTerm = servico.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [key, codes] of Object.entries(servicoToIndOp)) {
    const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (searchTerm.includes(normalizedKey) || normalizedKey.includes(searchTerm)) {
      return codes;
    }
  }
  
  // Se não encontrar específico, retorna os códigos genéricos de "demais serviços"
  return ['100301', '100401'];
};

// Função para obter detalhes de um código indOp
export const getIndOpDetails = (codigo: string): IndOpRecord | undefined => {
  return indOpData.find(item => item.codigo === codigo);
};

// Função para verificar se um registro CST é de prestação de serviço
export const isServicoRecord = (cClassTribName: string, cClassTribDescription: string): boolean => {
  const searchText = `${cClassTribName} ${cClassTribDescription}`.toLowerCase();
  const servicoKeywords = [
    'serviço', 'servico', 'serviços', 'servicos',
    'prestação', 'prestacao',
    'consultoria', 'advocacia', 'contabilidade', 'arquitetura', 'engenharia',
    'educação', 'educacao', 'ensino', 'curso',
    'saúde', 'saude', 'médico', 'medico', 'hospital', 'clínica', 'clinica',
    'transporte', 'logística', 'logistica',
    'profissões intelectuais', 'profissoes intelectuais',
    'locação', 'locacao', 'cessão', 'cessao',
    'intermediação', 'intermediacao', 'corretagem',
    'manutenção', 'manutencao', 'reparo', 'conserto',
    'publicidade', 'marketing', 'propaganda',
    'evento', 'feira', 'exposição', 'exposicao', 'congresso'
  ];
  
  return servicoKeywords.some(keyword => searchText.includes(keyword));
};
