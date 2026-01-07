import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      // Formatar CNPJ removendo caracteres especiais
      const formattedCnpj = cnpj.replace(/\D/g, '');
      
      // Usar função segura de verificação de login
      const { data, error } = await supabase.rpc('verify_client_login', {
        p_cnpj: formattedCnpj,
        p_password: password
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
      }

      // A função retorna um JSON com success e client ou error
      const result = data as unknown as { success: boolean; error?: string; client?: Client };

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (result.client) {
        setClient(result.client);
        localStorage.setItem('client_session', JSON.stringify(result.client));
        return { success: true };
      }

      return { success: false, error: 'Erro ao fazer login' };
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
