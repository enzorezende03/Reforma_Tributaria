import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Admin {
  id: string;
  email: string;
  name: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin_session');
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch {
        localStorage.removeItem('admin_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('id, email, name, password_hash, is_active')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        return { success: false, error: 'Erro ao verificar credenciais' };
      }

      if (!adminData) {
        return { success: false, error: 'Email não encontrado' };
      }

      if (!adminData.is_active) {
        return { success: false, error: 'Conta desativada' };
      }

      if (adminData.password_hash !== password) {
        return { success: false, error: 'Senha incorreta' };
      }

      const loggedAdmin: Admin = {
        id: adminData.id,
        email: adminData.email,
        name: adminData.name,
      };

      setAdmin(loggedAdmin);
      localStorage.setItem('admin_session', JSON.stringify(loggedAdmin));
      
      return { success: true };
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin_session');
  };

  return (
    <AdminAuthContext.Provider value={{ 
      admin, 
      isAuthenticated: !!admin, 
      login, 
      logout,
      isLoading 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
