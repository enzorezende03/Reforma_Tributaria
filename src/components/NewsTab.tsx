import { Newspaper, ExternalLink, Calendar, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Notícias estáticas sobre a Reforma Tributária
const newsData = [
  {
    id: 1,
    title: "Lei Complementar 214/2025 é publicada e regulamenta a Reforma Tributária",
    description: "A nova lei estabelece as regras para o IBS e CBS, unificando tributos sobre consumo no Brasil.",
    date: "16/01/2025",
    source: "Governo Federal",
    category: "Legislação",
    url: "https://www.planalto.gov.br"
  },
  {
    id: 2,
    title: "Tabela cClassTrib define novos códigos de situação tributária",
    description: "Os novos códigos CST para IBS e CBS entram em vigor em 01/01/2026, substituindo os códigos atuais de ICMS e IPI.",
    date: "15/01/2025",
    source: "Receita Federal",
    category: "Códigos",
    url: "https://www.gov.br/receitafederal"
  },
  {
    id: 3,
    title: "Período de transição da Reforma Tributária: o que muda em 2026",
    description: "Empresas devem se preparar para a coexistência dos sistemas tributários durante o período de transição.",
    date: "14/01/2025",
    source: "CFC",
    category: "Transição",
    url: "https://cfc.org.br"
  },
  {
    id: 4,
    title: "Alíquotas reduzidas para setores específicos são definidas",
    description: "Saúde, educação e transporte público terão alíquotas diferenciadas conforme anexos da LC 214/2025.",
    date: "13/01/2025",
    source: "Ministério da Fazenda",
    category: "Alíquotas",
    url: "https://www.gov.br/fazenda"
  },
  {
    id: 5,
    title: "Split Payment será obrigatório para recolhimento do IBS e CBS",
    description: "O novo sistema de pagamento dividido promete reduzir a sonegação e simplificar a arrecadação.",
    date: "12/01/2025",
    source: "CONFAZ",
    category: "Arrecadação",
    url: "https://www.confaz.fazenda.gov.br"
  },
  {
    id: 6,
    title: "Cashback tributário beneficiará famílias de baixa renda",
    description: "O mecanismo de devolução de tributos será implementado para reduzir a regressividade do sistema.",
    date: "11/01/2025",
    source: "Ministério da Fazenda",
    category: "Social",
    url: "https://www.gov.br/fazenda"
  }
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "Legislação": "bg-blue-500/10 text-blue-700 border-blue-500/30",
    "Códigos": "bg-purple-500/10 text-purple-700 border-purple-500/30",
    "Transição": "bg-amber-500/10 text-amber-700 border-amber-500/30",
    "Alíquotas": "bg-green-500/10 text-green-700 border-green-500/30",
    "Arrecadação": "bg-red-500/10 text-red-700 border-red-500/30",
    "Social": "bg-teal-500/10 text-teal-700 border-teal-500/30",
  };
  return colors[category] || "bg-gray-500/10 text-gray-700 border-gray-500/30";
};

export const NewsTab = () => {
  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Newspaper className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Notícias da Reforma Tributária</h2>
            <p className="text-sm text-muted-foreground">Últimas atualizações sobre a LC 214/2025</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Grid de notícias */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {newsData.map((news) => (
          <Card 
            key={news.id} 
            className="group hover:shadow-lg transition-all duration-300 hover:border-blue-500/30 cursor-pointer"
            onClick={() => window.open(news.url, '_blank')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className={getCategoryColor(news.category)}>
                  {news.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {news.date}
                </div>
              </div>
              <CardTitle className="text-base leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                {news.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-3 mb-3">
                {news.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {news.source}
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aviso */}
      <div className="text-center py-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          As notícias são atualizadas periodicamente. Consulte sempre as fontes oficiais para informações detalhadas.
        </p>
      </div>
    </div>
  );
};
