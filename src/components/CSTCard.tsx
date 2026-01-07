import { ExternalLink, Percent, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CSTRecord } from "@/data/cstData";

interface CSTCardProps {
  record: CSTRecord;
  index: number;
}

const getReductionColor = (reduction: number) => {
  if (reduction === 100) return "bg-success text-success-foreground";
  if (reduction >= 60) return "bg-primary text-primary-foreground";
  if (reduction >= 30) return "bg-accent text-accent-foreground";
  return "bg-secondary text-secondary-foreground";
};

export const CSTCard = ({ record, index }: CSTCardProps) => {
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
        
        <Button
          variant="outline"
          size="sm"
          asChild
          className="w-full mt-2 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <a href={record.link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver na LC 214/2025
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};
