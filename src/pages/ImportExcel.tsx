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

  const searchCSTCodes = () => {
    setIsProcessing(true);
    
    const resultsWithCST: ProductWithCST[] = importedProducts.map(product => {
      const productDesc = product.description.toLowerCase();
      
      // Buscar correspondências usando fuzzyMatch em todos os campos
      const matches = cstData.filter(cst => {
        // Busca em cClassTribName
        if (fuzzyMatch(cst.cClassTribName, product.description, true)) return true;
        // Busca em cClassTribDescription
        if (fuzzyMatch(cst.cClassTribDescription, product.description, true)) return true;
        // Busca inversa: produto contém termos do CST
        if (fuzzyMatch(product.description, cst.cClassTribName, true)) return true;
        return false;
      });

      // Ordenar por relevância
      const sortedMatches = matches.sort((a, b) => {
        const productWords = productDesc.split(/\s+/).filter(w => w.length >= 3);
        
        // Priorizar correspondências mais diretas
        const aScore = productWords.reduce((score, word) => {
          if (a.cClassTribName.toLowerCase().includes(word)) score += 3;
          if (a.cClassTribDescription.toLowerCase().includes(word)) score += 2;
          return score;
        }, 0);
        
        const bScore = productWords.reduce((score, word) => {
          if (b.cClassTribName.toLowerCase().includes(word)) score += 3;
          if (b.cClassTribDescription.toLowerCase().includes(word)) score += 2;
          return score;
        }, 0);
        
        // Priorizar CST 200 para alimentos (Cesta Básica)
        const isAFood = a.cClassTribName.toLowerCase().includes('cesta') || 
                        a.cClassTribName.toLowerCase().includes('aliment') ||
                        a.cClassTribName.toLowerCase().includes('horticola') ||
                        a.cClassTribName.toLowerCase().includes('frutas');
        const isBFood = b.cClassTribName.toLowerCase().includes('cesta') || 
                        b.cClassTribName.toLowerCase().includes('aliment') ||
                        b.cClassTribName.toLowerCase().includes('horticola') ||
                        b.cClassTribName.toLowerCase().includes('frutas');
        
        if (isAFood && !isBFood) return -1;
        if (!isAFood && isBFood) return 1;
        
        return bScore - aScore;
      });

      // Se não encontrar correspondência, usar CST 000 / cClassTrib 000001 como padrão
      const bestMatch = sortedMatches[0] || defaultCST;

      return {
        product,
        matches: sortedMatches.length > 0 ? sortedMatches.slice(0, 5) : [defaultCST],
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
