import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  cnpj: string;
  company_name: string;
  mustChangePassword?: boolean;
}

interface ClientSession {
  client: Client;
  expiresAt: number;
}

// Session expires after 30 minutes of inactivity
const SESSION_DURATION_MS = 30 * 60 * 1000;

interface AuthContextType {
  client: Client | null;
  isAuthenticated: boolean;
  login: (cnpj: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  setMustChangePassword: (value: boolean) => void;
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

  // Função para renovar a sessão
  const refreshSession = () => {
    const savedSession = localStorage.getItem('client_session');
    if (savedSession) {
      try {
        const session: ClientSession = JSON.parse(savedSession);
        if (Date.now() < session.expiresAt) {
          const refreshedSession: ClientSession = {
            client: session.client,
            expiresAt: Date.now() + SESSION_DURATION_MS
          };
          localStorage.setItem('client_session', JSON.stringify(refreshedSession));
        }
      } catch {
        // Ignore parsing errors during refresh
      }
    }
  };

  useEffect(() => {
    // Verificar se existe sessão salva e se ainda é válida
    const savedSession = localStorage.getItem('client_session');
    if (savedSession) {
      try {
        const session: ClientSession = JSON.parse(savedSession);
        // Check if session has expired
        if (Date.now() < session.expiresAt) {
          setClient(session.client);
          // Refresh session expiration on load
          refreshSession();
        } else {
          // Session expired - clean up
          localStorage.removeItem('client_session');
        }
      } catch {
        localStorage.removeItem('client_session');
      }
    }
    setIsLoading(false);

    // Renovar sessão quando a aba volta a ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const savedSession = localStorage.getItem('client_session');
        if (savedSession) {
          try {
            const session: ClientSession = JSON.parse(savedSession);
            if (Date.now() < session.expiresAt) {
              setClient(session.client);
              refreshSession();
            } else {
              // Sessão expirou enquanto estava fora
              setClient(null);
              localStorage.removeItem('client_session');
            }
          } catch {
            // Ignore
          }
        }
      }
    };

    // Renovar sessão em qualquer interação do usuário
    const handleUserActivity = () => {
      if (client) {
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
    };
  }, [client]);

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
      const result = data as unknown as { 
        success: boolean; 
        error?: string; 
        client?: { 
          id: string; 
          cnpj: string; 
          company_name: string;
          must_change_password?: boolean;
        } 
      };

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (result.client) {
        const clientData: Client = {
          id: result.client.id,
          cnpj: result.client.cnpj,
          company_name: result.client.company_name,
          mustChangePassword: result.client.must_change_password ?? false,
        };
        setClient(clientData);
        // Store session with expiration timestamp
        const session: ClientSession = {
          client: clientData,
          expiresAt: Date.now() + SESSION_DURATION_MS
        };
        localStorage.setItem('client_session', JSON.stringify(session));
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

  const setMustChangePassword = (value: boolean) => {
    if (client) {
      const updatedClient = { ...client, mustChangePassword: value };
      setClient(updatedClient);
      // Preserve session expiration when updating client data
      const session: ClientSession = {
        client: updatedClient,
        expiresAt: Date.now() + SESSION_DURATION_MS
      };
      localStorage.setItem('client_session', JSON.stringify(session));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      client, 
      isAuthenticated: !!client, 
      login, 
      logout,
      isLoading,
      setMustChangePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
