import { Badge } from "@/components/ui/badge";
import { cstCodes } from "@/data/cstData";

interface FilterChipsProps {
  selectedFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export const FilterChips = ({ selectedFilter, onFilterChange }: FilterChipsProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Badge
        variant={selectedFilter === null ? "default" : "outline"}
        className={`cursor-pointer px-4 py-2 text-sm transition-all duration-200 hover:scale-105 ${
          selectedFilter === null 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-primary/10"
        }`}
        onClick={() => onFilterChange(null)}
      >
        Todos
      </Badge>
      {cstCodes.map((cst) => (
        <Badge
          key={cst.code}
          variant={selectedFilter === cst.code ? "default" : "outline"}
          className={`cursor-pointer px-4 py-2 text-sm transition-all duration-200 hover:scale-105 ${
            selectedFilter === cst.code 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-primary/10"
          }`}
          onClick={() => onFilterChange(cst.code)}
        >
          CST {cst.code}
        </Badge>
      ))}
    </div>
  );
};
