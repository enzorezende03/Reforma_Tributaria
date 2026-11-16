import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useTaxBase } from "@/contexts/TaxBaseContext";

interface FilterChipsProps {
  selectedFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export const FilterChips = ({ selectedFilter, onFilterChange }: FilterChipsProps) => {
  const { data } = useTaxBase();
  const codes = useMemo(
    () => Array.from(new Set(data.cstData.map((record) => record.cstCode))).sort(),
    [data.cstData],
  );

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Badge
        variant={selectedFilter === null ? "default" : "outline"}
        className={`cursor-pointer px-4 py-2 text-sm transition-all duration-200 hover:scale-105 ${selectedFilter === null ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
        onClick={() => onFilterChange(null)}
      >
        Todos
      </Badge>
      {codes.map((code) => (
        <Badge
          key={code}
          variant={selectedFilter === code ? "default" : "outline"}
          className={`cursor-pointer px-4 py-2 text-sm transition-all duration-200 hover:scale-105 ${selectedFilter === code ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
          onClick={() => onFilterChange(code)}
        >
          CST {code}
        </Badge>
      ))}
    </div>
  );
};
