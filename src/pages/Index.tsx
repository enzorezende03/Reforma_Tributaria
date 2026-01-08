import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { FilterChips } from "@/components/FilterChips";
import { StatsCards } from "@/components/StatsCards";
import { CSTCard } from "@/components/CSTCard";
import { AnexoModal } from "@/components/AnexoModal";
import { NewsTab } from "@/components/NewsTab";
import { SimuladorTab } from "@/components/SimuladorTab";
import ClientChangePasswordModal from "@/components/ClientChangePasswordModal";
import { cstData, findByNCM } from "@/data/cstData";
import { getAnexoById, type Anexo } from "@/data/anexosData";
import { fuzzyMatch } from "@/lib/fuzzySearch";
import { SearchX, AlertCircle, FileSpreadsheet, Search, Newspaper, CheckCircle2, ShieldAlert, Calculator } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Registro padrão CST 000 / cClassTrib 000001 para quando não encontrar resultados
const defaultRecord = cstData.find(r => r.cstCode === "000" && r.cClassTrib === "000001");

const Index = () => {
  const navigate = useNavigate();
  const { client, setMustChangePassword } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedAnexo, setSelectedAnexo] = useState<Anexo | null>(null);
  const [isAnexoModalOpen, setIsAnexoModalOpen] = useState(false);
  const [useSimilarSearch, setUseSimilarSearch] = useState(true);
  const [activeTab, setActiveTab] = useState("consulta");

  const { filteredRecords, showingDefault, ncmMatch } = useMemo(() => {
    // Verificar se a busca é um NCM (apenas números, 4-8 dígitos)
    const cleanQuery = searchQuery.replace(/\D/g, '');
    const isNCMSearch = cleanQuery.length >= 4 && cleanQuery.length <= 8 && /^\d+$/.test(cleanQuery);
    
    let ncmMatchResult: { cClassTrib: string; description: string; anexo: string } | null = null;
    
    if (isNCMSearch) {
      ncmMatchResult = findByNCM(cleanQuery);
      
      if (ncmMatchResult) {
        // Buscar registros que correspondem ao cClassTrib do NCM
        const ncmResults = cstData.filter(record => 
          record.cClassTrib === ncmMatchResult!.cClassTrib &&
          (selectedFilter === null || record.cstCode === selectedFilter)
        );
        
        if (ncmResults.length > 0) {
          return { filteredRecords: ncmResults, showingDefault: false, ncmMatch: ncmMatchResult };
        }
      }
    }
    
    const results = cstData.filter((record) => {
      const matchesFilter = selectedFilter === null || record.cstCode === selectedFilter;
      
      if (!searchQuery) return matchesFilter;
      
      const searchableFields = [
        record.cstCode,
        record.cstDescription,
        record.cClassTrib,
        record.cClassTribName,
        record.cClassTribDescription,
        record.lcArticle
      ].join(" ");
      
      const matchesSearch = fuzzyMatch(searchableFields, searchQuery, useSimilarSearch);
      
      return matchesFilter && matchesSearch;
    });

    // Se há busca ativa e não encontrou resultados, mostrar o registro padrão
    if (searchQuery && results.length === 0 && defaultRecord && selectedFilter === null) {
      return { filteredRecords: [defaultRecord], showingDefault: true, ncmMatch: null };
    }

    return { filteredRecords: results, showingDefault: false, ncmMatch: null };
  }, [searchQuery, selectedFilter, useSimilarSearch]);

  const handleOpenAnexo = (anexoId: string) => {
    const anexo = getAnexoById(anexoId);
    if (anexo) {
      setSelectedAnexo(anexo);
      setIsAnexoModalOpen(true);
    }
  };

  const handleCloseAnexo = () => {
    setIsAnexoModalOpen(false);
    setSelectedAnexo(null);
  };

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modal de troca de senha obrigatória para clientes */}
      {client?.mustChangePassword && (
        <ClientChangePasswordModal
          isOpen={true}
          clientId={client.id}
          onPasswordChanged={handlePasswordChanged}
        />
      )}

      <Header />
      
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="-mt-16 relative z-10">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-white shadow-lg">
              <TabsTrigger value="consulta" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Search className="h-4 w-4" />
                Consulta CST
              </TabsTrigger>
              <TabsTrigger value="simulador" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Calculator className="h-4 w-4" />
                Simulador
              </TabsTrigger>
              <TabsTrigger value="noticias" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Newspaper className="h-4 w-4" />
                Notícias
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Aba Consulta */}
          <TabsContent value="consulta" className="space-y-8 mt-0">
            {/* Search Section */}
            <section>
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery}
                useSimilar={useSimilarSearch}
                onToggleSimilar={() => setUseSimilarSearch(prev => !prev)}
              />
            </section>

            {/* Stats */}
            <section className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <StatsCards 
                totalRecords={cstData.length} 
                filteredRecords={filteredRecords.length} 
              />
              <Button 
                onClick={() => navigate('/importar')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Importar Planilha
              </Button>
            </section>

            {/* Filters */}
            <section className="py-4">
              <h2 className="text-sm font-medium text-muted-foreground text-center mb-4">
                Filtrar por CST:
              </h2>
              <FilterChips 
                selectedFilter={selectedFilter} 
                onFilterChange={setSelectedFilter} 
              />
            </section>

            {/* Results */}
            <section>
              {ncmMatch && (
                <Alert className="mb-6 border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    <strong>NCM {searchQuery}</strong> encontrado no <strong>{ncmMatch.anexo}</strong>: {ncmMatch.description} - Classificação tributária com benefício fiscal (Alíquota Reduzida ou Zero).
                  </AlertDescription>
                </Alert>
              )}
              
              {showingDefault && (
                <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    <strong>"{searchQuery}"</strong> não possui classificação específica. Sugerimos o CST 000 - Tributação integral (cClassTrib 000001).
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Aviso de conferência */}
              {filteredRecords.length > 0 && searchQuery && (
                <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
                  <ShieldAlert className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-700 dark:text-blue-400 font-semibold">Atenção: Conferência Obrigatória</AlertTitle>
                  <AlertDescription className="text-blue-600 dark:text-blue-300 text-sm">
                    Os códigos CST apresentados são <strong>sugestões</strong> baseadas na descrição informada. 
                    É de <strong>responsabilidade do cliente</strong> conferir se a classificação tributária sugerida 
                    condiz com as características reais do produto/serviço, consultando a legislação vigente e os anexos da LC 214/2025.
                  </AlertDescription>
                </Alert>
              )}

              {filteredRecords.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {filteredRecords.map((record, index) => (
                    <CSTCard 
                      key={`${record.cClassTrib}-${index}`} 
                      record={record} 
                      index={index}
                      onOpenAnexo={handleOpenAnexo}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <SearchX className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    Tente ajustar sua busca ou remover os filtros aplicados.
                  </p>
                </div>
              )}
            </section>
          </TabsContent>

          {/* Aba Simulador */}
          <TabsContent value="simulador" className="mt-0">
            <SimuladorTab />
          </TabsContent>

          {/* Aba Notícias */}
          <TabsContent value="noticias" className="mt-0">
            <NewsTab />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center pt-8 pb-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Dados baseados na Lei Complementar nº 214, de 2025 • Reforma Tributária Brasileira
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Sistema desenvolvido para consulta e orientação. Consulte sempre a legislação oficial.
          </p>
        </footer>
      </main>

      {/* Anexo Modal */}
      <AnexoModal 
        anexo={selectedAnexo}
        isOpen={isAnexoModalOpen}
        onClose={handleCloseAnexo}
      />
    </div>
  );
};

export default Index;
