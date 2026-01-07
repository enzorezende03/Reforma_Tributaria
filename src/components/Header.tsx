import { Scale, FileText } from "lucide-react";

export const Header = () => {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent py-16 px-6">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
      </div>
      
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
          <Scale className="h-5 w-5 text-primary-foreground" />
          <span className="text-sm font-medium text-primary-foreground/90">
            LC 214/2025 • Reforma Tributária
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 tracking-tight">
          Consulta CST-IBS/CBS
        </h1>
        
        <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
          Sistema de consulta dos novos Códigos de Situação Tributária conforme a Reforma Tributária
        </p>
        
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-primary-foreground/70">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Tabela cClassTrib</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-primary-foreground/50" />
          <span>Vigência: 01/01/2026</span>
        </div>
      </div>
    </header>
  );
};
