import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { FilterChips } from "@/components/FilterChips";
import { StatsCards } from "@/components/StatsCards";
import { CSTCard } from "@/components/CSTCard";
import { AnexoModal } from "@/components/AnexoModal";
import { cstData } from "@/data/cstData";
import { getAnexoById, type Anexo } from "@/data/anexosData";
import { fuzzyMatch } from "@/lib/fuzzySearch";
import { SearchX, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Registro padrão CST 000 / cClassTrib 000001 para quando não encontrar resultados
const defaultRecord = cstData.find(r => r.cstCode === "000" && r.cClassTrib === "000001");

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedAnexo, setSelectedAnexo] = useState<Anexo | null>(null);
  const [isAnexoModalOpen, setIsAnexoModalOpen] = useState(false);
  const [useSimilarSearch, setUseSimilarSearch] = useState(true);

  const { filteredRecords, showingDefault } = useMemo(() => {
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
      return { filteredRecords: [defaultRecord], showingDefault: true };
    }

    return { filteredRecords: results, showingDefault: false };
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Search Section */}
        <section className="-mt-20 relative z-10">
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
          {showingDefault && (
            <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                <strong>"{searchQuery}"</strong> não possui classificação específica. Sugerimos o CST 000 - Tributação integral (cClassTrib 000001).
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
