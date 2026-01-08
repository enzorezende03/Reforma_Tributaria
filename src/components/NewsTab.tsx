import { useState, useEffect } from "react";
import { Newspaper, Calendar, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface News {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  published_at: string;
}

export const NewsTab = () => {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  const fetchNews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('id, title, content, summary, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    
    if (!error && data) {
      setNews(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchNews}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Grid de notícias */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando notícias...</div>
      ) : news.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Nenhuma notícia disponível no momento.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <Card 
              key={item.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:border-blue-500/30 cursor-pointer"
              onClick={() => setSelectedNews(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                    Notícia
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.published_at)}
                  </div>
                </div>
                <CardTitle className="text-base leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3">
                  {item.summary || item.content}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Aviso */}
      <div className="text-center py-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          As notícias são gerenciadas pela 2M Contabilidade.
        </p>
      </div>

      {/* Modal de detalhes da notícia */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              {selectedNews && formatDate(selectedNews.published_at)}
            </div>
            <DialogTitle className="text-xl">{selectedNews?.title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none mt-4">
            <p className="whitespace-pre-wrap text-foreground">{selectedNews?.content}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};