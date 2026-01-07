import { useState, useMemo } from "react";
import { ExternalLink, FileText, Percent, Book, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Anexo } from "@/data/anexosData";

interface AnexoModalProps {
  anexo: Anexo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AnexoModal = ({ anexo, isOpen, onClose }: AnexoModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItens = useMemo(() => {
    if (!anexo) return [];
    if (!searchTerm.trim()) return anexo.itens;
    
    const term = searchTerm.toLowerCase();
    return anexo.itens.filter(
      item => 
        item.produto.toLowerCase().includes(term) ||
        item.ncm.toLowerCase().includes(term)
    );
  }, [anexo, searchTerm]);

  if (!anexo) return null;

  const isAliquotaZero = anexo.reducao.includes("100%") || anexo.reducao.includes("Zero");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-0 font-semibold"
              >
                {anexo.numero}
              </Badge>
              <DialogTitle className="text-2xl font-bold text-white">
                {anexo.titulo}
              </DialogTitle>
              <p className="text-white/80 text-sm">
                {anexo.descricao}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <Badge 
              className={`${isAliquotaZero ? 'bg-success' : 'bg-white/20'} text-white border-0`}
            >
              <Percent className="h-3 w-3 mr-1" />
              Redução: {anexo.reducao}
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <FileText className="h-3 w-3 mr-1" />
              {anexo.artigo}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou NCM..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                <Book className="h-4 w-4" />
                <span>{filteredItens.length} de {anexo.itens.length} itens</span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Produto/Serviço</TableHead>
                  <TableHead className="font-semibold">NCM/NBS</TableHead>
                  <TableHead className="font-semibold">Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItens.map((item, index) => (
                  <TableRow key={index} className="table-row-hover">
                    <TableCell className="font-medium">{item.produto}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {item.ncm}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.observacao || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Dados baseados na Lei Complementar nº 214/2025
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
            <Button size="sm" asChild>
              <a 
                href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Lei Completa
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
