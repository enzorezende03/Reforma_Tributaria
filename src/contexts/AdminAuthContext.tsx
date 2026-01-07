import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Admin {
  id: string;
  email: string;
  name: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
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

  const checkAdminRole = async (user: User): Promise<Admin | null> => {
    // Verificar se o usuário tem role de admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return null;
    }

    // Buscar dados do admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id, email, name')
      .eq('email', user.email)
      .maybeSingle();

    if (adminData) {
      return {
        id: adminData.id,
        email: adminData.email,
        name: adminData.name,
      };
    }

    // Se não existe na tabela admins, usar dados do auth
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || 'Admin',
    };
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const adminData = await checkAdminRole(session.user);
          setAdmin(adminData);
        } else {
          setAdmin(null);
        }
        setIsLoading(false);
      }
    );

    // Then check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const adminData = await checkAdminRole(session.user);
        setAdmin(adminData);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email ou senha incorretos' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Erro ao fazer login' };
      }

      // Verificar se tem role de admin
      const adminData = await checkAdminRole(data.user);
      
      if (!adminData) {
        await supabase.auth.signOut();
        return { success: false, error: 'Você não tem permissão de administrador' };
      }

      setAdmin(adminData);
      return { success: true };
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
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
