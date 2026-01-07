import { FileCheck, Percent, Scale, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalRecords: number;
  filteredRecords: number;
}

export const StatsCards = ({ totalRecords, filteredRecords }: StatsCardsProps) => {
  const stats = [
    {
      icon: FileCheck,
      label: "Total de Códigos",
      value: totalRecords,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: Scale,
      label: "Resultados",
      value: filteredRecords,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      icon: Percent,
      label: "Com Redução",
      value: "IBS/CBS",
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      icon: TrendingDown,
      label: "Até",
      value: "100%",
      color: "text-warning",
      bgColor: "bg-warning/10"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.label} 
          className="border-0 shadow-sm animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
