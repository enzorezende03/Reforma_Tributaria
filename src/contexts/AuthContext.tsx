import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Client {
  id: string;
  cnpj: string;
  company_name: string;
}

interface AuthContextType {
  client: Client | null;
  isAuthenticated: boolean;
  login: (cnpj: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe sessão salva
    const savedClient = localStorage.getItem('client_session');
    if (savedClient) {
      try {
        setClient(JSON.parse(savedClient));
      } catch {
        localStorage.removeItem('client_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (cnpj: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Formatar CNPJ removendo caracteres especiais
      const formattedCnpj = cnpj.replace(/\D/g, '');
      
      // Buscar cliente pelo CNPJ
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('id, cnpj, company_name, password_hash, is_active')
        .eq('cnpj', formattedCnpj)
        .single();

      if (error || !clientData) {
        return { success: false, error: 'CNPJ não encontrado' };
      }

      if (!clientData.is_active) {
        return { success: false, error: 'Conta desativada. Entre em contato com o suporte.' };
      }

      // Verificar senha (comparação simples - em produção use hash)
      if (clientData.password_hash !== password) {
        return { success: false, error: 'Senha incorreta' };
      }

      const loggedClient: Client = {
        id: clientData.id,
        cnpj: clientData.cnpj,
        company_name: clientData.company_name,
      };

      setClient(loggedClient);
      localStorage.setItem('client_session', JSON.stringify(loggedClient));
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const logout = () => {
    setClient(null);
    localStorage.removeItem('client_session');
  };

  return (
    <AuthContext.Provider value={{ 
      client, 
      isAuthenticated: !!client, 
      login, 
      logout,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
