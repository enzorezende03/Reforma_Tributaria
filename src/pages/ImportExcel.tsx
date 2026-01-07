import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileSpreadsheet, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

  // Palavras-chave PRIMÁRIAS - definem a categoria principal do produto
  const primaryKeywords: Record<string, { cClassTrib: string; weight: number }> = {
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
    // Hortícolas, frutas e ovos - (200015) - peso menor que alimentos processados
    'ovo': { cClassTrib: '200015', weight: 70 },
    'ovos': { cClassTrib: '200015', weight: 70 },
    'tomate': { cClassTrib: '200015', weight: 100 },
    'batata': { cClassTrib: '200015', weight: 100 },
    'cebola': { cClassTrib: '200015', weight: 100 },
    'alface': { cClassTrib: '200015', weight: 100 },
    'cenoura': { cClassTrib: '200015', weight: 100 },
    'banana': { cClassTrib: '200015', weight: 100 },
    'laranja': { cClassTrib: '200015', weight: 100 },
    'maca': { cClassTrib: '200015', weight: 100 },
    'uva': { cClassTrib: '200015', weight: 100 },
    'morango': { cClassTrib: '200015', weight: 100 },
    'melancia': { cClassTrib: '200015', weight: 100 },
    'abacaxi': { cClassTrib: '200015', weight: 100 },
    'horticola': { cClassTrib: '200015', weight: 100 },
    'fruta': { cClassTrib: '200015', weight: 100 },
    'frutas': { cClassTrib: '200015', weight: 100 },
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

  // Palavras que são SECUNDÁRIAS (ingredientes, sabores, etc.) e não definem a categoria
  const secondaryKeywords = [
    'ovos', 'ovo', 'queijo', 'carne', 'frango', 'bacon', 'chocolate',
    'morango', 'baunilha', 'limao', 'laranja', 'cebola', 'alho', 'tomate',
    'calabresa', 'presunto', 'mussarela', 'cheddar', 'leite'
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
      
      // Calcular pontuação baseada nas palavras-chave
      // Palavras no INÍCIO da descrição têm peso maior (são o produto principal)
      const categoryScores: Record<string, number> = {};
      
      productWords.forEach((word, index) => {
        const normalizedWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const keywordInfo = primaryKeywords[normalizedWord];
        
        if (keywordInfo) {
          // Multiplicador de posição: palavras no início são mais importantes
          const positionMultiplier = index < 3 ? 2 : 1;
          
          // Se a palavra é secundária (ingrediente) e não está no início, reduzir peso
          const isSecondary = secondaryKeywords.includes(normalizedWord);
          const secondaryPenalty = isSecondary && index > 0 ? 0.3 : 1;
          
          const score = keywordInfo.weight * positionMultiplier * secondaryPenalty;
          
          if (!categoryScores[keywordInfo.cClassTrib] || categoryScores[keywordInfo.cClassTrib] < score) {
            categoryScores[keywordInfo.cClassTrib] = score;
          }
        }
      });
      
      // Encontrar a categoria com maior pontuação
      let bestCategory = '';
      let bestScore = 0;
      for (const [category, score] of Object.entries(categoryScores)) {
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }
      
      // Buscar correspondências no cstData
      let matches: CSTRecord[] = [];
      
      if (bestCategory) {
        // Priorizar a categoria detectada
        const categoryMatch = cstData.find(cst => cst.cClassTrib === bestCategory);
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
    toast({
      title: "Busca concluída",
      description: `${foundCount} produtos com códigos específicos. ${importedProducts.length - foundCount} produtos com código padrão (CST 000).`,
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
                        <TableRow key={index} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-slate-400 font-mono">
                            {result.product.originalRow}
                          </TableCell>
                          <TableCell className="text-white max-w-xs truncate">
                            {result.product.description}
                          </TableCell>
                          <TableCell>
                            {result.bestMatch ? (
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
                            {result.bestMatch?.cClassTribName || '-'}
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
