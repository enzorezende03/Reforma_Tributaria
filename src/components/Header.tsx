import { FileText, LogOut, Building2, Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo2m from "@/assets/logo-2m.png";

export const Header = () => {
  const { client, logout } = useAuth();
  const { admin, isAuthenticated: isAdminAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 px-6">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
      </div>
      
      {/* Admin viewing as client banner */}
      {isAdminAuthenticated && (
        <div className="absolute top-0 left-0 right-0 bg-amber-500 text-amber-900 py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          Você está visualizando como cliente
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToAdmin}
            className="ml-4 bg-amber-600 hover:bg-amber-700 text-white h-7 px-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar ao Painel Admin
          </Button>
        </div>
      )}
      
      {/* User info and logout */}
      {client && !isAdminAuthenticated && (
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
            <Building2 className="h-4 w-4 text-white/80" />
            <span className="text-sm font-medium text-white/90 max-w-[200px] truncate">
              {client.company_name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      )}

      {/* Admin viewing info */}
      {isAdminAuthenticated && (
        <div className="absolute top-12 right-4 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-white/90">
              {admin?.name} (Admin)
            </span>
          </div>
        </div>
      )}
      
      <div className={`relative max-w-4xl mx-auto text-center ${isAdminAuthenticated ? 'mt-8' : ''}`}>
        {/* Logo com faixa branca */}
        <div className="flex justify-center mb-6">
          <div className="px-8 py-4 bg-white rounded-xl shadow-lg">
            <img src={logo2m} alt="2M Contabilidade" className="h-16 w-auto" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Reforma Tributária - LC 214/2025
        </h1>
        
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
          Sistema integrado de consultas e ferramentas para o novo modelo tributário brasileiro
        </p>
        
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Vigência: 01/01/2026</span>
          </div>
        </div>
      </div>
    </header>
  );
};
