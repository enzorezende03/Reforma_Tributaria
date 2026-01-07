import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = "Buscar por código CST, cClassTrib ou descrição..." }: SearchBarProps) => {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="h-5 w-5" />
      </div>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-12 pr-12 h-14 text-base rounded-xl border-2 border-border bg-card shadow-md search-input focus:border-primary transition-all duration-300"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
