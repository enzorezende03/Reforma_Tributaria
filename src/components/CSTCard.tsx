import { ExternalLink, Percent, Calendar, FileText, BookOpen, Settings2, Scale, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CSTRecord } from "@/data/cstData";
import { extractAnexoNumber } from "@/data/anexosData";
import { isServicoRecord, findIndOpByServico, getIndOpDetails } from "@/data/indOpData";
import { useState } from "react";

interface CSTCardProps {
  record: CSTRecord;
  index: number;
  onOpenAnexo?: (anexoId: string) => void;
}

const getReductionColor = (reduction: number) => {
  if (reduction === 100) return "bg-success text-success-foreground";
  if (reduction >= 60) return "bg-primary text-primary-foreground";
  if (reduction >= 30) return "bg-accent text-accent-foreground";
  return "bg-secondary text-secondary-foreground";
};

export const CSTCard = ({ record, index, onOpenAnexo }: CSTCardProps) => {
  const [isRequisitosOpen, setIsRequisitosOpen] = useState(false);
  
  // Detectar se há referência a anexo na descrição ou nome
  const anexoId = extractAnexoNumber(record.cClassTribName) || extractAnexoNumber(record.cClassTribDescription);
  
  // Verificar se é prestação de serviço e obter códigos indOp
  const isServico = isServicoRecord(record.cClassTribName, record.cClassTribDescription);
  const indOpCodes = isServico ? findIndOpByServico(record.cClassTribName) : [];
  const primaryIndOp = indOpCodes.length > 0 ? getIndOpDetails(indOpCodes[0]) : undefined;
  
  // Verificar se há requisitos legais
  const hasRequisitos = record.requisitosLegais && record.requisitosLegais.length > 0;
  
  return (
    <Card 
      className="card-elevated border-0 overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className="badge-cst text-lg px-3 py-1.5 bg-primary/10 border-primary/30 text-primary font-semibold"
            >
              CST {record.cstCode}
            </Badge>
            <Badge 
              variant="secondary" 
              className="badge-cst text-sm px-2.5 py-1 font-medium"
            >
              {record.cClassTrib}
            </Badge>
          </div>
          <div className="flex gap-2">
            {record.pRedIBS > 0 && (
              <Badge className={`${getReductionColor(record.pRedIBS)} text-xs`}>
                <Percent className="h-3 w-3 mr-1" />
                IBS -{record.pRedIBS}%
              </Badge>
            )}
            {record.pRedCBS > 0 && (
              <Badge className={`${getReductionColor(record.pRedCBS)} text-xs`}>
                <Percent className="h-3 w-3 mr-1" />
                CBS -{record.pRedCBS}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground text-lg leading-tight">
            {record.cClassTribName}
          </h3>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            {record.cClassTribDescription}
          </p>
        </div>
        
        {/* Indicador de Operação para prestação de serviços */}
        {isServico && indOpCodes.length > 0 && (
          <TooltipProvider>
            <div className="bg-accent/30 rounded-lg p-3 border border-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm font-semibold text-accent-foreground">
                  Indicador de Operação (indOp) - Art. 11
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {indOpCodes.map((code) => {
                  const details = getIndOpDetails(code);
                  return (
                    <Tooltip key={code}>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="secondary" 
                          className="bg-accent text-accent-foreground cursor-help font-mono text-xs px-2 py-1"
                        >
                          {code}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{details?.tipoOperacao}</p>
                          <p className="text-muted-foreground">{details?.localFornecimentoDfe}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              {primaryIndOp && (
                <p className="text-xs text-muted-foreground mt-2">
                  Local do fornecimento no DFe: {primaryIndOp.localFornecimentoDfe}
                </p>
              )}
            </div>
          </TooltipProvider>
        )}
        
        {/* Requisitos Legais para obter o benefício */}
        {hasRequisitos && (
          <Collapsible open={isRequisitosOpen} onOpenChange={setIsRequisitosOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 h-auto bg-success/10 hover:bg-success/20 border border-success/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-success" />
                  <span className="text-sm font-semibold text-success">
                    Requisitos Legais para o Benefício
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-success transition-transform ${isRequisitosOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-success/5 rounded-lg p-4 border border-success/20 space-y-4">
                {record.requisitosLegais?.map((requisito, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {requisito.titulo}
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {requisito.itens.map((item, itemIdx) => (
                        <li 
                          key={itemIdx} 
                          className={`leading-relaxed ${item.startsWith('   ') ? 'ml-4' : ''}`}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="font-medium">{record.lcArticle}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Vigência: {record.dIniVig}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {record.aliquotaType}
          </Badge>
        </div>
        
        <div className="flex gap-2 mt-2">
          {anexoId && onOpenAnexo && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenAnexo(anexoId)}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Anexo {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'][parseInt(anexoId) - 1] || anexoId}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
            className={`${anexoId && onOpenAnexo ? 'flex-1' : 'w-full'} hover:bg-secondary`}
          >
            <a href={record.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver na LC 214/2025
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
