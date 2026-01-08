import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Newspaper,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface News {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  published_at: string;
  is_published: boolean;
  created_at: string;
  tags: string[];
}

const TAG_OPTIONS = [
  'Legislação',
  'Códigos',
  'Transição',
  'Alíquotas',
  'Arrecadação',
  'Social',
  'IBS',
  'CBS',
  'IS',
  'Geral'
];

export const NewsManagement = () => {
  const { toast } = useToast();
  
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  
  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false });
    
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notícias',
        variant: 'destructive',
      });
    } else {
      setNews(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormSummary('');
    setFormTags([]);
    setFormIsPublished(false);
    setFormError('');
  };

  const toggleTag = (tag: string) => {
    setFormTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddNews = async () => {
    setFormError('');
    
    if (!formTitle.trim()) {
      setFormError('Digite o título da notícia');
      return;
    }
    
    if (!formContent.trim()) {
      setFormError('Digite o conteúdo da notícia');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('news').insert({
      title: formTitle.trim(),
      content: formContent.trim(),
      summary: formSummary.trim() || null,
      tags: formTags,
      is_published: formIsPublished,
      published_at: new Date().toISOString(),
    });

    if (error) {
      setFormError('Erro ao cadastrar notícia');
    } else {
      toast({
        title: 'Sucesso',
        description: 'Notícia cadastrada com sucesso',
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchNews();
    }

    setIsSubmitting(false);
  };

  const handleEditNews = async () => {
    if (!selectedNews) return;
    setFormError('');
    
    if (!formTitle.trim()) {
      setFormError('Digite o título da notícia');
      return;
    }
    
    if (!formContent.trim()) {
      setFormError('Digite o conteúdo da notícia');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('news')
      .update({
        title: formTitle.trim(),
        content: formContent.trim(),
        summary: formSummary.trim() || null,
        tags: formTags,
        is_published: formIsPublished,
      })
      .eq('id', selectedNews.id);

    if (error) {
      setFormError('Erro ao atualizar notícia');
    } else {
      toast({
        title: 'Sucesso',
        description: 'Notícia atualizada com sucesso',
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchNews();
    }

    setIsSubmitting(false);
  };

  const handleDeleteNews = async () => {
    if (!selectedNews) return;
    
    setIsSubmitting(true);

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', selectedNews.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a notícia',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Notícia excluída com sucesso',
      });
      setIsDeleteModalOpen(false);
      fetchNews();
    }

    setIsSubmitting(false);
  };

  const handleTogglePublished = async (newsItem: News) => {
    const { error } = await supabase
      .from('news')
      .update({ is_published: !newsItem.is_published })
      .eq('id', newsItem.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status',
        variant: 'destructive',
      });
    } else {
      fetchNews();
    }
  };

  const openEditModal = (newsItem: News) => {
    setSelectedNews(newsItem);
    setFormTitle(newsItem.title);
    setFormContent(newsItem.content);
    setFormSummary(newsItem.summary || '');
    setFormTags(newsItem.tags || []);
    setFormIsPublished(newsItem.is_published);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsDeleteModalOpen(true);
  };

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Gerenciar Notícias
          </CardTitle>
          <CardDescription>Crie e gerencie as notícias exibidas para os clientes</CardDescription>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Notícia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Notícia</DialogTitle>
              <DialogDescription>Preencha os dados da notícia</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Título da notícia"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Resumo (exibido no card)</Label>
                <Textarea
                  placeholder="Breve resumo da notícia..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo *</Label>
                <Textarea
                  placeholder="Conteúdo completo da notícia..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={formTags.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${
                        formTags.includes(tag) 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formIsPublished}
                  onCheckedChange={setFormIsPublished}
                />
                <Label>Publicar imediatamente</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddNews} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Criar Notícia'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar notícias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Nenhuma notícia encontrada' : 'Nenhuma notícia cadastrada'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNews.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <span className="font-medium line-clamp-1">{item.title}</span>
                      {item.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.summary}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      {item.tags && item.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.published_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.is_published}
                        onCheckedChange={() => handleTogglePublished(item)}
                      />
                      <Badge variant={item.is_published ? 'default' : 'secondary'}>
                        {item.is_published ? (
                          <><Eye className="h-3 w-3 mr-1" /> Publicado</>
                        ) : (
                          <><EyeOff className="h-3 w-3 mr-1" /> Rascunho</>
                        )}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(item)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(item)}
                        title="Excluir"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Notícia</DialogTitle>
            <DialogDescription>Atualize os dados da notícia</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Título da notícia"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Resumo (exibido no card)</Label>
              <Textarea
                placeholder="Breve resumo da notícia..."
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo *</Label>
              <Textarea
                placeholder="Conteúdo completo da notícia..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={formTags.includes(tag) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      formTags.includes(tag) 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formIsPublished}
                onCheckedChange={setFormIsPublished}
              />
              <Label>Publicado</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditNews} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Notícia</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a notícia "{selectedNews?.title}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteNews} disabled={isSubmitting}>
              {isSubmitting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
