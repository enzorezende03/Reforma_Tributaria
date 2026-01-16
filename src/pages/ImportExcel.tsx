import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileSpreadsheet, Search, Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cstData, CSTRecord } from "@/data/cstData";
import { fuzzyMatch } from "@/lib/fuzzySearch";
import * as XLSX from "xlsx";

interface ImportedProduct {
  originalRow: number;
  description: string;
  rawData: Record<string, unknown>;
}

interface ProductWithCST {
  product: ImportedProduct;
  matches: CSTRecord[];
  bestMatch: CSTRecord | null;
}

const ImportExcel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProductWithCST[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV.",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      setResults([]);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

      if (jsonData.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo não contém dados para processar.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Detectar coluna de descrição automaticamente
      const firstRow = jsonData[0];
      const columns = Object.keys(firstRow);
      
      // Prioridade: descricao, produto, nome, item, servico, ou primeira coluna com texto
      const descriptionColumnPriority = [
        'descricao', 'descrição', 'produto', 'nome', 'item', 'servico', 'serviço',
        'description', 'product', 'name', 'service', 'mercadoria', 'material'
      ];
      
      let descriptionColumn = columns.find(col => 
        descriptionColumnPriority.some(priority => 
          col.toLowerCase().includes(priority)
        )
      );
      
      // Se não encontrar, usa a primeira coluna com texto
      if (!descriptionColumn) {
        descriptionColumn = columns.find(col => 
          typeof firstRow[col] === 'string' && (firstRow[col] as string).length > 3
        ) || columns[0];
      }

      const products: ImportedProduct[] = jsonData.map((row, index) => ({
        originalRow: index + 2, // +2 porque Excel começa em 1 e tem cabeçalho
        description: String(row[descriptionColumn] || ''),
        rawData: row
      })).filter(p => p.description.trim().length > 0);

      setImportedProducts(products);
      
      toast({
        title: "Arquivo importado",
        description: `${products.length} produtos encontrados. Coluna detectada: "${descriptionColumn}"`,
      });
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível ler o arquivo. Verifique se o formato está correto.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  // Fallback CST padrão para quando não encontrar correspondência
  const defaultCST: CSTRecord = {
    cstCode: '000',
    cstDescription: 'Tributação integral',
    cClassTrib: '000001',
    cClassTribName: 'Situações tributadas integralmente pelo IBS e CBS',
    cClassTribDescription: 'Código padrão quando não há correspondência específica',
    lcArticle: 'Art. 4°',
    aliquotaType: 'Padrão',
    pRedIBS: 0,
    pRedCBS: 0,
    dIniVig: '01/01/2026',
    link: ''
  };

  // Mapeamento de NCM para cClassTrib (baseado na LC 214/2025)
  // NCM de 4 a 8 dígitos - usamos prefixos para matching
  const ncmToCategory: Record<string, { cClassTrib: string; description: string }> = {
    // Capítulo 01 - Animais vivos
    '0105': { cClassTrib: '200015', description: 'Aves vivas' },
    '0407': { cClassTrib: '200015', description: 'Ovos de aves' },
    // Capítulo 02 - Carnes
    '0201': { cClassTrib: '200003', description: 'Carnes bovinas frescas' },
    '0202': { cClassTrib: '200003', description: 'Carnes bovinas congeladas' },
    '0203': { cClassTrib: '200003', description: 'Carnes suínas' },
    '0207': { cClassTrib: '200003', description: 'Carnes de aves' },
    // Capítulo 03 - Peixes
    '0302': { cClassTrib: '200003', description: 'Peixes frescos' },
    '0303': { cClassTrib: '200003', description: 'Peixes congelados' },
    // Capítulo 04 - Laticínios e ovos
    '0401': { cClassTrib: '200003', description: 'Leite' },
    '0402': { cClassTrib: '200003', description: 'Leite concentrado' },
    '0403': { cClassTrib: '200003', description: 'Iogurte e leite fermentado' },
    '0405': { cClassTrib: '200003', description: 'Manteiga e gorduras lácteas' },
    '0406': { cClassTrib: '200003', description: 'Queijos' },
    // Capítulo 07 - Hortícolas
    '0701': { cClassTrib: '200015', description: 'Batatas' },
    '0702': { cClassTrib: '200015', description: 'Tomates' },
    '0703': { cClassTrib: '200015', description: 'Cebolas, alhos' },
    '0704': { cClassTrib: '200015', description: 'Couves, repolhos' },
    '0705': { cClassTrib: '200015', description: 'Alfaces' },
    '0706': { cClassTrib: '200015', description: 'Cenouras, nabos' },
    '0707': { cClassTrib: '200015', description: 'Pepinos' },
    '0708': { cClassTrib: '200015', description: 'Leguminosas' },
    '0709': { cClassTrib: '200015', description: 'Outros hortícolas' },
    // Capítulo 08 - Frutas
    '0803': { cClassTrib: '200015', description: 'Bananas' },
    '0804': { cClassTrib: '200015', description: 'Tâmaras, figos' },
    '0805': { cClassTrib: '200015', description: 'Cítricos' },
    '0806': { cClassTrib: '200015', description: 'Uvas' },
    '0807': { cClassTrib: '200015', description: 'Melões, melancias' },
    '0808': { cClassTrib: '200015', description: 'Maçãs, peras' },
    '0810': { cClassTrib: '200015', description: 'Morangos e outras frutas' },
    // Capítulo 09 - Café, chá
    '0901': { cClassTrib: '200003', description: 'Café' },
    // Capítulo 10 - Cereais
    '1001': { cClassTrib: '200003', description: 'Trigo' },
    '1005': { cClassTrib: '200003', description: 'Milho' },
    '1006': { cClassTrib: '200003', description: 'Arroz' },
    // Capítulo 11 - Farinhas
    '1101': { cClassTrib: '200003', description: 'Farinhas de trigo' },
    '1102': { cClassTrib: '200003', description: 'Farinhas de cereais' },
    '1103': { cClassTrib: '200003', description: 'Farinhas, sêmolas' },
    '1104': { cClassTrib: '200003', description: 'Grãos trabalhados' },
    '1106': { cClassTrib: '200003', description: 'Farinhas de leguminosas (farofa inclusa)' },
    // Capítulo 15 - Óleos
    '1507': { cClassTrib: '200003', description: 'Óleo de soja' },
    '1509': { cClassTrib: '200003', description: 'Azeite de oliva' },
    '1512': { cClassTrib: '200003', description: 'Óleo de girassol' },
    // Capítulo 16 - Preparações de carnes
    '1601': { cClassTrib: '200003', description: 'Embutidos (linguiças, salsichas)' },
    '1602': { cClassTrib: '200003', description: 'Outras preparações de carnes' },
    '1604': { cClassTrib: '200003', description: 'Conservas de peixes (sardinha, atum)' },
    // Capítulo 17 - Açúcares
    '1701': { cClassTrib: '200003', description: 'Açúcar de cana ou beterraba' },
    // Capítulo 19 - Massas e produtos de padaria
    '1902': { cClassTrib: '200003', description: 'Massas alimentícias (macarrão, espaguete)' },
    '1905': { cClassTrib: '200003', description: 'Pães, biscoitos, bolachas' },
    // Capítulo 20 - Preparações de hortícolas e frutas
    '2001': { cClassTrib: '200003', description: 'Hortícolas em conserva' },
    '2002': { cClassTrib: '200003', description: 'Tomates preparados' },
    '2005': { cClassTrib: '200003', description: 'Outros hortícolas preparados' },
    // Capítulo 21 - Preparações alimentícias diversas
    '2103': { cClassTrib: '200003', description: 'Molhos e condimentos' },
    // Capítulo 25 - Sal
    '2501': { cClassTrib: '200003', description: 'Sal' },
    // Capítulo 30 - Medicamentos
    '3003': { cClassTrib: '200009', description: 'Medicamentos não dosados' },
    '3004': { cClassTrib: '200009', description: 'Medicamentos dosados' },
  };

  // Função para buscar categoria por NCM (verifica prefixos)
  const findCategoryByNCM = (ncm: string): { cClassTrib: string; description: string } | null => {
    if (!ncm || ncm.length < 4) return null;
    
    // Tenta match exato primeiro, depois prefixos decrescentes
    for (let len = Math.min(ncm.length, 8); len >= 4; len--) {
      const prefix = ncm.substring(0, len);
      if (ncmToCategory[prefix]) {
        return ncmToCategory[prefix];
      }
    }
    return null;
  };

  // Palavras-chave PRIMÁRIAS - definem a categoria principal do produto
  const primaryKeywords: Record<string, { cClassTrib: string; weight: number }> = {
    // === PRODUTOS INDUSTRIALIZADOS SEM BENEFÍCIO - TRIBUTAÇÃO INTEGRAL (000001) ===
    // Estes produtos NÃO fazem parte da Cesta Básica e são tributados integralmente
    'doce': { cClassTrib: '000001', weight: 160 },
    'doces': { cClassTrib: '000001', weight: 160 },
    'pate': { cClassTrib: '000001', weight: 160 },
    'gelatina': { cClassTrib: '000001', weight: 160 },
    'gelatinas': { cClassTrib: '000001', weight: 160 },
    'panetone': { cClassTrib: '000001', weight: 160 },
    'panetones': { cClassTrib: '000001', weight: 160 },
    'chocotone': { cClassTrib: '000001', weight: 160 },
    'bolo': { cClassTrib: '000001', weight: 160 },
    'bolos': { cClassTrib: '000001', weight: 160 },
    'passas': { cClassTrib: '000001', weight: 160 }, // Uva passa - produto processado
    'passa': { cClassTrib: '000001', weight: 160 },
    'geleia': { cClassTrib: '000001', weight: 160 },
    'geleias': { cClassTrib: '000001', weight: 160 },
    'compota': { cClassTrib: '000001', weight: 160 },
    'sorvete': { cClassTrib: '000001', weight: 160 },
    'sorvetes': { cClassTrib: '000001', weight: 160 },
    'chocolate': { cClassTrib: '000001', weight: 160 },
    'bombom': { cClassTrib: '000001', weight: 160 },
    'bombons': { cClassTrib: '000001', weight: 160 },
    'wafer': { cClassTrib: '000001', weight: 160 },
    'torrone': { cClassTrib: '000001', weight: 160 },
    
    // === PRODUTOS PROCESSADOS - CESTA BÁSICA (200003) ===
    // Produtos industrializados que FAZEM parte da Cesta Básica
    'extrato': { cClassTrib: '200003', weight: 150 },
    'suco': { cClassTrib: '200003', weight: 150 },
    'sucos': { cClassTrib: '200003', weight: 150 },
    'nectar': { cClassTrib: '200003', weight: 150 },
    'refresco': { cClassTrib: '200003', weight: 150 },
    'molho': { cClassTrib: '200003', weight: 150 },
    'molhos': { cClassTrib: '200003', weight: 150 },
    'mistura': { cClassTrib: '200003', weight: 150 },
    'polpa': { cClassTrib: '200003', weight: 150 },
    'polpas': { cClassTrib: '200003', weight: 150 },
    'concentrado': { cClassTrib: '200003', weight: 150 },
    'preparado': { cClassTrib: '200003', weight: 140 },
    'po': { cClassTrib: '200003', weight: 130 }, // Em pó - verificar contexto
    // Massas e derivados - Cesta Básica (200003)
    'macarrao': { cClassTrib: '200003', weight: 100 },
    'espaguete': { cClassTrib: '200003', weight: 100 },
    'talharim': { cClassTrib: '200003', weight: 100 },
    'lasanha': { cClassTrib: '200003', weight: 100 },
    'penne': { cClassTrib: '200003', weight: 100 },
    'fusilli': { cClassTrib: '200003', weight: 100 },
    'rigatoni': { cClassTrib: '200003', weight: 100 },
    'ravioli': { cClassTrib: '200003', weight: 100 },
    'capeletti': { cClassTrib: '200003', weight: 100 },
    'nhoque': { cClassTrib: '200003', weight: 100 },
    'miojo': { cClassTrib: '200003', weight: 100 },
    'instantaneo': { cClassTrib: '200003', weight: 80 },
    // Grãos e cereais - Cesta Básica
    'arroz': { cClassTrib: '200003', weight: 100 },
    'feijao': { cClassTrib: '200003', weight: 100 },
    'lentilha': { cClassTrib: '200003', weight: 100 },
    'grao': { cClassTrib: '200003', weight: 80 },
    'graos': { cClassTrib: '200003', weight: 80 },
    'aveia': { cClassTrib: '200003', weight: 100 },
    'trigo': { cClassTrib: '200003', weight: 90 },
    'milho': { cClassTrib: '200003', weight: 90 },
    'fuba': { cClassTrib: '200003', weight: 100 },
    'farinha': { cClassTrib: '200003', weight: 100 },
    'farinhas': { cClassTrib: '200003', weight: 100 },
    'farofa': { cClassTrib: '000001', weight: 50 }, // Por nome não tem benefício, mas por NCM pode ter
    // Carnes - Cesta Básica
    'carne': { cClassTrib: '200003', weight: 100 },
    'carnes': { cClassTrib: '200003', weight: 100 },
    'frango': { cClassTrib: '200003', weight: 100 },
    'boi': { cClassTrib: '200003', weight: 100 },
    'bovino': { cClassTrib: '200003', weight: 100 },
    'suino': { cClassTrib: '200003', weight: 100 },
    'porco': { cClassTrib: '200003', weight: 100 },
    'peixe': { cClassTrib: '200003', weight: 100 },
    'pescado': { cClassTrib: '200003', weight: 100 },
    'linguica': { cClassTrib: '200003', weight: 100 },
    'salsicha': { cClassTrib: '200003', weight: 100 },
    'presunto': { cClassTrib: '200003', weight: 100 },
    'mortadela': { cClassTrib: '200003', weight: 100 },
    // Laticínios - Cesta Básica
    'leite': { cClassTrib: '200003', weight: 100 },
    'queijo': { cClassTrib: '200003', weight: 100 },
    'iogurte': { cClassTrib: '200003', weight: 100 },
    'manteiga': { cClassTrib: '200003', weight: 100 },
    'margarina': { cClassTrib: '200003', weight: 100 },
    'requeijao': { cClassTrib: '200003', weight: 100 },
    // Óleos e gorduras - Cesta Básica
    'oleo': { cClassTrib: '200003', weight: 100 },
    'oleos': { cClassTrib: '200003', weight: 100 },
    'azeite': { cClassTrib: '200003', weight: 100 },
    // Outros alimentos básicos - Cesta Básica
    'acucar': { cClassTrib: '200003', weight: 100 },
    'cafe': { cClassTrib: '200003', weight: 100 },
    'sal': { cClassTrib: '200003', weight: 90 },
    'pao': { cClassTrib: '200003', weight: 100 },
    'paes': { cClassTrib: '200003', weight: 100 },
    'biscoito': { cClassTrib: '200003', weight: 100 },
    'bolacha': { cClassTrib: '200003', weight: 100 },
    'bolachas': { cClassTrib: '200003', weight: 100 },
    'sardinha': { cClassTrib: '200003', weight: 100 },
    'atum': { cClassTrib: '200003', weight: 100 },
    'enlatado': { cClassTrib: '200003', weight: 90 },
    'conserva': { cClassTrib: '200003', weight: 90 },
    // Hortícolas, frutas e ovos - (200015) - APENAS para produtos in natura
    // Peso reduzido para evitar conflito com produtos processados que têm sabor de frutas
    'ovo': { cClassTrib: '200015', weight: 70 },
    'ovos': { cClassTrib: '200015', weight: 70 },
    'horticola': { cClassTrib: '200015', weight: 100 },
    'verdura': { cClassTrib: '200015', weight: 100 },
    'verduras': { cClassTrib: '200015', weight: 100 },
    'legume': { cClassTrib: '200015', weight: 100 },
    'legumes': { cClassTrib: '200015', weight: 100 },
    // Medicamentos - (200009)
    'medicamento': { cClassTrib: '200009', weight: 100 },
    'medicamentos': { cClassTrib: '200009', weight: 100 },
    'remedio': { cClassTrib: '200009', weight: 100 },
    'remedios': { cClassTrib: '200009', weight: 100 },
    'farmaceutico': { cClassTrib: '200009', weight: 100 },
  };

  // Palavras de FRUTAS/HORTÍCOLAS que podem ser produto OU sabor/ingrediente
  // Só classificam como 200015 (hortícolas) se NÃO houver um produto processado no nome
  const fruitKeywords: Record<string, { cClassTrib: string; weight: number }> = {
    'tomate': { cClassTrib: '200015', weight: 80 },
    'batata': { cClassTrib: '200015', weight: 80 },
    'cebola': { cClassTrib: '200015', weight: 80 },
    'alface': { cClassTrib: '200015', weight: 80 },
    'cenoura': { cClassTrib: '200015', weight: 80 },
    'banana': { cClassTrib: '200015', weight: 80 },
    'laranja': { cClassTrib: '200015', weight: 80 },
    'maca': { cClassTrib: '200015', weight: 80 },
    'uva': { cClassTrib: '200015', weight: 80 },
    'morango': { cClassTrib: '200015', weight: 80 },
    'melancia': { cClassTrib: '200015', weight: 80 },
    'abacaxi': { cClassTrib: '200015', weight: 80 },
    'fruta': { cClassTrib: '200015', weight: 80 },
    'frutas': { cClassTrib: '200015', weight: 80 },
    'caju': { cClassTrib: '200015', weight: 80 },
    'manga': { cClassTrib: '200015', weight: 80 },
    'maracuja': { cClassTrib: '200015', weight: 80 },
    'goiaba': { cClassTrib: '200015', weight: 80 },
    'acerola': { cClassTrib: '200015', weight: 80 },
    'pessego': { cClassTrib: '200015', weight: 80 },
    'limao': { cClassTrib: '200015', weight: 80 },
    'lima': { cClassTrib: '200015', weight: 80 },
    'tangerina': { cClassTrib: '200015', weight: 80 },
    'mamao': { cClassTrib: '200015', weight: 80 },
    'melao': { cClassTrib: '200015', weight: 80 },
    'pera': { cClassTrib: '200015', weight: 80 },
    'ameixa': { cClassTrib: '200015', weight: 80 },
    'kiwi': { cClassTrib: '200015', weight: 80 },
    'abacate': { cClassTrib: '200015', weight: 80 },
    'coco': { cClassTrib: '200015', weight: 80 },
  };

  // Palavras que indicam que o produto é PROCESSADO (não in natura)
  // Se estas palavras estiverem presentes, frutas são tratadas como SABOR, não como categoria
  const processedProductIndicators = [
    'extrato', 'suco', 'sucos', 'nectar', 'refresco', 'molho', 'molhos',
    'gelatina', 'gelatinas', 'mistura', 'panetone', 'panetones', 'chocotone',
    'bolo', 'bolos', 'passas', 'passa', 'geleia', 'geleias', 'polpa', 'polpas',
    'doce', 'doces', 'compota', 'concentrado', 'preparado', 'po', 'sabor',
    'iogurte', 'biscoito', 'bolacha', 'sorvete', 'torta', 'pudim', 'vitamina',
    'sache', 'conserva', 'enlatado', 'processado', 'industrializado',
    'pate', 'wafer', 'chocolate', 'bombom', 'torrone', 'leite' // leite em "doce de leite"
  ];

  // Palavras que são SEMPRE ingredientes/sabores quando aparecem depois da primeira palavra
  // Essas palavras NÃO definem a categoria do produto quando estão em posição secundária
  const alwaysSecondaryKeywords = [
    'ovos', 'ovo', 'bacon', 'chocolate', 'baunilha', 'alho',
    'calabresa', 'mussarela', 'cheddar', 'integral', 'light', 'diet',
    'tradicional', 'caseiro', 'artesanal', 'premium', 'especial'
  ];

  const searchCSTCodes = () => {
    setIsProcessing(true);
    
    const resultsWithCST: ProductWithCST[] = importedProducts.map(product => {
      const productDesc = product.description.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove acentos
      const productWords = productDesc.split(/\s+/).filter(w => w.length >= 3);
      
      // Tentar detectar NCM nos dados brutos
      const rawData = product.rawData;
      let ncmCode = '';
      for (const key of Object.keys(rawData)) {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('ncm') || keyLower.includes('codigo') || keyLower.includes('cod')) {
          const value = String(rawData[key] || '').replace(/\D/g, '');
          if (value.length >= 4 && value.length <= 8) {
            ncmCode = value;
            break;
          }
        }
      }
      
      // Verificar se o produto é PROCESSADO (contém indicadores de industrialização)
      const isProcessedProduct = processedProductIndicators.some(indicator => 
        productDesc.includes(indicator)
      );
      
      // Calcular pontuação baseada nas palavras-chave
      // Palavras no INÍCIO da descrição têm peso maior (são o produto principal)
      const categoryScores: Record<string, number> = {};
      
      productWords.forEach((word, index) => {
        const normalizedWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Primeiro verifica nas keywords primárias
        let keywordInfo = primaryKeywords[normalizedWord];
        
        // Se não achou nas primárias, verifica nas frutas/hortícolas
        // MAS só se o produto NÃO for processado
        if (!keywordInfo && fruitKeywords[normalizedWord]) {
          // Se é produto processado, frutas são tratadas como SABOR (peso muito baixo)
          if (isProcessedProduct) {
            // Não adiciona score de fruta para produtos processados
            return;
          } else {
            keywordInfo = fruitKeywords[normalizedWord];
          }
        }
        
        if (keywordInfo) {
          // Multiplicador de posição: palavras no início são mais importantes
          const positionMultiplier = index < 3 ? 2 : 1;
          
          // Se a palavra é secundária (ingrediente) e não está no início, reduzir peso
          const isSecondary = alwaysSecondaryKeywords.includes(normalizedWord);
          const secondaryPenalty = isSecondary && index > 0 ? 0.3 : 1;
          
          const score = keywordInfo.weight * positionMultiplier * secondaryPenalty;
          
          if (!categoryScores[keywordInfo.cClassTrib] || categoryScores[keywordInfo.cClassTrib] < score) {
            categoryScores[keywordInfo.cClassTrib] = score;
          }
        }
      });
      
      // Encontrar a categoria com maior pontuação por NOME
      let bestCategoryByName = '';
      let bestScoreByName = 0;
      for (const [category, score] of Object.entries(categoryScores)) {
        if (score > bestScoreByName) {
          bestScoreByName = score;
          bestCategoryByName = category;
        }
      }
      
      // Buscar categoria por NCM
      const ncmCategoryInfo = findCategoryByNCM(ncmCode);
      const bestCategoryByNCM = ncmCategoryInfo?.cClassTrib || '';
      
      // Buscar correspondências no cstData
      let matches: CSTRecord[] = [];
      
      // Se NCM e Nome apontam para categorias DIFERENTES, mostrar ambas opções
      if (ncmCode && bestCategoryByNCM && bestCategoryByName && bestCategoryByNCM !== bestCategoryByName) {
        // Adiciona match por NCM primeiro (prioridade)
        const ncmMatch = cstData.find(cst => cst.cClassTrib === bestCategoryByNCM);
        if (ncmMatch) {
          // Criar cópia com indicação de que veio do NCM
          matches.push({
            ...ncmMatch,
            cClassTribDescription: `[NCM ${ncmCode}] ${ncmCategoryInfo?.description || ncmMatch.cClassTribDescription}`
          });
        }
        
        // Adiciona match por nome
        const nameMatch = cstData.find(cst => cst.cClassTrib === bestCategoryByName);
        if (nameMatch) {
          matches.push({
            ...nameMatch,
            cClassTribDescription: `[Por Nome] ${nameMatch.cClassTribDescription}`
          });
        }
      } else if (ncmCode && bestCategoryByNCM) {
        // NCM disponível e válido - usar NCM como principal
        const ncmMatch = cstData.find(cst => cst.cClassTrib === bestCategoryByNCM);
        if (ncmMatch) {
          matches = [{
            ...ncmMatch,
            cClassTribDescription: `[NCM ${ncmCode}] ${ncmCategoryInfo?.description || ncmMatch.cClassTribDescription}`
          }];
        }
      } else if (bestCategoryByName) {
        // Usar categoria por nome
        const categoryMatch = cstData.find(cst => cst.cClassTrib === bestCategoryByName);
        if (categoryMatch) {
          matches = [categoryMatch];
        }
      }
      
      // Se não encontrou por categoria, usar busca fuzzy tradicional
      if (matches.length === 0) {
        matches = cstData.filter(cst => {
          if (fuzzyMatch(cst.cClassTribName, product.description, true)) return true;
          if (fuzzyMatch(cst.cClassTribDescription, product.description, true)) return true;
          if (fuzzyMatch(product.description, cst.cClassTribName, true)) return true;
          return false;
        });
      }

      // Se não encontrar correspondência, usar CST 000 / cClassTrib 000001 como padrão
      const bestMatch = matches[0] || defaultCST;

      return {
        product,
        matches: matches.length > 0 ? matches.slice(0, 5) : [defaultCST],
        bestMatch
      };
    });

    setResults(resultsWithCST);
    setIsProcessing(false);
    
    const foundCount = resultsWithCST.filter(r => r.bestMatch && r.bestMatch.cstCode !== '000').length;
    const conflictCount = resultsWithCST.filter(r => r.matches.length > 1).length;
    toast({
      title: "Busca concluída",
      description: `${foundCount} produtos com códigos específicos. ${conflictCount > 0 ? `${conflictCount} com múltiplas sugestões (NCM vs Nome).` : ''} ${importedProducts.length - foundCount} com código padrão.`,
    });
  };

  const exportResults = () => {
    const exportData = results.map(r => ({
      'Linha Original': r.product.originalRow,
      'Descrição do Produto': r.product.description,
      'CST Sugerido': r.bestMatch?.cstCode || 'Não encontrado',
      'Classificação Tributária': r.bestMatch?.cClassTribName || '-',
      'Descrição da Classificação': r.bestMatch?.cClassTribDescription || '-',
      'Artigo LC': r.bestMatch?.lcArticle || '-',
      'Redução IBS (%)': r.bestMatch?.pRedIBS ?? '-',
      'Redução CBS (%)': r.bestMatch?.pRedCBS ?? '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados CST");
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 15 }, // Linha Original
      { wch: 40 }, // Descrição
      { wch: 12 }, // CST
      { wch: 40 }, // Classificação
      { wch: 50 }, // Descrição Classificação
      { wch: 12 }, // Artigo
      { wch: 15 }, // Red IBS
      { wch: 15 }, // Red CBS
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `resultados_cst_${new Date().toISOString().slice(0,10)}.xlsx`);
    
    toast({
      title: "Exportação concluída",
      description: "Arquivo Excel com os resultados foi baixado.",
    });
  };

  const matchesCount = useMemo(() => 
    results.filter(r => r.bestMatch).length, 
    [results]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Importar Planilha</h1>
              <p className="text-sm text-slate-400">Importe seus produtos e encontre os códigos CST</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Upload Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                Upload de Planilha
              </CardTitle>
              <CardDescription className="text-slate-400">
                Importe um arquivo Excel (.xlsx, .xls) ou CSV com seus produtos/serviços. 
                O sistema detectará automaticamente a coluna de descrição.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1">
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-700/50 transition-colors">
                    <Upload className="h-10 w-10 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-300 font-medium">
                      {file ? file.name : 'Clique para selecionar ou arraste o arquivo'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Formatos aceitos: .xlsx, .xls, .csv
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {importedProducts.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-700/50 rounded-lg">
                  <div className="text-slate-300">
                    <span className="font-semibold text-white">{importedProducts.length}</span> produtos encontrados
                    {results.length > 0 && (
                      <span className="ml-2">
                        • <span className="text-green-400">{matchesCount}</span> com códigos sugeridos
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={searchCSTCodes}
                      disabled={isProcessing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Processando...' : 'Buscar Códigos CST'}
                    </Button>
                    {results.length > 0 && (
                      <Button 
                        onClick={exportResults}
                        variant="outline"
                        className="border-green-600 text-green-400 hover:bg-green-600/20"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Resultados
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Table */}
          {results.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Resultados da Análise</CardTitle>
                <CardDescription className="text-slate-400">
                  Códigos CST sugeridos para cada produto/serviço da sua planilha
                </CardDescription>
                
                {/* Aviso de conferência */}
                <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-400 font-semibold">Atenção: Conferência Obrigatória</AlertTitle>
                  <AlertDescription className="text-amber-300 text-sm">
                    Os códigos CST apresentados são <strong>sugestões</strong> baseadas na descrição e/ou NCM dos produtos. 
                    É de <strong>responsabilidade do cliente</strong> conferir se a classificação tributária sugerida 
                    condiz com as características reais do produto/serviço, consultando a legislação vigente e os anexos da LC 214/2025.
                  </AlertDescription>
                </Alert>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Linha</TableHead>
                        <TableHead className="text-slate-300">Descrição do Produto</TableHead>
                        <TableHead className="text-slate-300">CST Sugerido</TableHead>
                        <TableHead className="text-slate-300">Classificação</TableHead>
                        <TableHead className="text-slate-300">Reduções</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, index) => (
                        <TableRow key={index} className={`border-slate-700 hover:bg-slate-700/50 ${result.matches.length > 1 ? 'bg-amber-900/20' : ''}`}>
                          <TableCell className="text-slate-400 font-mono">
                            {result.product.originalRow}
                          </TableCell>
                          <TableCell className="text-white max-w-xs">
                            <div className="truncate">{result.product.description}</div>
                            {result.matches.length > 1 && (
                              <span className="text-xs text-amber-400 mt-1 block">
                                ⚠️ Múltiplas sugestões (ver classificação)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.matches.length > 1 ? (
                              <div className="flex flex-col gap-1">
                                {result.matches.slice(0, 2).map((match, i) => (
                                  <Badge 
                                    key={i} 
                                    className={`font-mono ${i === 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-500'}`}
                                  >
                                    {match.cstCode}
                                  </Badge>
                                ))}
                              </div>
                            ) : result.bestMatch ? (
                              <Badge className="bg-blue-600 hover:bg-blue-700 font-mono">
                                {result.bestMatch.cstCode}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-600">
                                Não encontrado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 max-w-sm">
                            {result.matches.length > 1 ? (
                              <div className="space-y-2">
                                {result.matches.slice(0, 2).map((match, i) => (
                                  <div key={i} className={`text-sm ${i === 0 ? 'text-green-400' : 'text-slate-400'}`}>
                                    <span className="font-medium">{match.cClassTribName}</span>
                                    <br />
                                    <span className="text-xs opacity-75">{match.cClassTribDescription}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              result.bestMatch?.cClassTribName || '-'
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {result.bestMatch ? (
                              <div className="flex gap-2">
                                <Badge variant="outline" className="border-orange-500 text-orange-400">
                                  IBS: {result.bestMatch.pRedIBS}%
                                </Badge>
                                <Badge variant="outline" className="border-purple-500 text-purple-400">
                                  CBS: {result.bestMatch.pRedCBS}%
                                </Badge>
                              </div>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImportExcel;
