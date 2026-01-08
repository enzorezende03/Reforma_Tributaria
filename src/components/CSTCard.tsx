import { ExternalLink, Percent, Calendar, FileText, BookOpen, Settings2, Scale, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-blue-800 dark:text-blue-300">
                Indicador de Operação para o DFe
              </span>
              <Badge variant="outline" className="text-xs font-normal border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400">
                Art. 11 LC 214/2025
              </Badge>
            </div>
            
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Utilize um dos códigos abaixo no campo <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded font-mono text-xs">indOp</code> do documento fiscal, 
              conforme o local onde o serviço é prestado:
            </p>
            
            <div className="space-y-2">
              {indOpCodes.map((code) => {
                const details = getIndOpDetails(code);
                if (!details) return null;
                return (
                  <div 
                    key={code} 
                    className="flex items-start gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-md border border-blue-100 dark:border-blue-900"
                  >
                    <Badge className="bg-blue-600 text-white font-mono text-sm px-2.5 py-1 shrink-0">
                      {code}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {details.localFornecimentoDfe}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {details.tipoOperacao}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Escolha o código que corresponde ao local onde o serviço está sendo efetivamente prestado.
            </p>
          </div>
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
