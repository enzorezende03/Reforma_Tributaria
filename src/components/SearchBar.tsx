import { Search, X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  useSimilar?: boolean;
  onToggleSimilar?: () => void;
}

export const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Buscar por código CST, cClassTrib ou descrição...",
  useSimilar = true,
  onToggleSimilar
}: SearchBarProps) => {
  return (
    <div className="space-y-3">
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
      
      {onToggleSimilar && (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={useSimilar}
                  onPressedChange={onToggleSimilar}
                  className="gap-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  aria-label="Buscar termos similares"
                >
                  <Sparkles className="h-4 w-4" />
                  Buscar termos similares
                </Toggle>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Quando ativo, busca também por sinônimos e termos relacionados. Ex: "remédio" também encontra "medicamento".</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};
